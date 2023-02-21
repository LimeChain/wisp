import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Utils } from "../../utils";
import {lodestar} from "../../lodestar-types";

const BEACON_API_V1 = `/eth/v1/beacon/`;
const BEACON_API_V2 = `/eth/v2/beacon/`;
const PUB_KEY_BATCH_SIZE = 100;

@Injectable()
export class BeaconService {
  private readonly baseUrl;
  private readonly logger = new Logger(BeaconService.name);

  // Caches
  private syncCommitteesCache: Map<number, string[]>;
  private genesisValidatorsRootCache: string;
  // Note: Fork Version cache will not work once a fork occurs on Goerli
  // CRC Node should be restarted to populate the cache again
  private forkVersionCache: string;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>("beaconNode.url");
    this.syncCommitteesCache = new Map<number, string[]>();
  }

  async getSyncCommitteePubKeys(slot: number): Promise<string[]> {
    const syncCommitteePeriod = Utils.syncCommitteePeriodFor(slot)
    const syncCommitteeCache = this.syncCommitteesCache.get(syncCommitteePeriod);
    if (syncCommitteeCache) {
      this.logger.debug(`Using Sync Committee Key Cache. period=${syncCommitteePeriod}; slot=${slot}`);
      return syncCommitteeCache;
    }

    const result = await fetch(`${this.baseUrl + BEACON_API_V1}states/${slot}/sync_committees`);
    const committee = (await result.json()).data.validators;
    const validator2PubKey = new Map<string, string>();
    const validatorDetailsUrl = `${this.baseUrl + BEACON_API_V1}states/${slot}/validators?id=`;
    const requests = [];
    for (let i = 0; i < Math.ceil(committee.length / PUB_KEY_BATCH_SIZE); i++) {
      const validatorIndices = committee.slice(i * PUB_KEY_BATCH_SIZE, (i + 1) * PUB_KEY_BATCH_SIZE);
      requests.push(fetch(validatorDetailsUrl + validatorIndices.toString()));
    }
    const responses = await Promise.all(requests);
    for (let index in responses) {
      const validatorsDetails = (await responses[index].json()).data;
      for (let index in validatorsDetails) {
        const validatorIndex = validatorsDetails[index]["index"];
        const validatorPubkey = Utils.remove0x(validatorsDetails[index]["validator"]["pubkey"]);
        validator2PubKey.set(validatorIndex, validatorPubkey);
      }
    }

    const syncCommitteeKeys = committee.map((validatorIndex: string) => validator2PubKey.get(validatorIndex));
    this.syncCommitteesCache.set(syncCommitteePeriod, syncCommitteeKeys);
    return syncCommitteeKeys;
  }

  async getBeaconBlockBody(slot: number) {
    const response = await fetch(`${this.baseUrl + BEACON_API_V2}blocks/${slot}`);
    const beaconBlockBody = (await response.json())['data']['message']['body'];
    return lodestar.ssz.bellatrix.BeaconBlockBody.fromJson(beaconBlockBody);
  }

  async getGenesisValidatorRoot(): Promise<string> {
    if (this.genesisValidatorsRootCache) {
      return this.genesisValidatorsRootCache;
    }
    const response = await fetch(`${this.baseUrl + BEACON_API_V1}genesis`);
    this.genesisValidatorsRootCache = (await response.json()).data["genesis_validators_root"];
    return this.genesisValidatorsRootCache;
  }

  async getForkVersion(slot: number): Promise<string> {
    if (this.forkVersionCache) {
      return this.forkVersionCache;
    }
    const response = await fetch(`${this.baseUrl + BEACON_API_V1}states/${slot}/fork`);
    this.forkVersionCache = (await response.json()).data["current_version"];
    return this.forkVersionCache;
  }
}
