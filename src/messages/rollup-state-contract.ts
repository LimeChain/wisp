import { Inject, Injectable, Logger } from "@nestjs/common";
import { DATA_LAYER } from "../constants";
import { IDataLayer } from "src/data-layer/IDataLayer";
import { BigNumber, Contract, ethers } from "ethers";
import * as L1RollupStateContract from "../../abis/Optimism/OutputOracle.json";
import { NetworkConfig } from "../configuration";

@Injectable()
export class RollupStateContract {

  private readonly logger: Logger;
  private readonly chainId: number;
  private readonly l1RollupState: Contract;

  constructor(
    @Inject(DATA_LAYER)
    private readonly dataLayerService: IDataLayer,
    private readonly networkConfig: NetworkConfig,
    private readonly l1RpcUrl: string
  ) {
    this.logger = new Logger(`${RollupStateContract.name}-${networkConfig.name}`);
    this.chainId = networkConfig.chainId;

    // Initialise Rollup contract listener instance
    const provider = new ethers.providers.JsonRpcProvider(l1RpcUrl);
    this.l1RollupState = new ethers.Contract(networkConfig.outgoing.l1RollupContract, L1RollupStateContract, provider);

    // Subscribe to rollup state update event
    this.l1RollupState.on("OutputProposed", this.onNewBatchPosted.bind(this));
    this.logger.log(`Instantiated contract at ${this.l1RollupState.address}`);
  }

  /**
   * Called once `OutputProposed` event is emitted from the corresponding Rollup State contract on L1
   * Updates the l1 block numbers for all messages coming from that rollup that do not have it populated
   * @param outputRoot
   * @param l2OutputIndex
   * @param l2BlockNumber
   * @param l1Timestamp
   * @param eventData
   */
  async onNewBatchPosted(outputRoot: string, l2OutputIndex: BigNumber, l2BlockNumber: BigNumber, l1Timestamp: BigNumber, eventData) {
    this.logger.log(`New state posted on L1 up to L2 BlockNumber = ${l2BlockNumber.toNumber()}`);
    this.dataLayerService.updateWithL1BlockNumber(this.chainId, eventData.blockNumber);
  }
}
