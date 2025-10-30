import { Injectable } from "@nestjs/common";
import { UploadUserImageResponse, UploadUserImageRequest } from "../../interface/dto/upload.dto";
import { AwsClient } from "src/libs/aws/aws-client";
import { ConfigService } from "@nestjs/config";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";
import sharp from "sharp";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { RpcException } from "@nestjs/microservices";

@Injectable()
export class UploadRpcService {
  private bucketName: string;

  constructor(
    private readonly aws: AwsClient,
    private readonly config: ConfigService,
  ) {
    this.bucketName = this.config.get<string>('BUCKET_NAME')!
  }

  async uploadUserImage(
    request: UploadUserImageRequest,
  ): Promise<UploadUserImageResponse> {
    try {
      const { user_id, data, filename, mime_type } = request;
      const src = Buffer.isBuffer(data) ? (data as Buffer) : Buffer.from(data as Uint8Array);
      const buf = await sharp(src).resize({ width: 128, height: 128, fit: 'cover' }).toBuffer();
      const md5B64    = crypto.createHash('md5').update(buf).digest('base64');
      const sha256Hex = crypto.createHash('sha256').update(buf).digest('hex');
      const extFromMime =
        mime_type === 'image/png'  ? 'png'  :
        mime_type === 'image/jpeg' ? 'jpg'  :
        mime_type === 'image/webp' ? 'webp' :
        (path.extname(filename).replace('.', '') || 'bin');
      const key = `users/${user_id}/avatar.${extFromMime}`;

      await this.aws.s3().send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buf,
        ContentType: mime_type,
        ContentMD5: md5B64,
        Metadata: { 'x-checksum-sha256': sha256Hex },
        ACL: 'private',
      }));

      let url: string;
      try {
        url = await getSignedUrl(
          this.aws.s3(),
          new GetObjectCommand({ Bucket: this.bucketName, Key: key }),
          { expiresIn: 900 },
        );
        console.log('[uploadUserImage] success');
      } catch (e) {
        console.error('[uploadUserImage] signing failed:', (e as Error).message);
        url = '';
      }

      return {
        user_id,
        object_key: key,
        url,
        mime_type,
        size: buf.length,
        checksum: sha256Hex,
        created_at: Date.now(),
      };
    } catch (err: any) {
      console.error('[uploadUserImage] error:', err?.message);
      throw new RpcException({ code: 'UPLOAD_FAILED', message: err?.message || 'Upload failed' });
    }
  }
}
