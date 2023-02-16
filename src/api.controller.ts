import { Body, Controller, Logger, Post } from "@nestjs/common";
import { AppService } from "./app.service";
import { ProverService } from "./prover/prover.service";
import { altair } from "@lodestar/types";

@Controller("/api/v1")
export class ApiController {
  private readonly logger = new Logger(ApiController.name);

  constructor(private readonly appService: AppService, private readonly proverService: ProverService) {
  }

  @Post("/finality_update")
  finalityUpdate(@Body() body: any) {
    const update = body as altair.LightClientFinalityUpdate;
    this.logger.log(`Received new finality update for slot=${update.finalizedHeader.beacon.slot}`);
    const startTime = Date.now();
    // Start the processing asynchronously
    this.appService.processFinalityUpdate(update).then(() => {
      this.logger.log(`Processed finality update for slot ${update.finalizedHeader.beacon.slot} in ${(Date.now() - startTime)/1000/60} minutes`);
    });
  }

  @Post("/optimistic_update")
  optimisticUpdate(@Body() body: any) {
    const update = body as altair.LightClientFinalityUpdate;
    this.logger.debug(`Received optimistic update for slot=${update.attestedHeader.beacon.slot}. No action will be taken`);
  }
}
