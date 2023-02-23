import { Contract, ethers } from 'ethers';
import * as OutputOracle from '../../../abis/OutputOracle.json';
import { GOERLI_RPC_ENDPOINT, OUTPUT_ORACLE_CONTRACT } from '../../constants';

export class ContractService {
  constructor(
    private readonly outputOracleContract: Contract,
    private readonly provider: any,
  ) {
    this.provider = new ethers.providers.JsonRpcProvider(
      GOERLI_RPC_ENDPOINT,
    ) as ethers.providers.Web3Provider;

    this.outputOracleContract = new ethers.Contract(
      OUTPUT_ORACLE_CONTRACT,
      OutputOracle,
      this.provider,
    );
  }

  getContract() {
    return this.outputOracleContract;
  }
}
