import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LightClientUpdate } from "../light-client.service";
import { Contract, ethers } from "ethers";
import * as BeaconLightClientABI from "../../../abis/BeaconLightClient.json";

@Injectable()
export class BroadcastService {

  private readonly logger = new Logger(BroadcastService.name);
  private readonly lightClientContracts: Contract[];
  private readonly contract2Network: Map<string, string>;

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
    this.logger.log(`Started Broadcast Service for the following contracts: ${infoLog}`);
  };

  broadcast(update: LightClientUpdate) {
    // TODO take into account that not all light client contracts are at the same height?
    this.logger.log(`Updating LightClients with new finalised slot=${update.finalizedHeader.slot}`);
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
        this.logger.error(`Transaction for header update will fail. { network = ${network}, slot=${update.finalizedHeader.slot} }. Error: ${error.error.reason}`)
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
