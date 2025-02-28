import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from '../movies.controller';
import { MoviesService } from '../movies.service';
import { SearchMoviesDto } from '../dto/search-movies.dto';
import { CacheModule } from '@nestjs/cache-manager';

describe('MoviesController', () => {
  let controller: MoviesController;

  const mockMoviesService = {
    searchMovies: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [MoviesController],
      providers: [{ provide: MoviesService, useValue: mockMoviesService }],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchMovies', () => {
    it('should return paginated movie results', async () => {
      const searchDto: SearchMoviesDto = { q: 'space', page: 1, limit: 10 };
      const moviesResult = {
        movies: [
          {
            title: 'Space Adventure',
            director: 'John Doe',
            plot: 'A journey in space',
            poster: 'http://example.com/poster.jpg',
            imdbID: 'tt123',
          },
        ],
        total: 1,
      };
      mockMoviesService.searchMovies.mockResolvedValue(moviesResult);
      const result = await controller.searchMovies(searchDto);

      expect(mockMoviesService.searchMovies).toHaveBeenCalledWith(
        'space',
        1,
        10,
      );
      expect(result).toEqual({
        movies: moviesResult.movies,
        total: moviesResult.total,
        page: 1,
        limit: 10,
      });
    });
  });
});
