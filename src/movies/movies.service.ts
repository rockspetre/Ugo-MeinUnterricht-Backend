import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Movie, MovieDocument } from './schemas/movie.schema';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);
  private readonly OMDB_BASE_URL: string;
  private readonly OMDB_API_KEY: string;

  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.OMDB_BASE_URL = 'http://www.omdbapi.com/';
    this.OMDB_API_KEY = this.configService.get<string>('OMDB_API_KEY');
    if (!this.OMDB_API_KEY) {
      this.logger.error('OMDB_API_KEY not provided in configuration');
      throw new Error('OMDB_API_KEY must be provided');
    }
  }

  /**
   * Fetches movies from the OMDB API (with search term "space" for 2020),
   * filter already stored movies out, and uses bulk upsert operations to
   * insert new movies into the database.
   */
  async fetchAndStoreMovies(): Promise<void> {
    let page = 1;
    let totalResults = 0;

    try {
      const storedMovies = await this.movieModel.find({}, { imdbID: 1 }).lean();
      const storedIds = new Set(storedMovies.map((movie) => movie.imdbID));

      do {
        const searchResponse = await firstValueFrom(
          this.httpService.get(this.OMDB_BASE_URL, {
            params: {
              apikey: this.OMDB_API_KEY,
              s: 'space',
              y: '2020',
              type: 'movie',
              page,
            },
          }),
        );
        const data = searchResponse.data;
        if (data.Response === 'False') break;
        totalResults = parseInt(data.totalResults, 10);

        const newMovieItems = data.Search.filter(
          (movieItem) => !storedIds.has(movieItem.imdbID),
        );

        const bulkOps = await Promise.all(
          newMovieItems.map(async (movieItem) => {
            try {
              const detailResponse = await firstValueFrom(
                this.httpService.get(this.OMDB_BASE_URL, {
                  params: {
                    apikey: this.OMDB_API_KEY,
                    i: movieItem.imdbID,
                    plot: 'full',
                  },
                }),
              );
              const movieData = detailResponse.data;
              storedIds.add(movieData.imdbID);
              return {
                updateOne: {
                  filter: { imdbID: movieData.imdbID },
                  update: {
                    $set: {
                      title: movieData.Title,
                      director: movieData.Director,
                      plot: movieData.Plot,
                      poster: movieData.Poster,
                      year: movieData.Year,
                      imdbID: movieData.imdbID,
                    },
                  },
                  upsert: true,
                },
              };
            } catch (error) {
              this.logger.error(
                `Error fetching details for IMDb ID ${movieItem.imdbID}: ${error.message}`,
              );
              return null;
            }
          }),
        );

        const validBulkOps = bulkOps.filter((op) => op !== null);
        if (validBulkOps.length > 0) {
          await this.movieModel.bulkWrite(validBulkOps);
        }

        page++;
      } while ((page - 1) * 10 < totalResults);
    } catch (error) {
      this.logger.error(`Error fetching movies from OMDB: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to fetch movies from external API',
      );
    }
  }

  /**
   * Searches movies stored in the database using a text index on title, director, and plot.
   * Applies pagination by using skip and limit.
   */
  async searchMovies(
    query: string,
    page: number,
    limit: number,
  ): Promise<{ movies: Movie[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const [movies, total] = await Promise.all([
        this.movieModel
          .find({ $text: { $search: query } })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.movieModel.countDocuments({ $text: { $search: query } }),
      ]);
      return { movies, total };
    } catch (error) {
      this.logger.error(`Error searching movies: ${error.message}`);
      throw new InternalServerErrorException('Failed to search movies');
    }
  }
}
