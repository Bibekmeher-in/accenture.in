import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect().then(async (c) => {
      // Initialize indexes in development/first-run
      try {
        const db = c.db("accenture")
        await db.collection("admin").createIndex({ username: 1 }, { unique: true })
        await db.collection("services").createIndex({ slug: 1 }, { unique: true })
        await db.collection("blog").createIndex({ slug: 1 }, { unique: true })

        // Analytics Indexes
        await db.collection("analyticsEvents").createIndex({ timestamp: -1 }, { expireAfterSeconds: 7776000 }) // 90 days TTL
        await db.collection("analyticsEvents").createIndex({ sessionId: 1 })
        await db.collection("analyticsSessions").createIndex({ lastActiveAt: -1 }, { expireAfterSeconds: 7776000 }) // 90 days TTL

        // Lead Pipeline Indexes
        await db.collection("leads").createIndex({ createdAt: -1 })
        await db.collection("leads").createIndex({ status: 1 })
        await db.collection("leads").createIndex({ priority: 1 })
        await db.collection("leadActivities").createIndex({ leadId: 1 })
        await db.collection("leadActivities").createIndex({ timestamp: -1 })

        // Audit Log Indexes
        await db.collection("auditLogs").createIndex({ timestamp: -1 })
        await db.collection("auditLogs").createIndex({ actor: 1 })
      } catch (e) {
        console.error("Failed to initialize indexes:", e)
      }
      return c
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise!;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect().then(async (c) => {
    try {
      const db = c.db("accenture")
      await db.collection("admin").createIndex({ username: 1 }, { unique: true })
      await db.collection("services").createIndex({ slug: 1 }, { unique: true })
      await db.collection("blog").createIndex({ slug: 1 }, { unique: true })

      // Analytics Indexes
      await db.collection("analyticsEvents").createIndex({ timestamp: -1 }, { expireAfterSeconds: 7776000 }) // 90 days TTL
      await db.collection("analyticsEvents").createIndex({ sessionId: 1 })
      await db.collection("analyticsSessions").createIndex({ lastActiveAt: -1 }, { expireAfterSeconds: 7776000 }) // 90 days TTL

      // Lead Pipeline Indexes
      await db.collection("leads").createIndex({ createdAt: -1 })
      await db.collection("leads").createIndex({ status: 1 })
      await db.collection("leads").createIndex({ priority: 1 })
      await db.collection("leadActivities").createIndex({ leadId: 1 })
      await db.collection("leadActivities").createIndex({ timestamp: -1 })

      // Audit Log Indexes
      await db.collection("auditLogs").createIndex({ timestamp: -1 })
      await db.collection("auditLogs").createIndex({ actor: 1 })
    } catch (e) {
      console.error("Failed to initialize indexes in prod:", e)
    }
    return c
  });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
