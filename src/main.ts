import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MoviesService } from './movies/movies.service';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`Server running on port ${port}`);

  const moviesService = app.get(MoviesService);
  try {
    await moviesService.fetchAndStoreMovies();
    Logger.log('Movies imported successfully');
  } catch (error) {
    Logger.error('Error importing movies on startup', error);
  }
}
bootstrap();
