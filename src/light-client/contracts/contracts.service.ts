import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LightClientUpdate } from "../light-client.service";
import { Contract, ethers } from "ethers";
import * as BeaconLightClientABI from "../../../abis/BeaconLightClient.json";

@Injectable()
export class ContractsService {

  private readonly logger = new Logger(ContractsService.name);
  private readonly lightClientContracts: Contract[];
  private readonly contract2Network: Map<string, string>;
  private readonly genesisTime: number;
  private readonly SECONDS_PER_SLOT: number = 12;
  private readonly SLOTS_PER_SYNC_PERIOD: number = 8192;
  public shouldUpdateSyncCommittee: boolean = false;

  constructor(private config: ConfigService) {
    const networkConfigs = config.get<NetworkConfig[]>("lightClient.networks");
    this.genesisTime = config.get<number>("lightClient.genesisTime");

    this.lightClientContracts = [];
    this.contract2Network = new Map<string, string>();
    networkConfigs.forEach(config => {
      const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
      const signer = new ethers.Wallet(config.privateKey, provider);
      const lightClientContract = new ethers.Contract(config.contractAddress, BeaconLightClientABI, signer);
      this.lightClientContracts.push(lightClientContract);
      this.contract2Network.set(lightClientContract.address, config.name);
    });
    let infoLog = "";
    networkConfigs.forEach((config: NetworkConfig) => {
      infoLog += `${config.name}:${config.contractAddress};`;
    });
    this.logger.log(`Started Contracts Service for the following contracts: ${infoLog}`);
  };

  async onModuleInit() {
    // Evaluate Sync Committee State
    // FIXME This assumes that only one network is in the config!
    const currentSyncPeriod = this.getCurrentSyncPeriod();
    const currentRootInContract = await this.lightClientContracts[0].syncCommitteeRootByPeriod(currentSyncPeriod);
    if (currentRootInContract == ethers.constants.HashZero) {
      this.logger.error(`LightClient contract has skipped update of Sync Committee Period. Syncing outdated Light Client contracts is not supported yet!`);
      // TODO exit the application
      return;
    }

    const nextRootInContract = await this.lightClientContracts[0].syncCommitteeRootByPeriod(currentSyncPeriod + 1);
    this.shouldUpdateSyncCommittee = nextRootInContract == ethers.constants.HashZero;
    if (this.shouldUpdateSyncCommittee) {
      this.logger.log(`Scheduled update of Sync Committee mapping in Light Client contracts`);
    } else {
      this.logger.log(`Sync Committee mapping in Light Client contracts is up-to-date`);
    }
  }

  broadcast(update: LightClientUpdate) {
    // TODO take into account that not all light client contracts are at the same height
    this.logger.log(`Updating Light Clients with new finalised slot=${update.finalizedHeader.slot}`);
    this.lightClientContracts.forEach(async (lightClient: Contract) => {
      const network = this.contract2Network.get(lightClient.address);
      try {
        const tx = await lightClient.step(update);
        this.logger.log(`Submitted header update transaction.  { network = ${network}, hash = ${tx.hash}, slot = ${update.finalizedHeader.slot} }`);
        tx.wait().then(result => {
          this.logger.log(`Successfully updated header { network = ${network}, hash = ${tx.hash}, slot = ${update.finalizedHeader.slot} }`);
        }).catch(error => {
          this.logger.error(`Failed to update header { network = ${network}, hash = ${tx.hash}, slot = ${update.finalizedHeader.slot} } Error: ${error}`);
        });
      } catch (error) {
        this.logger.error(`Transaction for header update will fail. { network = ${network}, slot=${update.finalizedHeader.slot} }. Error: ${error.error.reason}`);
      }
    });
  }

  private getCurrentSyncPeriod(): number {
    const currentSlot = Math.floor(((Date.now() / 1000) - this.genesisTime) / this.SECONDS_PER_SLOT);
    return this.getSyncPeriodForSlot(currentSlot);
  }

  private getSyncPeriodForSlot(slot: number): number {
    return Math.floor(slot / this.SLOTS_PER_SYNC_PERIOD);
  }
}

type NetworkConfig = {
  name: string,
  rpcUrl: string,
  chainId: number,
  contractAddress: string,
  privateKey: string
}
