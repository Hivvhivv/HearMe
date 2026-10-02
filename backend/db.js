import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "MONGODB_URI is not defined in backend/.env"
  );
}


// ======================================================
// MONGO CLIENT
// ======================================================
//
// Timeout dibuat eksplisit supaya ketika MongoDB Atlas
// tidak bisa dihubungi, request GAGAL CEPAT dengan error
// yang jelas, bukan menggantung ~30 detik.
//
// ======================================================

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10
});

let dbInstance = null;
let connectPromise = null;


// ======================================================
// GET DATABASE
// ======================================================
//
// getDb() dipanggil oleh banyak request sekaligus, jadi
// proses connect disimpan sebagai SATU promise bersama
// (single-flight) agar tidak ada beberapa connect paralel
// saat server baru hidup.
//
// Kalau connect gagal, promise direset supaya request
// berikutnya mencoba lagi -- bukan ikut gagal selamanya.
//
// ======================================================

export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  if (!connectPromise) {
    connectPromise = client
      .connect()
      .then((connected) => {
        dbInstance = connected.db("hearme");

        console.log("MongoDB connected: hearme");

        return dbInstance;
      })
      .catch((error) => {
        // Reset supaya request berikutnya bisa retry.
        connectPromise = null;

        throw error;
      });
  }

  return connectPromise;
}


// ======================================================
// PING DATABASE
// ======================================================
//
// Dipakai health check. Mengembalikan objek dan tidak
// pernah throw, supaya endpoint health selalu membalas.
//
// ======================================================

export async function pingDb() {
  try {
    const db = await getDb();

    await db.command({
      ping: 1
    });

    return {
      ok: true
    };

  } catch (error) {
    return {
      ok: false,
      message:
        error?.message ||
        "Database connection failed"
    };
  }
}


// ======================================================
// ENSURE INDEX
// ======================================================
//
// createIndex akan GAGAL kalau index dengan key sama
// sudah ada tapi opsinya berbeda -- misalnya saat sebuah
// index perlu diubah menjadi sparse.
//
// MongoDB memakai dua kode untuk ini:
//   85 IndexOptionsConflict
//   86 IndexKeySpecsConflict
//
// Helper ini menangani kasus itu: drop index lama, lalu
// buat ulang dengan opsi baru.
//
// ======================================================

async function ensureIndex(db, collection, keys, options) {
  try {
    await db.collection(collection).createIndex(keys, options);
  } catch (error) {
    if (error?.code !== 85 && error?.code !== 86) {
      throw error;
    }

    const name = Object.entries(keys)
      .map(([k, v]) => `${k}_${v}`)
      .join("_");

    console.log(
      `Index ${collection}.${name} diperbarui (opsi berubah)`
    );

    try {
      await db.collection(collection).dropIndex(name);
    } catch {
      // Nama index bisa berbeda; cari manual.
      const existing = await db
        .collection(collection)
        .indexes();

      const match = existing.find(
        (i) =>
          JSON.stringify(i.key) === JSON.stringify(keys)
      );

      if (match) {
        await db
          .collection(collection)
          .dropIndex(match.name);
      }
    }

    await db.collection(collection).createIndex(keys, options);
  }
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
  // SESSIONS
  //
  // Satu dokumen = satu device yang login.
  //
  // TTL index pada expiresAt membuat MongoDB menghapus
  // session kedaluwarsa secara otomatis.
  // ====================================================

  await db.collection("sessions").createIndex({
    userId: 1
  });

  await db.collection("sessions").createIndex(
    { refreshTokenHash: 1 },
    { unique: true }
  );

  await db.collection("sessions").createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  );


  // ====================================================
  // PSYCHOLOGISTS
  // ====================================================
  //
  // `psychologists` = profil profesional, satu per akun.
  // userId mereferensikan users._id.
  //
  // Field `id` adalah sisa dump mockData ("1".."6") dan
  // TIDAK ada pada profil yang dibuat lewat API.
  //
  // Index-nya harus SPARSE. Tanpa sparse, setiap profil
  // baru tersimpan dengan id: null, dan profil kedua
  // langsung melanggar unique -- sehingga psikolog kedua
  // tidak bisa menyimpan profilnya.
  // ====================================================

  await ensureIndex(
    db,
    "psychologists",
    { id: 1 },
    { unique: true, sparse: true }
  );

  // sparse: dokumen legacy yang belum ditautkan tidak
  // melanggar unique.
  await db.collection("psychologists").createIndex(
    { userId: 1 },
    { unique: true, sparse: true }
  );

  await db.collection("psychologists").createIndex({
    rating: -1,
    ratingCount: -1
  });

  await db.collection("psychologists").createIndex({
    specialization: 1
  });

  // Filter harga dikerjakan database, jadi perlu index.
  await db.collection("psychologists").createIndex({
    priceValue: 1
  });


  // ====================================================
  // PSYCHOLOGIST RATINGS
  //
  // 1 CONSULTATION = 1 RATING
  // ====================================================

  await db.collection("psychologist_ratings").createIndex(
    { consultationId: 1 },
    { unique: true }
  );

  await db.collection("psychologist_ratings").createIndex({
    psychologistId: 1,
    createdAt: -1
  });

  await db.collection("psychologist_ratings").createIndex({
    userId: 1,
    createdAt: -1
  });


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

  // Dipakai pengecekan bentrok jadwal (spec section 26).
  await db.collection("consultations").createIndex({
    psychologistId: 1,
    date: 1,
    time: 1
  });

  await db.collection("consultations").createIndex({
    userId: 1,
    date: -1
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
