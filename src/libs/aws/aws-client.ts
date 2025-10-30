import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

@Injectable()
export class AwsClient {
  private _s3?: S3Client;

  constructor(private readonly config: ConfigService) {}

  s3(): S3Client {
    return (this._s3 ??= new S3Client({
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('AWS_ACCESS_KEY_SECRET')!,
      },
      region: this.config.get<string>('BUCKET_REGION')!,
    }));
  }

  async healthCheck(bucketName: string): Promise<void> {
    await this.s3().send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket ${bucketName} is healthy`);
  }
}
