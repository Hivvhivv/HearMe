import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "MONGODB_URI is not defined in backend/.env"
  );
}

const client = new MongoClient(uri);

let dbInstance = null;


// ======================================================
// GET DATABASE
// ======================================================

export async function getDb() {
  if (!dbInstance) {
    await client.connect();

    dbInstance = client.db("hearme");

    console.log("MongoDB connected: hearme");
  }

  return dbInstance;
}


// ======================================================
// SETUP INDEXES
// ======================================================

export async function setupIndexes() {
  const db = await getDb();


  // ====================================================
  // USERS
  // ====================================================

  await db.collection("users").createIndex(
    { email: 1 },
    { unique: true }
  );

  await db.collection("users").createIndex(
    { username: 1 },
    {
      unique: true,
      sparse: true
    }
  );

  await db.collection("users").createIndex({
    role: 1
  });

  await db.collection("users").createIndex({
    verificationStatus: 1
  });


  // ====================================================
  // PSYCHOLOGISTS
  // ====================================================

  await db.collection("psychologists").createIndex(
    { id: 1 },
    { unique: true }
  );


  // ====================================================
  // CONSULTATIONS
  // ====================================================

  await db.collection("consultations").createIndex(
    { id: 1 },
    { unique: true }
  );

  await db.collection("consultations").createIndex({
    userId: 1,
    createdAt: -1
  });

  await db.collection("consultations").createIndex({
    psychologistId: 1,
    scheduledAt: -1
  });


  // ====================================================
  // SCHEDULES
  // ====================================================

  await db.collection("schedules").createIndex(
    {
      psychologistId: 1,
      date: 1,
      time: 1
    },
    {
      unique: true
    }
  );


  // ====================================================
  // CONSULTATION MESSAGES
  // ====================================================

  await db
    .collection("consultation_messages")
    .createIndex({
      consultationId: 1,
      createdAt: 1
    });


  // ====================================================
  // FORUM
  // ====================================================

  await db.collection("forum_posts").createIndex(
    { id: 1 },
    { unique: true }
  );


  // ====================================================
  // ARTICLES
  // ====================================================

  await db.collection("articles").createIndex(
    { id: 1 },
    { unique: true }
  );


  // ====================================================
  // MIND HUB
  // ====================================================

  await db
    .collection("mind_hub_contents")
    .createIndex(
      { id: 1 },
      { unique: true }
    );


  // ====================================================
  // VERIFICATION
  // ====================================================

  await db
    .collection("verification_submissions")
    .createIndex({
      psychologistId: 1,
      submittedAt: -1
    });

  await db
    .collection("verification_submissions")
    .createIndex({
      psychologistId: 1,
      submissionNumber: 1
    });

  await db
    .collection("verification_submissions")
    .createIndex({
      status: 1
    });


  // ====================================================
  // DAILY MOOD
  //
  // 1 USER + 1 DATE = 1 MOOD
  // ====================================================

  await db.collection("daily_moods").createIndex(
    {
      userId: 1,
      date: 1
    },
    {
      unique: true
    }
  );

  await db.collection("daily_moods").createIndex({
    userId: 1,
    date: -1
  });


  console.log("MongoDB indexes ready");
}