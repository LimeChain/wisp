import { MessageDTO } from "./messages/dtos/message.dto";

export type Groth16Proof = {
  a: string[],
  b: string[][],
  c: string[]
}

export type LightClientUpdate = {
  attestedHeader: Header,
  finalizedHeader: Header,
  finalityBranch: string[],
  blockNumber: number,
  blockNumberBranch: string[],
  nextSyncCommitteeRoot: string,
  nextSyncCommitteeBranch: string[],
  executionStateRoot: string,
  executionStateRootBranch: string[],
  signature: BlsAggregatedSignature
}

export type Header = {
  slot: number
  proposerIndex: number
  parentRoot: string
  stateRoot: string
  bodyRoot: string
}

export type BlsAggregatedSignature = {
  participation: number,
  proof: Groth16Proof
}

export class CRCMessage {
  version: number;
  destinationChainId: string;
  nonce: string;
  user: string;
  target: string;
  payload: string;
  stateRelayFee: string;
  deliveryFee: string;
  extra: string;

  static fromDTO(message: MessageDTO): CRCMessage {
    return {
      version: message.version,
      destinationChainId: message.targetChainId.toString(),
      nonce: message.nonce,
      user: message.user,
      target: message.target,
      payload: message.payload,
      stateRelayFee: message.stateRelayFee,
      deliveryFee: message.deliveryFee,
      extra: message.extra
    };
  }
}

export type CRCMessageEnvelope = {
  message: CRCMessage,
  sender: string
}

export type OptimismOutputRootMIP = {
  outputRootProof: {
    stateRoot: string,
    withdrawalStorageRoot: string,
    latestBlockhash: string
  }
  optimismStateProofsBlob: string
}

export type OptimismMessageMIP = {
  target: string,
  slotPosition: string,
  proofsBlob: string
}
