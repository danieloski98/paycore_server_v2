import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import morgan from 'morgan';


async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule, {
  });
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
  }));
  app.enableCors();
  app.use(morgan('combined'));

  // swagger setup
  const config = new DocumentBuilder()
    .setTitle('PAYCORE REST API')
    .setDescription('The API documentation for the PAYCORE REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('documentation', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000, () => logger.debug(`Server is running on port ${process.env.PORT ?? 3000}`));
}
bootstrap();
