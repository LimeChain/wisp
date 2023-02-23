import { Contract, ethers } from 'ethers';
import * as SimpleLightClient from '../../../abis/SimpleLightClient.json';
import { GOERLI_RPC_ENDPOINT, LIGHT_CLIENT_CONTRACT } from '../../constants';

export class ContractService {
  constructor(
    private readonly lightClientContract: Contract,
    private readonly provider: any,
  ) {
    this.provider = new ethers.providers.JsonRpcProvider(
      GOERLI_RPC_ENDPOINT,
    ) as ethers.providers.Web3Provider;

    this.lightClientContract = new ethers.Contract(
      LIGHT_CLIENT_CONTRACT,
      SimpleLightClient,
      this.provider,
    );
  }

  getContract() {
    return this.lightClientContract;
  }
}
