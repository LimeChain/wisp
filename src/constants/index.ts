export const ROOT_BYTE_LENGTH = 32;
export const AGGREGATE_SIGNATURE_BYTE_LENGTH = 96;
export const SECONDS_PER_SLOT: number = 12;
export const SYNC_COMMITTEE_SIZE: number = 512;
export const SLOTS_PER_SYNC_PERIOD: number = 8192;
export const MIN_SYNC_COMMITTEE_PARTICIPATION = Math.ceil(SYNC_COMMITTEE_SIZE * 2 / 3);
export const DATA_LAYER = 'DataLayer';