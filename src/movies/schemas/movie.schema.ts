import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MovieDocument = Movie & Document;

@Schema()
export class Movie {
  @Prop({ required: true })
  title: string;

  @Prop()
  director: string;

  @Prop()
  plot: string;

  @Prop()
  poster: string;

  @Prop()
  year: number;

  @Prop({ unique: true })
  imdbID: string;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);
MovieSchema.index({ title: 'text', director: 'text', plot: 'text' });
