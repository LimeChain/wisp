import { Inject, Injectable, Logger } from "@nestjs/common";
import { BeaconService } from "./beacon/beacon.service";
import { altair } from "@lodestar/types";
import { lodestar } from "../lodestar-types";
import { createProof, ProofType, SingleProof } from "@chainsafe/persistent-merkle-tree";
import { ethers } from "ethers";
import { Utils } from "../utils";
import { ProverService } from "./prover/prover.service";
import { ConfigService } from "@nestjs/config";
import { Events } from "../events/events";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { LightClientContract } from "./light-client-contract";
import { Header, LightClientUpdate } from "../models";
import {
  MIN_SYNC_COMMITTEE_PARTICIPATION,
  ROOT_BYTE_LENGTH,
  SECONDS_PER_SLOT,
  SLOTS_PER_SYNC_PERIOD
} from "../constants/constants";

const NODE_LENGTH = 32;

@Injectable()
export class LightClientService {
  private readonly logger = new Logger(LightClientService.name);

  // Constants
  private readonly genesisTime: number;

  // State
  private head: number = 0;
  private nextPeriodUpdateAt: number = 0;
  private pendingHeadUpdate: number = 0;
  private readonly chain2Head = new Map<number, number>();
  private readonly chain2Period = new Map<number, number>();

  constructor(
    private readonly beaconService: BeaconService,
    private readonly proverService: ProverService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    @Inject("LightClients") private readonly lightClients: LightClientContract[]
  ) {
    this.genesisTime = config.get<number>("networks.l1.genesisTime");
    // Subscribe to events
    this.eventEmitter.on(Events.LIGHT_CLIENT_NEW_HEAD, this.onNewHead.bind(this));
    this.eventEmitter.on(Events.LIGHT_CLIENT_NEW_SYNC_COMMITTEE_PERIOD, this.onNewSyncPeriod.bind(this));
  }

  /**
   * Loads the Light Client's state and schedules the next sync committee period update
   */
  async onModuleInit() {
    await Promise.all(this.lightClients.map(lc => lc.initialiseState()));
    this.lightClients.forEach(lc => {
      this.chain2Head.set(lc.chainId, lc.head);
      this.chain2Period.set(lc.chainId, lc.syncCommitteePeriod);
    });

    this._recalculateHead();
    this._recalculatePeriodUpdate();
  }

  onNewSyncPeriod(payload: Events.SyncCommitteeUpdate) {
    this.chain2Period.set(payload.chainId, payload.period);
    this._recalculatePeriodUpdate();
  }

  _recalculatePeriodUpdate() {
    const currentSyncPeriod = this.getCurrentSyncPeriod();
    const oldestSyncCommitteePeriod = [...this.chain2Period.values()].sort((p1, p2) => p1 - p2)[0];
    if (oldestSyncCommitteePeriod < currentSyncPeriod) {
      this.logger.warn(`There are outdated Light Client contracts and will not be updated!`);
    } else if (oldestSyncCommitteePeriod == currentSyncPeriod) {
      this.nextPeriodUpdateAt = currentSyncPeriod * SLOTS_PER_SYNC_PERIOD;
      this.logger.log(`Scheduled Sync Committee Period update on next finality update`);
    } else {
      this.nextPeriodUpdateAt = (currentSyncPeriod + 1) * SLOTS_PER_SYNC_PERIOD;
      this.logger.log(`Scheduled Sync Committee Period update at slot = ${this.nextPeriodUpdateAt}`);
    }
  }

  onNewHead(payload: Events.HeadUpdate) {
    this.chain2Head.set(payload.chainId, payload.slot);
    this._recalculateHead();
  }

  _recalculateHead() {
    const heads = [...this.chain2Head.values()];
    const oldestHead = Math.min(...heads);
    if (this.head < oldestHead) {
      this.head = oldestHead;
      this.logger.log(`Updated head. slot = ${this.head}`);
    }
  }

