import { Body, Controller, Logger, Post } from "@nestjs/common";
import { AppService } from "./app.service";
import { altair } from "@lodestar/types";

@Controller("/api/v1")
export class ApiController {
  private readonly logger = new Logger(ApiController.name);

  constructor(private readonly appService: AppService) {
  }

  @Post("/finality_update")
  finalityUpdate(@Body() body: any) {
    const update = body as altair.LightClientUpdate;
    this.logger.debug(`Received new finality update for slot=${update.finalizedHeader.beacon.slot}`);
    const startTime = Date.now();
    // Start the processing asynchronously
    this.appService.processFinalityUpdate(update);
  }

  @Post("/optimistic_update")
  optimisticUpdate(@Body() body: any) {
    const update = body as altair.LightClientUpdate;
    this.logger.debug(`Received optimistic update for slot=${update.attestedHeader.beacon.slot}. No action will be taken`);
  }
}
