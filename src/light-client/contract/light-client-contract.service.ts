import { Contract, ethers } from "ethers";
import * as BeaconLightClientABI from "../../../abis/BeaconLightClient.json";
import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { NetworkConfig } from "../../configuration";
import { Events } from "../../events/events";
import { Groth16Proof, LightClientUpdate } from "../../model";
import { Utils } from "../../utils";

@Injectable()
export class LightClientContract {

  public readonly name;
  public readonly chainId: number;
  private readonly logger: Logger;
  private readonly lightClient: Contract;

  // head = 15000; period = 1; -> period=2
  // math.floor(head/8192) + 1

  public head: number = 0;
  public syncCommitteePeriod: number = 0;

  constructor(private readonly networkConfig: NetworkConfig, private readonly eventEmitter: EventEmitter2) {
    this.logger = new Logger(`${LightClientContract.name}-${networkConfig.name}`);
    this.name = networkConfig.name;
    this.chainId = networkConfig.chainId;

    // Initialise Light Client instance
    const provider = new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
    const signer = new ethers.Wallet(networkConfig.privateKey, provider);
    this.lightClient = new ethers.Contract(networkConfig.contractAddress, BeaconLightClientABI, signer);

    // Subscribe to events
    this.eventEmitter.on(Events.LIGHT_CLIENT_HEAD_UPDATE, this.onUpdate.bind(this));
    this.eventEmitter.on(Events.LIGHT_CLIENT_SYNC_COMMITTEE_UPDATE, this.onUpdateWithSyncCommittee.bind(this));
    this.lightClient.on("HeadUpdate", this.onNewHead.bind(this));
    this.lightClient.on("SyncCommitteeUpdate", this.onNewSyncPeriod.bind(this));

    this.logger.log(`Instantiated contract at ${this.address}`);
  }

  /**
   * Loads the `head` and `sync period`
   */
  async initialiseState() {
    this.syncCommitteePeriod = (await this.lightClient.latestSyncCommitteePeriod() as ethers.BigNumber).toNumber();
    this.head = (await this.lightClient.head() as ethers.BigNumber).toNumber();
    this.logger.log(`Initialised contract state. slot = ${this.head}, period = ${this.syncCommitteePeriod}`);
  }

  async onUpdate(update: LightClientUpdate) {
    if (this.head >= update.finalizedHeader.slot) {
      this.logger.debug(`Head update published, but slot is outdated. Skipping broadcast.`);
      return;
    }
    if (this.shouldUpdateWithSyncCommittee(update.finalizedHeader.slot)) {
      this.logger.debug(`Head update published, but waiting for Update with Sync Committee. slot = ${update.finalizedHeader.slot}, period on-chain = ${this.syncCommitteePeriod}`);
      return;
    }
    try {
      const tx = await this.lightClient.update(update);
      this.logger.log(`Submitted header update transaction. Hash = ${tx.hash}, slot = ${update.finalizedHeader.slot}`);
      tx.wait().catch(e => {
        this.logger.error(`Failed to update header. Hash = ${tx.hash}, slot = ${update.finalizedHeader.slot} } Error: ${e}`);
      });
    } catch (e) {
      this.logger.error(`Transaction for header update will fail. Slot=${update.finalizedHeader.slot} }. Error: ${e.error.reason}`);
    }
  }

  async onUpdateWithSyncCommittee(payload: { update: LightClientUpdate, nextSyncCommitteePoseidon: string, proof: Groth16Proof }) {
    if (this.head >= payload.update.finalizedHeader.slot) {
      this.logger.debug(`Head and Sync Committee update published, but slot is outdated. Skipping broadcast.`);
      return;
    }
    if (!this.shouldUpdateWithSyncCommittee(payload.update.finalizedHeader.slot)) {
      this.logger.debug(`Head with Sync committee published, but Sync Committee Update is not necessary. slot = ${payload.update.finalizedHeader.slot} period on-chain = ${this.syncCommitteePeriod}`);
      return;
    }
    const { update, nextSyncCommitteePoseidon, proof } = payload;
    try {
      const tx = await this.lightClient.updateWithSyncCommittee(update, nextSyncCommitteePoseidon, proof);
      this.logger.log(`Submitted Header + Sync Committee update transaction. Hash = ${tx.hash}, slot = ${update.finalizedHeader.slot}`);
      tx.wait().catch(e => {
        this.logger.error(`Failed to update Header + Sync Committee period. Hash = ${tx.hash}, slot = ${update.finalizedHeader.slot} } Error: ${e}`);
      });
    } catch (e) {
      this.logger.error(`Transaction for Header + Sync Committee update will fail. Slot=${update.finalizedHeader.slot} }. Error: ${e.error.reason}`);
    }
  }

  onNewHead(slot: ethers.BigNumber, root: string) {
    this.logger.log(`New Head update received. slot = ${slot}`);
    this.head = slot.toNumber();
    this.eventEmitter.emit(Events.LIGHT_CLIENT_NEW_HEAD, { chainId: this.chainId, slot: slot.toNumber(), root });
  }

  onNewSyncPeriod(period: ethers.BigNumber, root: string) {
    this.logger.log(`New Sync Committee update received. period = ${period}`);
    this.syncCommitteePeriod = period.toNumber();
    this.eventEmitter.emit(Events.LIGHT_CLIENT_NEW_SYNC_COMMITTEE_PERIOD, {
      chainId: this.chainId,
      period: period.toNumber(),
      root
    });
  }

  get address() {
    return this.lightClient.address;
  }

  public toString(): string {
    return `(${this.name} - ${this.address})`;
  }

  shouldUpdateWithSyncCommittee(slot:number): boolean {
    return this.syncCommitteePeriod < Utils.getSyncPeriodForSlot(slot) + 1;
  }

}