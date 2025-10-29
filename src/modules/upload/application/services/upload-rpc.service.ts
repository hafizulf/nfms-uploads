import { Injectable } from "@nestjs/common";
import { UploadUserImageResponse, UploadUserImageRequest } from "../../interface/dto/upload.dto";
import * as fs from 'node:fs';
import path from "path";

@Injectable()
export class UploadRpcService {
  async uploadUserImage(
    request: UploadUserImageRequest,
  ): Promise<UploadUserImageResponse> {
    // TODO: proceed the file to AWS & response
    // 1) Normalize data to Buffer
    const dataBuf =
      Buffer.isBuffer(request.data) ? request.data as Buffer
      : typeof request.data === 'string' ? Buffer.from(request.data, 'base64') // if a base64 string slipped in
      : Buffer.from(request.data as Uint8Array); // e.g., Uint8Array

    // 2) Optional sanity checks
    if (dataBuf.length !== request.size) {
      throw new Error(`Size mismatch: got ${dataBuf.length}, declared ${request.size}`);
    }

    // (Optional) quick magic-byte sniff, e.g. PNG
    // const isPng = dataBuf.slice(0,8).equals(Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]));

    // 3) Write file
    const outPath = path.join(process.cwd(), request.filename); // or a safe uploads dir
    await fs.promises.writeFile(outPath, dataBuf);

    return {
      user_id: request.user_id,
      object_key: request.filename,
      url: request.filename,
      mime_type: request.mime_type,
      size: request.size,
      checksum: 'checksum',
      width: 0,
      height: 0,
      created_at: Date.now(),
    };
  }
}
