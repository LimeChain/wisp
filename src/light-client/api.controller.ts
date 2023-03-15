import { Body, Controller, Logger, Post } from "@nestjs/common";
import { LightClientService } from "./light-client.service";
import { lodestar } from "../lodestar-types";

@Controller("/api/v1")
export class ApiController {
  private readonly logger = new Logger(ApiController.name);

  constructor(private readonly lightClientService: LightClientService) {
  }

  @Post("/finality_update")
  finalityUpdate(@Body() body: any) {
    const update = lodestar.ssz.altair.LightClientFinalityUpdate.fromJson(body);
    this.logger.debug(`Received new finality update for slot = ${update.finalizedHeader.beacon.slot}`);
    // Start the processing asynchronously
    this.lightClientService.processFinalityUpdate(update);
  }

}
