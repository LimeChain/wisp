import { Injectable, Logger } from "@nestjs/common";
import { BeaconService } from "./beacon/beacon.service";
import { altair } from "@lodestar/types";
import { lodestar } from "../lodestar-types";
import { createProof, ProofType, SingleProof } from "@chainsafe/persistent-merkle-tree";
import { ethers } from "ethers";
import { Utils } from "../utils";
import { Groth16Proof, ProverService, ROOT_BYTE_LENGTH } from "./prover/prover.service";

const NODE_LENGTH = 32;

@Injectable()
export class LightClientService {

  private readonly logger = new Logger(LightClientService.name);
  private head: number = 0;

  constructor(private beaconService: BeaconService, private proverService: ProverService, ) {
  }

  async processFinalityUpdate(update: altair.LightClientUpdate) {
    const attestedSlot = update.attestedHeader.beacon.slot;
    const finalizedSlot = update.finalizedHeader.beacon.slot;
    if (this.head >= finalizedSlot) {
      this.logger.log(`Skipping ZKP generation for slot=${finalizedSlot}. Newer finality slot already processed`);
      return;
    }
    if (!this.proverService.hasCapacity()) {
      this.logger.log(`ZKP generation already in progress. Skipping ZKP creation for slot=${finalizedSlot}`);
      return;
    }

    // 1. Request BLS Header Verify ZKP
    const blsHeaderSignatureProofPromise = this.proverService.computeBlsHeaderSignatureProof(update);
    this.logger.log(`Requested ZKP for BLS Header Verification for slot=${finalizedSlot}`);

    // 2. Prepare Header Update
    const lcUpdate = await this.buildLightClientUpdate(update);

    // 4. Wait for both ZKPs
    lcUpdate.signature.proof = await blsHeaderSignatureProofPromise;

    this.logger.log(lcUpdate);
    this.head = finalizedSlot;
    // 5. Broadcast header updates to all on-chain Light Client contracts
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

    const participation = Utils.syncCommitteeBytes2bits(update.syncAggregate.syncCommitteeBits)
      .reduce((res, bit) => {
        return res + bit;
      });

    return {
      attestedHeader: LightClientService.asHeaderObject(update.attestedHeader.beacon),
      finalizedHeader: LightClientService.asHeaderObject(update.finalizedHeader.beacon),
      executionStateRoot: ethers.utils.hexlify(finalizedBeaconBody.executionPayload.stateRoot),
      executionStateRootBranch,
      nextSyncCommitteeRoot: "", // TODO
      nextSyncCommitteeBranch: [], // TODO
      finalityBranch: update.finalityBranch.map(node => {
        return ethers.utils.hexlify(Utils.asUint8Array(node, NODE_LENGTH));
      }),
      signature: {
        participation,
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

type LightClientUpdate = {
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