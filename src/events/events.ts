import { BigNumber } from "ethers";

export namespace Events {
  // Emitted when new LightClientUpdate is prepared and must be broadcast to light client contracts
  export const LIGHT_CLIENT_HEAD_UPDATE = "light-client.head-update";
  // Emitted when new LightClientUpdate and SyncCommittee Mapping is prepared and must be broadcast to light client contracts
  export const LIGHT_CLIENT_SYNC_COMMITTEE_UPDATE = "light-client.sync-committee-update";
  // Emitted when the Light Client has been initialised
  export const LIGHT_CLIENT_INITIALISED = "light-client.init";

  // Emitted when new head has been received from the chain
  export const LIGHT_CLIENT_NEW_HEAD = "light-client.new-head";
  // Payload used on LIGHT_CLIENT_NEW_HEAD events
  export type HeadUpdate = {
    chainId: number,
    slot: number,
    blockNumber: number,
    executionRoot: string,
    transactionCost: BigNumber
  }

  // Emitted when new sync committee has been received from the chain
  export const LIGHT_CLIENT_NEW_SYNC_COMMITTEE_PERIOD = "light-client.new-sync-committee";
  // Payload used on LIGHT_CLIENT_NEW_SYNC_COMMITTEE_PERIOD events
  export type SyncCommitteeUpdate = {
    chainId: number,
    period: number,
    syncCommitteeRoot: string
  }
}