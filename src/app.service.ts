import { Injectable } from "@nestjs/common";
import { altair } from "@lodestar/types";

@Injectable()
export class AppService {

  async processFinalityUpdate(update: altair.LightClientFinalityUpdate) {
    // 1. Prepare input data
    // 2. Call prover to generate proof
    // 3. Prepare transaction
    // 3. Submit Transaction to Contract
  }

}
