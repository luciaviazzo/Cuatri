import { arranque, arranqueTerminado } from './boot-watchdog.js';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  console.log('[boot] módulos cargados, creando la app');
  arranque.etapa = 'NestFactory.create (conexión a la base y migraciones)';
  const app = await NestFactory.create(AppModule);
  arranque.etapa = 'configurando la app';

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Cuatri API')
    .setDescription('Planificador de cursada multi-carrera')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.setGlobalPrefix('api');
  arranque.etapa = 'app.listen';
  await app.listen(process.env.PORT ?? 3000);
  arranqueTerminado();
  console.log('[boot] app escuchando');
}
await bootstrap();
