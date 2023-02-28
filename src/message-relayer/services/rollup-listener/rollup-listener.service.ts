import { Inject, Injectable, Logger } from "@nestjs/common";
import { DATA_LAYER_SERVICE } from "../../../constants";
import { IDataLayer } from "src/data-layer/IDataLayer";
import { Contract, ethers } from "ethers";
import * as L1RollupStateContract from "../../../../abis/Optimism/OutputOracle.json";
import { NetworkConfig } from "../../../configuration";

@Injectable()
export class RollupListener {

  private readonly logger: Logger;
  private readonly l1RollupState: Contract;

  constructor(
    @Inject(DATA_LAYER_SERVICE)
    private readonly dataLayerService: IDataLayer,
    private readonly networkConfig: NetworkConfig,
    private readonly l1RpcUrl: string
  ) {
    this.logger = new Logger(`${RollupListener.name}-${networkConfig.name}`);

    // Initialise Rollup contract listener instance
    const provider = new ethers.providers.JsonRpcProvider(l1RpcUrl);
    this.l1RollupState = new ethers.Contract(networkConfig.outgoing.l1RollupContract, L1RollupStateContract, provider);

    // Subscribe to rollup state update event
    this.l1RollupState.on("OutputProposed", this.onNewBatchPosted.bind(this));
    this.logger.log(`Instantiated contract at ${this.l1RollupState.address}`);
  }

  async onNewBatchPosted(...args) {
    const tx = args[args.length - 1];
    const L1BlockNumber = tx.blockNumber;
    await this.dataLayerService.updateMessages(L1BlockNumber);
  }
}
