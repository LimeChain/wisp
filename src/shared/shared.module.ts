import { Module } from "@nestjs/common";
import { SignerService } from "./signer.service";
import { ConfigModule } from "@nestjs/config";
import configuration from "../configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration]
    })
  ],
  providers: [SignerService],
  exports: [SignerService]
})
export class SharedModule {
}
