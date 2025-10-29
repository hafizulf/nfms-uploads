import { IsInstance, IsInt, IsMimeType, IsNotEmpty, IsString, Min } from "class-validator";

export class UploadUserImageRequest {
  @IsNotEmpty()
  @IsString()
  user_id!: string;

  @IsNotEmpty()
  @IsInstance(Buffer)
  data!: Buffer;

  @IsNotEmpty()
  @IsString()
  filename!: string;

  @IsNotEmpty()
  @IsMimeType()
  mime_type!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  size!: number;

  @IsNotEmpty()
  @IsString()
  trace_id!: string;
}

export class UploadUserImageResponse {
  user_id: string;
  object_key: string;
  url: string;
  mime_type: string;
  size: number;
  checksum: string;
  width: number;
  height: number;
  created_at: number;
}
