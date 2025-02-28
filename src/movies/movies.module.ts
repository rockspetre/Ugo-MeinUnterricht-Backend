import { Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './schemas/movie.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
    HttpModule,
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
