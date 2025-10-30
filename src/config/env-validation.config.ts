import z, { ZodError } from "zod";

export const formatEnvErrors = (error: ZodError) => {
  return error.issues.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
};

export const EnvValidationSchema = z.object({
  APP_PORT: z.coerce.number().default(3003),
  GRPC_URL: z.string(),
  BUCKET_NAME: z.string(),
  BUCKET_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_ACCESS_KEY_SECRET: z.string(),
});
