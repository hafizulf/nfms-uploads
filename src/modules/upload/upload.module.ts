import { Module } from "@nestjs/common";
import { UploadRpcController } from "./interface/upload-rpc.controller";
import { UploadRpcService } from "./application/services/upload-rpc.service";
import { AwsClient } from "src/libs/aws/aws-client";

@Module({
  controllers: [UploadRpcController],
  providers: [
    UploadRpcService,
    AwsClient,
  ],
})
export class UploadModule {}
