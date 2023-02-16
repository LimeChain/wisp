import { Injectable, Logger } from "@nestjs/common";
import { altair } from "@lodestar/types";
import { ProverService } from "./prover/prover.service";

@Injectable()
export class AppService {

  constructor(private proverService: ProverService) {
  }


  private readonly logger = new Logger(AppService.name);

  async processFinalityUpdate(update: altair.LightClientFinalityUpdate) {
    // 1. Compute BLS Header Verify ZKP
    const headerProofPromise = await this.proverService.computeHeaderProof(update);

    // 2. Compute SSZ to Poseidon ZKP if necessary
    // 3. Wait for both ZKPs
    // 4. Broadcast Header updates to all on-chain Light Client contracts
  }

}
