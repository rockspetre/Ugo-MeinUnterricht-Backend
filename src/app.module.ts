import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MoviesModule } from './movies/movies.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      isGlobal: true,
      ttl: 30,
      max: 100,
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URL || 'mongodb://mongo:27017/movies',
    ),
    MoviesModule,
    HttpModule,
  ],
})
export class AppModule {}