  async processFinalityUpdate(update: altair.LightClientUpdate) {
    const finalizedSlot = update.finalizedHeader.beacon.slot;
    if (this.head >= finalizedSlot) {
      this.logger.debug(`Skipping contract update for slot=${finalizedSlot}. Newer finality slot already processed`);
      return;
    }
    if (this.pendingHeadUpdate >= finalizedSlot) {
      this.logger.debug(`Finality update already in progress for slot = ${finalizedSlot}`);
      return;
    }
    if (!this.proverService.hasCapacity()) {
      this.logger.debug(`Prover does not have capacity. Skipping processing of Finality Update for slot=${finalizedSlot}`);
      return;
    }

    const participation = Utils.syncCommitteeBytes2bits(update.syncAggregate.syncCommitteeBits)
      .reduce((res, bit) => {
        return res + bit;
      });
    if (participation <= MIN_SYNC_COMMITTEE_PARTICIPATION) {
      this.logger.warn(`Skipping finality update due to low participation. Slot = ${finalizedSlot}, Participation = ${participation}`);
      return;
    }
    this.pendingHeadUpdate = finalizedSlot;

    const shouldUpdateSyncCommittee = finalizedSlot >= this.nextPeriodUpdateAt;
    // 1. If SyncCommittee must be updated, start Root and Proof generation processes
    const beaconStatePromise = shouldUpdateSyncCommittee ? this.getBeaconState(finalizedSlot) : Promise.resolve();

    // 2. Request BLS Header Verify ZKP
    const blsHeaderSignatureProofPromise = this.proverService.computeBlsHeaderSignatureProof(update);
    this.logger.log(`Requested ZKP for a signed Beacon Header of slot=${finalizedSlot}`);

    // 3. Prepare Header Update
    const lcUpdate = await this.buildLightClientUpdate(update);

    // 4. Wait for promises to resolve
    const promiseResults = await Promise.all([blsHeaderSignatureProofPromise, beaconStatePromise]);
    lcUpdate.signature.proof = promiseResults[0];
    lcUpdate.signature.participation = participation;

    // 5. Broadcast header updates to all on-chain Light Client contracts
    if (shouldUpdateSyncCommittee) {
      const syncCommitteeUpdate = await this.prepareSyncCommitteeUpdate(promiseResults[1]);
      lcUpdate.nextSyncCommitteeRoot = syncCommitteeUpdate.nextSyncCommitteeRoot;
      lcUpdate.nextSyncCommitteeBranch = syncCommitteeUpdate.nextSyncCommitteeRootBranch;
      const nextSyncCommitteePoseidon = syncCommitteeUpdate.syncCommitteePoseidon;
      const ssz2PoseidonProof = syncCommitteeUpdate.proof;

      this.eventEmitter.emit(Events.LIGHT_CLIENT_SYNC_COMMITTEE_UPDATE, {
        update: lcUpdate,
        nextSyncCommitteePoseidon,
        proof: ssz2PoseidonProof
      });
    }
    this.eventEmitter.emit(Events.LIGHT_CLIENT_HEAD_UPDATE, lcUpdate);
  }

  private async getBeaconState(slot: number) {
    this.logger.log(`Downloading Beacon State at slot = ${slot}`);
    return await this.beaconService.getBeaconState(slot);
  }

  private async prepareSyncCommitteeUpdate(beaconState) {
    // 1. Request SyncCommittee Commitment proof from Prover
    const syncCommitteeZKP = this.proverService.computeSyncCommitteeCommitmentProof(beaconState.nextSyncCommittee);
    this.logger.log(`Requested ZKP for Sync Committee update of slot = ${beaconState.slot}`);

    // 2. Compute the Root + MerkleInclusionProof branches while waiting for proof
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
    const executionStateRootMIP = createProof(
      lodestar.ssz.bellatrix.BeaconBlockBody.toView(finalizedBeaconBody).node, {
        type: ProofType.single,
        gindex: lodestar.ssz.bellatrix.BeaconBlockBody.getPathInfo(["executionPayload", "stateRoot"]).gindex
      }
    ) as SingleProof;
    const executionStateRootBranch = executionStateRootMIP.witnesses.map(witnessNode => {
      return ethers.utils.hexlify(witnessNode);
    });
    const blockNumberMIP = createProof(
      lodestar.ssz.bellatrix.BeaconBlockBody.toView(finalizedBeaconBody).node, {
        type: ProofType.single,
        gindex: lodestar.ssz.bellatrix.BeaconBlockBody.getPathInfo(["executionPayload", "blockNumber"]).gindex
      }
    ) as SingleProof;
    const blockNumberBranch = blockNumberMIP.witnesses.map(witnessNode => {
      return ethers.utils.hexlify(witnessNode);
    });

    return {
      attestedHeader: LightClientService.asHeaderObject(update.attestedHeader.beacon),
      finalizedHeader: LightClientService.asHeaderObject(update.finalizedHeader.beacon),
      executionStateRoot: ethers.utils.hexlify(finalizedBeaconBody.executionPayload.stateRoot),
      executionStateRootBranch,
      blockNumber: finalizedBeaconBody.executionPayload.blockNumber,
      blockNumberBranch,
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
    const currentSlot = Math.floor(((Date.now() / 1000) - this.genesisTime) / SECONDS_PER_SLOT);
    return Utils.getSyncPeriodForSlot(currentSlot);
  }

}