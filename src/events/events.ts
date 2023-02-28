export namespace Events {
  // Emitted when new LightClientUpdate is prepared and must be broadcast to light client contracts
  export const LIGHT_CLIENT_HEAD_UPDATE = 'light-client.head-update';
  // Emitted when new LightClientUpdate and SyncCommittee Mapping is prepared and must be broadcast to light client contracts
  export const LIGHT_CLIENT_SYNC_COMMITTEE_UPDATE = 'light-client.sync-committee-update'

  // Emitted when new head has been received from the chain
  export const LIGHT_CLIENT_NEW_HEAD = 'light-client.new-head';
  // Emitted when new sync committee has been received from the chain
  export const LIGHT_CLIENT_NEW_SYNC_COMMITTEE_PERIOD = 'light-client.new-sync-committee';
}