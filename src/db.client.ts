import { MongoClient, Db } from 'mongodb';
import envConfig from './configs/config';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectClient() {
  const uri = envConfig.MONGO_URI ?? envConfig.DATABASE_URL;
  if (!uri) throw new Error('MONGO_URI or DATABASE_URL not set');
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
  }
  return { client, db } as { client: MongoClient; db: Db };
}

export function getDb() {
  if (!db) throw new Error('Database not connected; call connectClient() first');
  return db;
}

export function getClient() {
  if (!client) throw new Error('Client not connected; call connectClient() first');
  return client;
}
