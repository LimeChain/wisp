import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppService } from "./app.service";
import { LightClientModule } from './light-client/light-client.module';

@Module({
  imports: [ConfigModule.forRoot(), LightClientModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {
}
