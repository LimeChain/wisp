import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LightClientUpdate } from "../light-client.service";
import { Contract, ethers } from "ethers";
import * as BeaconLightClientABI from "../../../abis/BeaconLightClient.json";
import { Groth16Proof } from "../prover/prover.service";

@Injectable()
export class ContractsService {

  private readonly logger = new Logger(ContractsService.name);
  private readonly lightClientContracts: Contract[];
  private readonly contract2Network: Map<string, string>;
  private readonly SLOTS_PER_SYNC_PERIOD: number = 8192;
  public shouldUpdateSyncCommittee: boolean = false;

  constructor(private config: ConfigService) {
    const networkConfigs = config.get<NetworkConfig[]>("lightClient.networks");

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

  async getSyncCommitteeRootsByPeriods(periods: number[]) {
    let results = [];
    periods.forEach(period => {
      results.push(this.lightClientContracts[0].syncCommitteeRootByPeriod(period));
    });
    return Promise.all(results);
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

  broadcastWithSyncCommitteeUpdate(update: LightClientUpdate, nextSyncCommitteePoseidon: string, proof: Groth16Proof) {
    // TODO take into account that not all light client contracts are at the same height
    const period = Math.floor(update.finalizedHeader.slot / this.SLOTS_PER_SYNC_PERIOD);
    this.logger.log(`Updating Light Clients with new finalised slot = ${update.finalizedHeader.slot} ` +
      `and Sync Committee for period = ${period}`);

    this.lightClientContracts.forEach(async (lightClient: Contract) => {
      const network = this.contract2Network.get(lightClient.address);
      try {
        const tx = await lightClient.updateSyncCommittee(update, nextSyncCommitteePoseidon, proof);
        this.logger.log(`Submitted Sync Committee Update transaction.  { network = ${network}, hash = ${tx.hash}, period = ${period}, slot = ${update.finalizedHeader.slot} }`);
        tx.wait().then(() => {
          this.logger.log(`Successfully updated Sync Committee and Header { network = ${network}, hash = ${tx.hash}, period = ${period}, slot = ${update.finalizedHeader.slot} }`);
        }).catch(error => {
          this.logger.error(`Failed to update Sync Committee and Header { network = ${network}, hash = ${tx.hash}, period = ${period}, slot = ${update.finalizedHeader.slot} } Error: ${error}`);
        });
      } catch (error) {
        this.logger.error(`Transaction for Sync Committee and Header update will fail. { network = ${network}, period = ${period}, slot=${update.finalizedHeader.slot} }. Error: ${error.error.reason}`);
      }
    });
  }
}

type NetworkConfig = {
  name: string,
  rpcUrl: string,
  chainId: number,
  contractAddress: string,
  privateKey: string
}
