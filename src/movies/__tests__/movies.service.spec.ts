import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from '../movies.service';
import { getModelToken } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { of } from 'rxjs';
import { InternalServerErrorException } from '@nestjs/common';
import { Movie } from '../schemas/movie.schema';

describe('MoviesService', () => {
  let service: MoviesService;

  const mockMovieModel = {
    find: jest.fn(),
    countDocuments: jest.fn(),
    bulkWrite: jest.fn(),
    findOne: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('testapikey'),
  };

  const mockCacheManager = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: getModelToken(Movie.name), useValue: mockMovieModel },
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchMovies', () => {
    it('should return paginated movies and total count', async () => {
      const query = 'space';
      const page = 1;
      const limit = 10;

      const moviesArray = [
        {
          title: 'Space Adventure',
          director: 'John Doe',
          plot: 'Plot',
          poster: 'http://example.com/poster.jpg',
          imdbID: 'tt123',
        },
      ];
      const totalCount = 1;

      const execMock = jest.fn().mockResolvedValue(moviesArray);
      const limitMock = jest.fn().mockReturnValue({ exec: execMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      mockMovieModel.find.mockReturnValue({ skip: skipMock });
      mockMovieModel.countDocuments.mockResolvedValue(totalCount);

      const result = await service.searchMovies(query, page, limit);

      expect(mockMovieModel.find).toHaveBeenCalledWith({
        $text: { $search: query },
      });
      expect(skipMock).toHaveBeenCalledWith(0);
      expect(limitMock).toHaveBeenCalledWith(limit);
      expect(result).toEqual({ movies: moviesArray, total: totalCount });
    });

    it('should throw InternalServerErrorException on error', async () => {
      const query = 'space';
      const page = 1;
      const limit = 10;
      mockMovieModel.find.mockImplementation(() => {
        throw new Error('test error');
      });

      await expect(service.searchMovies(query, page, limit)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('fetchAndStoreMovies', () => {
    it('should fetch movies from OMDB and perform bulkWrite for new movies', async () => {
      const storedMovies = [{ imdbID: 'tt111' }];
      const leanMock = jest.fn().mockResolvedValue(storedMovies);
      mockMovieModel.find.mockReturnValue({ lean: leanMock });

      const searchData = {
        Response: 'True',
        totalResults: '1',
        Search: [{ imdbID: 'tt123' }, { imdbID: 'tt111' }],
      };

      (mockHttpService.get as jest.Mock)
        .mockReturnValueOnce(of({ data: searchData }))
        .mockReturnValueOnce(
          of({
            data: {
              Title: 'Space Adventure',
              Director: 'John Doe',
              Plot: 'A journey in space',
              Poster: 'http://example.com/poster.jpg',
              Year: '2020',
              imdbID: 'tt123',
            },
          }),
        );

      mockMovieModel.bulkWrite.mockResolvedValue({});

      await service.fetchAndStoreMovies();

      expect(
        (mockHttpService.get as jest.Mock).mock.calls.length,
      ).toBeGreaterThanOrEqual(2);
      expect(mockMovieModel.bulkWrite).toHaveBeenCalled();
      const bulkOps = mockMovieModel.bulkWrite.mock.calls[0][0];
      expect(bulkOps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            updateOne: expect.objectContaining({
              filter: { imdbID: 'tt123' },
            }),
          }),
        ]),
      );
    });
  });
});
