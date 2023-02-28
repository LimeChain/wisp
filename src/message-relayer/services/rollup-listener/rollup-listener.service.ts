import { Inject, Injectable, Logger } from '@nestjs/common';
import { DATA_LAYER_SERVICE, EVENT_OUTPUT_PROPOSED } from '../../../constants';
import { IDataLayer } from 'src/data-layer/IDataLayer';
import { Contract, ethers } from 'ethers';
import * as L1Rollup from '../../../../abis/OutputOracle.json';

@Injectable()
export class RollupListener {
  private readonly logger = new Logger(RollupListener.name);
  private l1RollupContract: Contract;

  constructor(
    @Inject(DATA_LAYER_SERVICE)
    private readonly dataLayerService: IDataLayer,
    private readonly rollup: Contract,
  ) {
    if (rollup.outgoing.supported) {
      if (rollup.name === 'Goerli' || rollup.name === 'Base') {
        const provider = new ethers.providers.JsonRpcProvider(
          rollup.rpcUrl,
        ) as ethers.providers.Web3Provider;

        this.l1RollupContract = new ethers.Contract(
          rollup.outgoing.l1RollupContract,
          L1Rollup,
          provider,
        );

        this.logger.log(
          `${RollupListener.name} initialized for ${rollup.name} network`,
        );

        this.l1RollupContract.on(EVENT_OUTPUT_PROPOSED, async (...args) => {
          console.log(args);
          const tx = args[args.length - 1];
          const L1BlockNumber = tx.blockNumber;
          await this.dataLayerService.updateMessages(L1BlockNumber);
        });
      } else {
      }
    }
  }
}