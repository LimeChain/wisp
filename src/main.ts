import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { getLodestarTypes } from "./lodestar-types";

async function bootstrap() {
  await getLodestarTypes();
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();