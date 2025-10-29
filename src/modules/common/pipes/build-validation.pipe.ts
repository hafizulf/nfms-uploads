import { ValidationPipe } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { ValidationError } from "class-validator";
import { status as GrpcStatus } from '@grpc/grpc-js';

export function buildGrpcValidationPipe() {
  return new ValidationPipe({
    transform: false,
    whitelist: true,
    forbidUnknownValues: true,
    exceptionFactory: (errors: ValidationError[]) => {
      const details = {
        errors: errors.map(e => ({
          field: e.property,
          constraints: e.constraints,
        })),
      };
      return new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message:
          details.errors
            .map(e => `${e.field}: ${Object.values(e.constraints ?? {}).join(', ')}`)
            .join(' | ') || 'Validation failed',
        details: JSON.stringify(details),
      });
    },
  });
}
