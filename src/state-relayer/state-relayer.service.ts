import { Inject, Injectable, Logger } from '@nestjs/common';
import { DATA_LAYER_SERVICE, EVENT_OUTPUT_PROPOSED } from '../constants';
import { ContractService } from './contracts/contracts.service';
import { IDataLayer } from 'src/data-layer/IDataLayer';

@Injectable()
export class StateRelayerService {
  private readonly logger = new Logger(StateRelayerService.name);
  constructor(
    @Inject(DATA_LAYER_SERVICE)
    private readonly dataLayerService: IDataLayer,
    private contractService: ContractService,
  ) {}

  async init() {
    this.logger.log(`${StateRelayerService.name} initialized`);

    const outputOracleContract = this.contractService.getContract();
    outputOracleContract.on(EVENT_OUTPUT_PROPOSED, async (...args) => {
      const tx = args[args.length - 1];
      const L1BlockNumber = tx.blockNumber;
      await this.dataLayerService.updateMessages(L1BlockNumber);
    });
  }
}
