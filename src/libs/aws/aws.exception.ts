import { Metadata, status } from "@grpc/grpc-js";
import { RpcException } from "@nestjs/microservices";

export type AwsOp = 'PutObject' | 'GetSignedUrl' | 'GetObject' | 'DeleteObject' | 'GetObjectHead';

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
  const http = e?.$metadata?.httpStatusCode as number | undefined;
  const md = new Metadata();

  if (e?.$metadata?.requestId) md.add('aws-request-id', String(e.$metadata.requestId));
  if (http) md.add('aws-http', String(http));
  if (e?.name) md.add('aws-error', String(e.name));
  md.add('aws-op', op);

  // --- Normalize common cases with poor messages ---
  let grpcCode = mapAwsToGrpc(e);

  let name = e?.name ?? 'AwsError';
  let message = `S3 ${op} failed: ${name}`;
  let details = e?.message ? `${name}: ${e.message}` : message;

  // S3 404 (NoSuchKey / HeadObject typically): give deterministic text
  if (http === 404 && (op === 'GetObject' || op === 'GetSignedUrl' || op === 'GetObjectHead')) {
    name = 'NoSuchKey';
    md.set('aws-error', name); // overwrite for consistency
    message = `S3 ${op} failed: ${name}`;
    details = 'Object not found';
  }

  // S3 403 (AccessDenied) — make it explicit
  if (http === 403 && (op === 'GetObject' || op === 'GetSignedUrl' || op === 'GetObjectHead')) {
    name = 'AccessDenied';
    md.set('aws-error', name);
    message = `S3 ${op} failed: ${name}`;
    details = 'Access denied by S3 policy or KMS';
  }
  // --- end normalize ---


  console.error('[AWS ERROR]', {
    op,
    awsError: name,
    httpStatus: http,
    requestId: e?.$metadata?.requestId,
    rawMessage: e?.message,
  });

  throw new RpcException({
    code: grpcCode,
    message,
    details,
    metadata: md,
  } as any);
}
