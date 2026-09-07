import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

export async function getDb() {
  if (!globalThis._hearmeDb) {
    await client.connect();
    globalThis._hearmeDb = client.db("hearme");
  }
  return globalThis._hearmeDb;
}

export async function setupIndexes() {
  const db = await getDb();

  await db.collection("users").createIndex(
    { email: 1 },
    { unique: true }
  );

  await db.collection("users").createIndex({ role: 1 });
  await db.collection("users").createIndex({ verificationStatus: 1 });

  await db.collection("psychologists").createIndex({ id: 1 }, { unique: true });
  await db.collection("consultations").createIndex({ id: 1 }, { unique: true });
  await db.collection("forum_posts").createIndex({ id: 1 }, { unique: true });
  await db.collection("articles").createIndex({ id: 1 }, { unique: true });
  await db.collection("mind_hub_contents").createIndex({ id: 1 }, { unique: true });

  console.log("MongoDB indexes ready");
}
