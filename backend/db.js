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

  await db.collection("users").createIndex(
    { username: 1 },
    { unique: true, sparse: true }
  );

  await db.collection("users").createIndex({ role: 1 });
  await db.collection("users").createIndex({ verificationStatus: 1 });

  await db.collection("psychologists").createIndex({ id: 1 }, { unique: true });
  await db.collection("consultations").createIndex({ id: 1 }, { unique: true });
  await db.collection("forum_posts").createIndex({ id: 1 }, { unique: true });
  await db.collection("articles").createIndex({ id: 1 }, { unique: true });
  await db.collection("mind_hub_contents").createIndex({ id: 1 }, { unique: true });

await db.collection("verification_submissions").createIndex({
  psychologistId: 1,
  submittedAt: -1
});

await db.collection("verification_submissions").createIndex({
  psychologistId: 1,
  submissionNumber: 1
});

await db.collection("verification_submissions").createIndex({
  status: 1
});

  await db.collection("consultations").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("consultations").createIndex({ psychologistId: 1, scheduledAt: -1 });
  await db.collection("schedules").createIndex({ psychologistId: 1, date: 1, time: 1 }, { unique: true });
  await db.collection("consultation_messages").createIndex({ consultationId: 1, createdAt: 1 });

  console.log("MongoDB indexes ready");
}
