import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookDocument = HydratedDocument<Book>;

@Schema({ collection: 'books' })
export class Book {
  @Prop({ required: true })
  title: string;

  @Prop()
  author?: string;

  @Prop()
  isbn?: string;

  @Prop()
  description?: string;

  @Prop({ type: [String] })
  categories?: string[];

  @Prop()
  publishedDate?: string;

  @Prop()
  coverUrl?: string;

  @Prop()
  pages?: number;

  @Prop()
  publisher?: string;
}

export const BookSchema = SchemaFactory.createForClass(Book);
