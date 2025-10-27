import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { EnvValidationSchema, formatEnvErrors } from './config/env-validation.config';

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
        return result;
      }
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
