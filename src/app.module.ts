import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { EnvValidationSchema, formatEnvErrors } from './config/env-validation.config';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationOptions: {
        strict: true,
        abortEarly: false,
      },
      validate: (config) => {
        const result = EnvValidationSchema.safeParse(config);
        if(!result.success) {
          throw new Error(JSON.stringify(formatEnvErrors(result.error)));
        }
        return result.data;
      }
    }),
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
