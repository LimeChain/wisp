import { Module } from "@nestjs/common";
import { SignerService } from "./signer.service";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule
  ],
  providers: [SignerService],
  exports: [SignerService]
})
export class SharedModule {
}
