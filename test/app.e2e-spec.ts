import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { ConfigModule } from "@nestjs/config";
import { ApiController } from "../src/light-client/api.controller";
import { AppService } from "../src/app.service";
import { ProverService } from "../src/light-client/prover/prover.service";
import { BeaconService } from "../src/light-client/beacon/beacon.service";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      controllers: [ApiController],
      providers: [AppService, BeaconService, ProverService]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("/api/v1/optimistic_update (POST)", () => {
    return request(app.getHttpServer())
      .post("/api/v1/optimistic_update")
      .send({ attestedHeader: { beacon: { slot: 1 } } })
      .expect(201)
      .expect("");
  });
});
