import { Module } from "@nestjs/common";
import { UploadRpcController } from "./interface/upload-rpc.controller";
import { UploadRpcService } from "./application/services/upload-rpc.service";

@Module({
  controllers: [UploadRpcController],
  providers: [UploadRpcService],
})
export class UploadModule {}
