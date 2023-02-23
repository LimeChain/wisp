import { Injectable, Logger } from '@nestjs/common';
import { HEAD_UPDATE } from 'src/constants';
import { ContractService } from './contracts/contracts.service';

@Injectable()
export class LightClientRelayService {
  private readonly logger = new Logger(LightClientRelayService.name);
  constructor(private contractService: ContractService) {}

  async init() {
    this.logger.log(`${LightClientRelayService.name} initialized`);

    const lightClientContract = this.contractService.getContract();
    console.log(lightClientContract);
    lightClientContract.on(HEAD_UPDATE, async (...args) => {
      const tx = args[args.length - 1];
      console.log(tx);

      //this.logger.log(`Messages: ${JSON.stringify(message)}}`);
    });
  }
}
