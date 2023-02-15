import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ProverService {

  private readonly baseUrl;
  private readonly proofEndpoint: string = "/api/v1/proof/generate";
  private readonly logger = new Logger(ProverService.name);

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('PROVER_URL');
  }

  async requestSyncCommitteeProof(inputs: any) {
    return this.callProver("ssz2Poseidon", inputs);
  }

  async requestHeaderProof(inputs: any) {
    return this.callProver("blsHeaderVerify", inputs);
  }

  private async callProver(circuit: string, inputs: any) {
    try {
      const response = await fetch(this.baseUrl + this.proofEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ circuit, inputs })
      });
      const result = await response.json();
      if (response.status >= 400) {
        this.logger.error(`Failed to request proof. Error ${result.error}`);
        // TODO throw
      }
      return result;
    } catch (e) {
      this.logger.error(`Failed to request proof. Error ${e.toString()}`)
    }
  }
}
