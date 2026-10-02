/*
 * ======================================================
 * MIGRASI PSIKOLOG LEGACY
 * ======================================================
 *
 * MASALAH:
 *
 * Collection `psychologists` berisi 6 dokumen hasil dump
 * mentah dari src/data/mockData.ts. Dokumen itu TIDAK
 * punya:
 *
 *   - userId            -> tidak terhubung ke akun
 *   - verificationStatus
 *   - password/email    -> tidak bisa login
 *
 * Akibatnya psikolog tersebut tidak bisa menerima booking,
 * tidak bisa di-approve admin, dan tidak bisa ditampilkan
 * oleh API yang (benar) hanya menyajikan psikolog dengan
 * akun ber-role psychologist dan verificationStatus
 * approved.
 *
 * YANG DILAKUKAN SCRIPT INI:
 *
 * Untuk setiap dokumen `psychologists` tanpa userId:
 *
 *   1. Buat akun di `users`:
 *        role               = psychologist
 *        verificationStatus = approved
 *        password           = ACAK (tidak dicetak)
 *        isDemoAccount      = true
 *   2. Tautkan dokumen profil ke akun itu lewat userId.
 *
 * Password sengaja acak dan tidak dicetak. Akun ini ada
 * supaya psikolog bisa DITAMPILKAN dan DI-BOOKING. Kalau
 * ingin login sebagai salah satunya, reset password-nya.
 *
 * Script ini IDEMPOTEN: dokumen yang sudah punya userId
 * dilewati.
 *
 * Jalankan:   node scripts/migrate-psychologists.js
 * Batalkan:   node scripts/migrate-psychologists.js --undo
 *
 * ======================================================
 */

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const UNDO = process.argv.includes("--undo");

const EMAIL_DOMAIN = "psikolog.hearme.demo";


function emailFromName(name, taken) {
  const base =
    String(name || "psikolog")
      .toLowerCase()
      .replace(/^(dr|drs|prof)\.?\s+/i, "")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 40) || "psikolog";

  let candidate = `${base}@${EMAIL_DOMAIN}`;
  let n = 2;

  while (taken.has(candidate)) {
    candidate = `${base}.${n}@${EMAIL_DOMAIN}`;
    n += 1;
  }

  taken.add(candidate);

  return candidate;
}


function usernameFromEmail(email, taken) {
  const base = email.split("@")[0].replace(/\./g, "_");

  let candidate = base;
  let n = 2;

  while (taken.has(candidate)) {
    candidate = `${base}_${n}`;
    n += 1;
  }

  taken.add(candidate);

  return candidate;
}


async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);

  await client.connect();

  const db = client.db("hearme");

  const users = db.collection("users");
  const psychologists = db.collection("psychologists");


  // ----------------------------------------------------
  // UNDO
  // ----------------------------------------------------

  if (UNDO) {
    const demoUsers = await users
      .find({ isDemoAccount: true, role: "psychologist" })
      .toArray();

    console.log(
      `Akun demo ditemukan: ${demoUsers.length}`
    );

    for (const u of demoUsers) {
      // Lepaskan tautan profil, JANGAN hapus profilnya
      // (itu data konten asli project).
      await psychologists.updateOne(
        { userId: u._id },
        { $unset: { userId: "" } }
      );

      await db
        .collection("sessions")
        .deleteMany({ userId: u._id });

      await users.deleteOne({ _id: u._id });

      console.log(`  dihapus: ${u.email}`);
    }

    console.log("\nSelesai. Dokumen profil tetap utuh.");

    await client.close();
    return;
  }


  // ----------------------------------------------------
  // MIGRASI
  // ----------------------------------------------------

  const orphans = await psychologists
    .find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    })
    .toArray();

  console.log(
    `Dokumen psychologists tanpa userId: ${orphans.length}`
  );

  if (orphans.length === 0) {
    console.log("Tidak ada yang perlu dimigrasi.");
    await client.close();
    return;
  }

  const takenEmails = new Set(
    (
      await users
        .find({}, { projection: { email: 1 } })
        .toArray()
    ).map((u) => u.email)
  );

  const takenUsernames = new Set(
    (
      await users
        .find({}, { projection: { username: 1 } })
        .toArray()
    )
      .map((u) => u.username)
      .filter(Boolean)
  );

  let created = 0;

  for (const profile of orphans) {
    const now = new Date();

    const email = emailFromName(profile.name, takenEmails);

    const username = usernameFromEmail(
      email,
      takenUsernames
    );

    // Password acak, tidak dicetak ke mana pun.
    const randomPassword = crypto
      .randomBytes(24)
      .toString("hex");

    const account = {
      name: profile.name || "Psikolog",
      username,
      email,
      passwordHash: await bcrypt.hash(randomPassword, 12),
      role: "psychologist",

      // Data seed ini memang dimaksudkan tampil di app,
      // jadi langsung approved.
      verificationStatus: "approved",

      isActive: true,

      // Penanda supaya mudah dibedakan dari psikolog nyata
      // dan supaya --undo bisa membersihkannya.
      isDemoAccount: true,

      createdAt: now,
      updatedAt: now
    };

    const result = await users.insertOne(account);

    await psychologists.updateOne(
      { _id: profile._id },
      {
        $set: {
          userId: result.insertedId,

          // rating/ratingCount dijadikan field TURUNAN yang
          // dikelola backend. Nilai seed yang sudah ada
          // dipertahankan sebagai titik awal, dan akan
          // ditimpa begitu ada review nyata.
          rating:
            typeof profile.rating === "number"
              ? profile.rating
              : null,

          ratingCount:
            typeof profile.ratingCount === "number"
              ? profile.ratingCount
              : 0,

          updatedAt: now
        }
      }
    );

    console.log(`  dibuat: ${email}  (${profile.name})`);

    created += 1;
  }

  console.log(
    `\nSelesai. ${created} akun psikolog dibuat dan ditautkan.`
  );
  console.log(
    "Password acak dan tidak dicetak. Reset kalau perlu login."
  );

  await client.close();
}


main().catch((error) => {
  console.error("Migrasi gagal:", error);
  process.exit(1);
});
