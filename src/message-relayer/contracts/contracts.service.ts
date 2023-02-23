import { Contract, ethers } from 'ethers';
import * as Outbox from '../../../abis/Outbox.json';
import { GOERLY_RPC_ENDPOINT, OUTBOX_CONTRACT } from '../constants';

export class ContractService {
  constructor(
    private readonly outboxContract: Contract,
    private readonly provider: any,
  ) {
    this.provider = new ethers.providers.JsonRpcProvider(
      GOERLY_RPC_ENDPOINT,
    ) as ethers.providers.Web3Provider;
    this.outboxContract = new ethers.Contract(
      OUTBOX_CONTRACT,
      Outbox,
      this.provider,
    );
  }

  getContract() {
    return this.outboxContract;
  }
}
