import { Injectable, OnModuleInit, OnModuleDestroy, Logger, NotFoundException } from '@nestjs/common';
import envConfig from '../configs/config';
import { MongoClient, Collection, ObjectId } from 'mongodb';

@Injectable()
export class StockService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private collection: Collection;
  private readonly logger = new Logger(StockService.name);

  async onModuleInit() {
    const uri = envConfig.MONGO_URI ?? envConfig.DATABASE_URL;
    if (!uri) {
      this.logger.error('MONGO_URI or DATABASE_URL not set');
      return;
    }
    this.client = new MongoClient(uri);
    await this.client.connect();
    this.collection = this.client.db().collection('stocks');
    this.logger.log('Connected to MongoDB for stocks');
  }

  async onModuleDestroy() {
    try {
      await this.client?.close();
    } catch {
      // ignore
    }
  }

  async findAll(): Promise<any[]> {
    // return stocks joined with book info (if available) so frontend can show book title instead of raw id
    try {
      const pipeline = [
        {
          $lookup: {
            from: 'books',
            localField: 'bookId',
            foreignField: '_id',
            as: 'book',
          },
        },
        { $unwind: { path: '$book', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            bookId: 1,
            quantity: 1,
            location: 1,
            price: 1,
            batch: 1,
            lastUpdated: 1,
            status: 1,
            book: 1,
          },
        },
      ];
      return this.collection.aggregate(pipeline).toArray();
    } catch (err) {
      this.logger.error('Error aggregating stocks with books: ' + String(err));
      return this.collection.find().toArray();
    }
  }

  async findOne(id: string): Promise<any> {
    let _id: ObjectId;
    try {
      _id = new ObjectId(id);
    } catch {
      throw new NotFoundException('Invalid id');
    }
    const doc = await this.collection.findOne({ _id });
    if (!doc) throw new NotFoundException('Stock not found');
    // try to fetch related book info from `books` collection
    try {
      const booksColl = this.client.db().collection('books');
      let book: any = null;
      if (doc.bookId) {
        try {
          const bookId = typeof doc.bookId === 'string' ? new ObjectId(doc.bookId) : doc.bookId;
          book = await booksColl.findOne({ _id: bookId });
        } catch {
          // ignore lookup errors
        }
      }
      return { stock: doc, book };
    } catch (err) {
      return { stock: doc };
    }
  }
}
