import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { MoviesService } from './movies.service';
import { SearchMoviesDto } from './dto/search-movies.dto';
import { Movie } from './schemas/movie.schema';

@Controller('movies')
@UseInterceptors(CacheInterceptor)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchMovies(
    @Query() query: SearchMoviesDto,
  ): Promise<{ movies: Movie[]; total: number; page: number; limit: number }> {
    const { q, page, limit } = query;
    const { movies, total } = await this.moviesService.searchMovies(
      q,
      page,
      limit,
    );
    return { movies, total, page, limit };
  }
}
