import { Metadata, status } from "@grpc/grpc-js";
import { RpcException } from "@nestjs/microservices";

export type AwsOp = 'PutObject' | 'GetSignedUrl' | 'GetObject' | 'DeleteObject';

function mapAwsToGrpc(e: any): number {
  const http = e?.$metadata?.httpStatusCode;
  const name = e?.name;

  if (http === 400) return status.INVALID_ARGUMENT;
  if (http === 401) return status.UNAUTHENTICATED;
  if (http === 403) return status.PERMISSION_DENIED;
  if (http === 404) return status.NOT_FOUND;           // NoSuchBucket / NoSuchKey
  if (http === 409) return status.ABORTED;
  if (http === 412) return status.FAILED_PRECONDITION; // PreconditionFailed
  if (http === 429) return status.RESOURCE_EXHAUSTED;  // SlowDown
  if (http === 500) return status.INTERNAL;
  if (http === 503) return status.UNAVAILABLE;

  // Client-side abort
  if (name === 'AbortError') return status.DEADLINE_EXCEEDED;

  // Fallbacks by name
  if (name === 'SignatureDoesNotMatch') return status.PERMISSION_DENIED;
  if (name === 'AccessDenied') return status.PERMISSION_DENIED;

  return status.INTERNAL;
}

export function throwAwsGrpc(e: any, op: AwsOp): never {
  const md = new Metadata();
  if (e?.$metadata?.requestId) md.add('aws-request-id', String(e.$metadata.requestId));
  if (e?.$metadata?.httpStatusCode) md.add('aws-http', String(e.$metadata.httpStatusCode));
  if (e?.name) md.add('aws-error', String(e.name));
  md.add('aws-op', op);

  const name = e?.name ?? 'AwsError';
  const message = `S3 ${op} failed: ${name}`;
  const details = e?.message
    ? `${name}: ${e.message}`
    : message;

  console.error('[AWS ERROR]', {
    op,
    awsError: name,
    httpStatus: e?.$metadata?.httpStatusCode,
    requestId: e?.$metadata?.requestId,
    message: e?.message,
  });

  throw new RpcException({
    code: mapAwsToGrpc(e),
    message,
    details,
    metadata: md,
  } as any);
}
