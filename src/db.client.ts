import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectClient() {
  const uri = process.env.MONGODB_URI ?? process.env.DATABASE_URL ?? process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI or DATABASE_URL or MONGO_URI not set');
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
