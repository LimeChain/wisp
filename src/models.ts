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

export type CRCMessage = {
  version: number
  destinationChainId: string
  nonce: string
  user: string
  target: string
  payload: string
  stateRelayFee: string
  deliveryFee: string
  extra: string
}
