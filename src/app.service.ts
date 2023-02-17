import { Injectable, Logger } from "@nestjs/common";
import { altair } from "@lodestar/types";
import { ProverService } from "./prover/prover.service";
import { Utils } from "./utils";

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private head: number = 0;

  constructor(private proverService: ProverService) {
  }

  async processFinalityUpdate(update: altair.LightClientUpdate) {
    const attestedSlot = update.attestedHeader.beacon.slot;
    const finalizedSlot = update.finalizedHeader.beacon.slot;
    if (this.head >= finalizedSlot) {
      this.logger.log(`Skipping ZKP generation for slot=${finalizedSlot}. Newer finality slot already processed`);
      return;
    }
    if (!this.proverService.hasCapacity()) {
      this.logger.log(`ZKP generation already in progress. Skipping ZKP creation for slot=${finalizedSlot}`);
      return;
    }
    // 1. Compute BLS Header Verify ZKP
    const headerProofPromise = this.proverService.computeHeaderProof(update);
    this.logger.log(`Requested ZKP for BLS Header Verification for slot=${finalizedSlot}`);

    // 2. Compute SSZ to Poseidon ZKP if necessary
    let syncCommitteeProofPromise;
    if (update.nextSyncCommittee) {
      syncCommitteeProofPromise = this.proverService.computeSyncCommitteeProof(update);
      this.logger.log(`Sync Committee Period changed. Requested ZKP for SyncCommittee for period=${Utils.syncCommitteePeriodFor(attestedSlot)}`);
    } else {
      syncCommitteeProofPromise = new Promise((resolve) => {
        resolve(undefined);
      });
    }

    // 3. Wait for both ZKPs
    const proofs = await Promise.all([headerProofPromise, syncCommitteeProofPromise]);
    this.logger.log(proofs);

    // 4. Broadcast header updates to all on-chain Light Client contracts
  }

}
