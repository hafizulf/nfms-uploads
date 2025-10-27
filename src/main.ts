import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule, 
    new FastifyAdapter()
  );
  const configService = app.get(ConfigService);
  const appPort = configService.get<number>('APP_PORT') || 3003;
  const grpcUrl = configService.get<string>('GRPC_URL')!;

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'upload',
      protoPath: join(__dirname, './proto/upload/upload.proto'),
      url: grpcUrl,
      loader: {
        keepCase: true,
      }
    }
  })
  

  await app.startAllMicroservices();
  await app.listen(appPort);
}
bootstrap();
