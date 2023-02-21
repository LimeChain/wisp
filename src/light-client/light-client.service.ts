import { Injectable, Logger } from "@nestjs/common";
import { BeaconService } from "./beacon/beacon.service";
import { altair } from "@lodestar/types";
import { lodestar } from "../lodestar-types";
import { createProof, ProofType, SingleProof } from "@chainsafe/persistent-merkle-tree";
import { ethers } from "ethers";
import { Utils } from "../utils";
import { Groth16Proof, ProverService, ROOT_BYTE_LENGTH } from "./prover/prover.service";
import { ContractsService } from "./contracts/contracts.service";
import { ConfigService } from "@nestjs/config";

const NODE_LENGTH = 32;

@Injectable()
export class LightClientService {

  private readonly logger = new Logger(LightClientService.name);
  private head: number = 0;
  private readonly genesisTime: number;
  private pendingHeadUpdate: number = 0;
  private SECONDS_PER_SLOT: number = 12;
  private SYNC_COMMITTEE_SIZE: number = 512;
  private SLOTS_PER_SYNC_PERIOD: number = 8192;
  private MIN_SYNC_COMMITTEE_PARTICIPATION = Math.ceil(this.SYNC_COMMITTEE_SIZE * 2 / 3);
  private nextSyncCommitteeUpdateAtSlot: number = 0;

  constructor(
    private beaconService: BeaconService,
    private proverService: ProverService,
    private contractsService: ContractsService,
    private config: ConfigService
  ) {
    this.genesisTime = config.get<number>("lightClient.genesisTime");
  }

  async onModuleInit() {
    // Evaluate Sync Committee State
    // FIXME This assumes that only one network is in the config!
    const currentSyncPeriod = this.getCurrentSyncPeriod();
    const roots = await this.contractsService.getSyncCommitteeRootsByPeriods([currentSyncPeriod, currentSyncPeriod + 1]);
    const currentPeriodRootInContract = roots[0];
    if (currentPeriodRootInContract == ethers.constants.HashZero) {
      this.logger.error(`LightClient contract has skipped update of Sync Committee Period. Syncing outdated Light Client contracts is not supported yet!`);
      // TODO exit the application
      return;
    }
    const nextPeriodRootInContract = roots[1];
    if (nextPeriodRootInContract == ethers.constants.HashZero) {
      // Triggers the update at next finality update
      this.nextSyncCommitteeUpdateAtSlot = currentSyncPeriod * this.SLOTS_PER_SYNC_PERIOD;
      this.logger.log(`Scheduled update of Sync Committee mapping on next finality update`);
    } else {
      this.scheduleNextSyncPeriodUpdate();
    }
  }

  async processFinalityUpdate(update: altair.LightClientUpdate) {
    const finalizedSlot = update.finalizedHeader.beacon.slot;
    if (this.head >= finalizedSlot) {
      this.logger.log(`Skipping Light Client contract update for slot=${finalizedSlot}. Newer finality slot already processed`);
      return;
    }
    if (this.pendingHeadUpdate >= finalizedSlot) {
      this.logger.debug(`Light Client Finality update already in progress for slot = ${finalizedSlot}`);
      return;
    }
    if (!this.proverService.hasCapacity()) {
      this.logger.log(`Prover does not have capacity. Skipping ZKP creation for slot=${finalizedSlot}`);
      return;
    }

    const participation = Utils.syncCommitteeBytes2bits(update.syncAggregate.syncCommitteeBits)
      .reduce((res, bit) => {
        return res + bit;
      });
    if (participation <= this.MIN_SYNC_COMMITTEE_PARTICIPATION) {
      this.logger.warn(`Skipping finality update due to low participation. Slot = ${finalizedSlot}, Participation = ${participation}`);
      return;
    }

    // 1. If SyncCommittee must be updated, start Root and Proof generation processes
    const syncCommitteeUpdatePromise = finalizedSlot >= this.nextSyncCommitteeUpdateAtSlot ?
      this.prepareSyncCommitteeUpdate(finalizedSlot) : Promise.resolve({
        nextSyncCommitteeRoot: undefined,
        nextSyncCommitteeRootBranch: undefined,
        proof: undefined,
        syncCommitteePoseidon: undefined
      });

    // 2. Request BLS Header Verify ZKP
    const blsHeaderSignatureProofPromise = this.proverService.computeBlsHeaderSignatureProof(update);
    this.logger.log(`Requested ZKP for Light Client finality update of slot=${finalizedSlot}`);
    this.pendingHeadUpdate = finalizedSlot;

    // 3. Prepare Header Update
    const lcUpdate = await this.buildLightClientUpdate(update);

    // 4. Wait for promises to resolve
    const promiseResults = await Promise.all([blsHeaderSignatureProofPromise, syncCommitteeUpdatePromise]);
    lcUpdate.signature.proof = promiseResults[0];
    lcUpdate.signature.participation = participation;

    // 5. Broadcast header updates to all on-chain Light Client contracts
    if (this.contractsService.shouldUpdateSyncCommittee) {
      lcUpdate.nextSyncCommitteeRoot = promiseResults[1].nextSyncCommitteeRoot;
      lcUpdate.nextSyncCommitteeBranch = promiseResults[1].nextSyncCommitteeRootBranch;
      const nextSyncCommitteePoseidon = promiseResults[1].syncCommitteePoseidon;
      const ssz2PoseidonProof = promiseResults[1].proof;

      this.contractsService.broadcastWithSyncCommitteeUpdate(lcUpdate, nextSyncCommitteePoseidon, ssz2PoseidonProof);
      // FIXME does not take into account that TX may revert
      this.scheduleNextSyncPeriodUpdate();
    } else {
      this.contractsService.broadcast(lcUpdate);
    }
    // FIXME takes into account that all light client contracts are at the same height
    this.head = finalizedSlot;
  }

