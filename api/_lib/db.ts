import { MongoClient, Db } from 'mongodb';

interface CachedMongo {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
  indexesEnsured: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoCache: CachedMongo | undefined;
}

const globalCache = globalThis._mongoCache ?? {
  client: null,
  promise: null,
  indexesEnsured: false,
};
globalThis._mongoCache = globalCache;

export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  if (globalCache.client) {
    return globalCache.client;
  }

  if (!globalCache.promise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    globalCache.promise = client.connect();
  }

  try {
    globalCache.client = await globalCache.promise;
    return globalCache.client;
  } catch (err) {
    globalCache.promise = null;
    throw err;
  }
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB || 'tripsplit';
  const db = client.db(dbName);

  if (!globalCache.indexesEnsured) {
    await ensureIndexes(db).catch((err) => {
      // Log index creation error without throwing to avoid halting operations
      console.error('Failed to ensure MongoDB indexes:', err);
    });
    globalCache.indexesEnsured = true;
  }

  return db;
}

/**
 * Creates required database indexes for Tripsplit
 */
export async function ensureIndexes(db: Db): Promise<void> {
  // trips collection: unique index on accessToken
  await db.collection('trips').createIndex({ accessToken: 1 }, { unique: true });

  // expenses collection: compound index on tripId and deletedAt
  await db.collection('expenses').createIndex({ tripId: 1, deletedAt: 1, date: -1 });

  // settlements collection: index on tripId
  await db.collection('settlements').createIndex({ tripId: 1, date: -1 });
}
