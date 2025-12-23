import { Injectable } from '@nestjs/common';
import envConfig from './configs/config';
import { MongoClient } from 'mongodb';

@Injectable()
export class DbService {
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    const uri = envConfig.MONGO_URI ?? envConfig.DATABASE_URL;
    if (!uri) {
      return { ok: false, message: 'MONGO_URI or DATABASE_URL is not set in .env' };
    }
    const client = new MongoClient(uri);
    try {
      await client.connect();
      // ping the server
      await client.db().admin().ping();
      return { ok: true, message: 'Connected to MongoDB' };
    } catch (err) {
      const msg = err instanceof Error ? `${err.message}` : String(err);
      return { ok: false, message: `Mongo connection error: ${msg}` };
    } finally {
      try {
        await client.close();
      } catch {
        // ignore error on close
      }
    }
  }
}
