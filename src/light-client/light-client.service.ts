import { Injectable, Logger } from "@nestjs/common";
import { BeaconService } from "./beacon/beacon.service";
import { altair } from "@lodestar/types";
import { lodestar } from "../lodestar-types";
import { createProof, ProofType, SingleProof } from "@chainsafe/persistent-merkle-tree";
import { ethers } from "ethers";
import { Utils } from "../utils";
import { Groth16Proof, ProverService, ROOT_BYTE_LENGTH } from "./prover/prover.service";
import { ContractsService } from "./contracts/contracts.service";

const NODE_LENGTH = 32;

@Injectable()
export class LightClientService {

  private readonly logger = new Logger(LightClientService.name);
  private head: number = 0;
  private pendingHeadUpdate: number = 0;
  private SYNC_COMMITTEE_SIZE: number = 512;
  private MIN_SYNC_COMMITTEE_PARTICIPATION = Math.ceil(this.SYNC_COMMITTEE_SIZE * 2 / 3);

  constructor(
    private beaconService: BeaconService,
    private proverService: ProverService,
    private contractsService: ContractsService
  ) {
  }

  async processFinalityUpdate(update: altair.LightClientUpdate) {
    const attestedSlot = update.attestedHeader.beacon.slot;
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

    // 1. Request BLS Header Verify ZKP
    const blsHeaderSignatureProofPromise = this.proverService.computeBlsHeaderSignatureProof(update);
    this.logger.log(`Requested ZKP for Light Client finality update of slot=${finalizedSlot}`);
    this.pendingHeadUpdate = finalizedSlot;

    // 2. Prepare Header Update
    const lcUpdate = await this.buildLightClientUpdate(update);

    // 4. Wait for both ZKPs
    lcUpdate.signature.proof = await blsHeaderSignatureProofPromise;
    lcUpdate.signature.participation = participation;

    // 5. Broadcast header updates to all on-chain Light Client contracts
    this.contractsService.broadcast(lcUpdate);
    // TODO take into account that not all light client contracts are at the same height?
    this.head = finalizedSlot;
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

    let syncCommitteeRoot = ethers.constants.HashZero;
    let syncCommitteeRootNodes = [];
    if (update.nextSyncCommittee) {
      // TODO compute syncCommitteeRoot and syncCommitteeRootNodes
    }

    return {
      attestedHeader: LightClientService.asHeaderObject(update.attestedHeader.beacon),
      finalizedHeader: LightClientService.asHeaderObject(update.finalizedHeader.beacon),
      executionStateRoot: ethers.utils.hexlify(finalizedBeaconBody.executionPayload.stateRoot),
      executionStateRootBranch,
      nextSyncCommitteeRoot: ethers.constants.HashZero, // TODO
      nextSyncCommitteeBranch: [], // TODO
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