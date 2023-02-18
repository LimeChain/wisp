import { Injectable } from "@nestjs/common";
import { ProverService } from "./prover/prover.service";
import { BeaconService } from "./beacon/beacon.service";

@Injectable()
export class AppService {
  constructor(private proverService: ProverService, private beaconService: BeaconService) {
  }
}
