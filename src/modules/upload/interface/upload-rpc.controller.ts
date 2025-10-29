import { GrpcMethod } from "@nestjs/microservices";
import { UploadRpcService } from "../application/services/upload-rpc.service";
import { UploadUserImageRequest, UploadUserImageResponse } from "./dto/upload.dto";
import { Controller, UsePipes } from "@nestjs/common";
import { buildGrpcValidationPipe } from "src/modules/common/pipes/build-validation.pipe";

@Controller()
export class UploadRpcController {
  constructor(
    private readonly uploadRpcService: UploadRpcService,
  ) {}

  @GrpcMethod('UploadService', 'UploadUserImage')
  @UsePipes(buildGrpcValidationPipe())
  async uploadUserImage(request: UploadUserImageRequest): Promise<UploadUserImageResponse> {
    return await this.uploadRpcService.uploadUserImage(request);
  }
}
