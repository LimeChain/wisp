import { Test, TestingModule } from "@nestjs/testing";
import { ApiController } from "./api.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { ProverService } from "./prover/prover.service";

describe("AppController", () => {
  let apiController: ApiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      controllers: [ApiController],
      providers: [AppService, ProverService]
    }).compile();

    apiController = app.get<ApiController>(ApiController);
  });

  describe("root", () => {
    it("should return \"Hello World!\"", async () => {
    });
  });
});
