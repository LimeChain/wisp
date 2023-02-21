import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { getLodestarTypes } from "./lodestar-types";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  await getLodestarTypes();
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Main");
  const port = app.get(ConfigService).get<string>("server.port");
  await app.listen(port);
  logger.log(`Server started on port ${port}`);
}

bootstrap();