import { Injectable, Logger } from '@nestjs/common';
import {
  GOERLI_OPTIMISM_RPC_ENDPOINT,
  GOERLI_RPC_ENDPOINT,
  HEAD_UPDATE,
} from 'src/constants';
import { ContractService } from './contracts/contracts.service';
import * as Extractoor from 'extractoor';

@Injectable()
export class LightClientRelayService {
  private readonly logger = new Logger(LightClientRelayService.name);
  constructor(private contractService: ContractService) {}

  async init() {
    this.logger.log(`${LightClientRelayService.name} initialized`);

    const fetcher = new Extractoor.OptimismExtractoorClient(
      GOERLI_OPTIMISM_RPC_ENDPOINT,
      GOERLI_RPC_ENDPOINT,
    );

    const lightClientContract = this.contractService.getContract();
    lightClientContract.on(HEAD_UPDATE, async (...args) => {
      const tx = args[args.length - 1];
      const newBlockHeaderNumber = tx.args.blockNumber.toNumber();
      const L1BlockNumber = tx.blockNumber;

      if (newBlockHeaderNumber >= L1BlockNumber) {
        console.log('Trigger receiving flow here');
      }
    });
  }
}