  private async prepareSyncCommitteeUpdate(slot: number) {
    this.logger.log(`Sync Committee Update started`);
    // 1. Get Beacon state
    const beaconState = await this.beaconService.getBeaconState(slot);
    // 2. Request SyncCommittee Commitment proof from Prover
    const syncCommitteeZKP = this.proverService.computeSyncCommitteeCommitmentProof(beaconState.nextSyncCommittee);
    this.logger.log(`Requested ZKP for Sync Committee update`);

    // 3. Compute the Root + MerkleInclusionProof branches while waiting for proof
    const nextSyncCommitteeRoot = ethers.utils.hexlify(lodestar.ssz.altair.SyncCommittee.hashTreeRoot(beaconState.nextSyncCommittee));
    const merkleInclusionProof = createProof(
      lodestar.ssz.bellatrix.BeaconState.toView(beaconState).node, {
        type: ProofType.single,
        gindex: lodestar.ssz.bellatrix.BeaconState.getPathInfo(["nextSyncCommittee"]).gindex
      }
    ) as SingleProof;
    const nextSyncCommitteeRootBranch = merkleInclusionProof.witnesses.map(witnessNode => {
      return ethers.utils.hexlify(witnessNode);
    });

    const zkp = await syncCommitteeZKP;
    return {
      nextSyncCommitteeRoot,
      nextSyncCommitteeRootBranch,
      proof: zkp.proof,
      syncCommitteePoseidon: zkp.syncCommitteePoseidon
    };
  }

  private async buildLightClientUpdate(update: altair.LightClientUpdate): Promise<LightClientUpdate> {
    const finalizedBeaconBody = await this.beaconService.getBeaconBlockBody(update.finalizedHeader.beacon.slot);
    const merkleInclusionProof = createProof(
      lodestar.ssz.bellatrix.BeaconBlockBody.toView(finalizedBeaconBody).node, {
        type: ProofType.single,
        gindex: lodestar.ssz.bellatrix.BeaconBlockBody.getPathInfo(["executionPayload", "stateRoot"]).gindex
      }
    ) as SingleProof;
    const executionStateRootBranch = merkleInclusionProof.witnesses.map(witnessNode => {
      return ethers.utils.hexlify(witnessNode);
    });

    return {
      attestedHeader: LightClientService.asHeaderObject(update.attestedHeader.beacon),
      finalizedHeader: LightClientService.asHeaderObject(update.finalizedHeader.beacon),
      executionStateRoot: ethers.utils.hexlify(finalizedBeaconBody.executionPayload.stateRoot),
      executionStateRootBranch,
      nextSyncCommitteeRoot: ethers.constants.HashZero,
      nextSyncCommitteeBranch: [],
      finalityBranch: update.finalityBranch.map(node => {
        return ethers.utils.hexlify(Utils.asUint8Array(node, NODE_LENGTH));
      }),
      signature: {
        participation: 0,
        proof: undefined
      }
    };
  }

  private static asHeaderObject(header): Header {
    return {
      slot: header.slot,
      proposerIndex: header.proposerIndex,
      parentRoot: ethers.utils.hexlify(Utils.asUint8Array(header.parentRoot, ROOT_BYTE_LENGTH)),
      stateRoot: ethers.utils.hexlify(Utils.asUint8Array(header.stateRoot, ROOT_BYTE_LENGTH)),
      bodyRoot: ethers.utils.hexlify(Utils.asUint8Array(header.bodyRoot, ROOT_BYTE_LENGTH))
    };
  }

  private getCurrentSyncPeriod(): number {
    const currentSlot = Math.floor(((Date.now() / 1000) - this.genesisTime) / this.SECONDS_PER_SLOT);
    return this.getSyncPeriodForSlot(currentSlot);
  }

  private getSyncPeriodForSlot(slot: number): number {
    return Math.floor(slot / this.SLOTS_PER_SYNC_PERIOD);
  }

  private scheduleNextSyncPeriodUpdate() {
    this.nextSyncCommitteeUpdateAtSlot = (this.getCurrentSyncPeriod() + 1) * this.SLOTS_PER_SYNC_PERIOD;
    this.logger.log(`Scheduled update of Sync Committee mapping at slot = ${this.nextSyncCommitteeUpdateAtSlot}`);
  }
}

export type LightClientUpdate = {
  attestedHeader: Header,
  finalizedHeader: Header,
  finalityBranch: string[],
  nextSyncCommitteeRoot: string,
  nextSyncCommitteeBranch: string[],
  executionStateRoot: string,
  executionStateRootBranch: string[],
  signature: BlsAggregatedSignature
}

type Header = {
  slot: number
  proposerIndex: number
  parentRoot: string
  stateRoot: string
  bodyRoot: string
}

type BlsAggregatedSignature = {
  participation: number,
  proof: Groth16Proof
}