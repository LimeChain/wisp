import { Test, TestingModule } from "@nestjs/testing";
import { ApiController } from "./api.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { LightClientService } from "./light-client/light-client.service";

describe("AppController", () => {
  let apiController: ApiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), LightClientService],
      controllers: [ApiController],
      providers: [AppService]
    }).compile();

    apiController = app.get<ApiController>(ApiController);
  });

  describe("finality update", () => {

    it("should process finality update", async () => {
      await apiController.finalityUpdate({
        signatureSlot: 4996581,
        syncAggregate: undefined,
        finalityBranch: undefined,
        finalizedHeader: { beacon: { slot: 4996512 } },
        attestedHeader: undefined
      });
    }, 100_000_000);
  });
});
