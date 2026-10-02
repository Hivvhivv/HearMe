/*
 * ======================================================
 * CONSULTATION SERVICE
 * ======================================================
 *
 * Aturan kepemilikan (spec section 14 & 15):
 *
 *   user        -> hanya consultation dengan userId-nya
 *   psychologist-> hanya consultation dengan
 *                  psychologistId-nya
 *
 * psychologistId / userId SELALU diambil dari JWT lewat
 * parameter `actorId`, tidak pernah dari body request.
 *
 * Pengambilan slot bersifat ATOMIC (findOneAndUpdate
 * dengan filter isAvailable: true), jadi dua booking
 * bersamaan ke slot yang sama tidak bisa keduanya
 * berhasil -- yang kalah menerima 409.
 *
 * ======================================================
 */

import { ObjectId } from "mongodb";

import { BaseService } from "../core/BaseService.js";
import { AppError } from "../core/AppError.js";
import { Validator } from "../core/Validator.js";

export class ConsultationService extends BaseService {

  async consultations() {
    return this.collection("consultations");
  }

  async schedules() {
    return this.collection("schedules");
  }

  async messages() {
    return this.collection("consultation_messages");
  }

  async users() {
    return this.collection("users");
  }


  // ====================================================
  // OWNERSHIP
  // ====================================================

  static ownerFilter(actorId, role) {
    if (role === "psychologist") {
      return { psychologistId: actorId };
    }

    if (role === "user") {
      return { userId: actorId };
    }

    return null;
  }


  /*
   * Mencari consultation HANYA di antara milik aktor.
   *
   * Kalau id valid tapi bukan milik aktor, hasilnya null ->
   * caller membalas 404. Sengaja 404, bukan 403, supaya
   * tidak membocorkan bahwa consultation itu ada.
   */
  async findOwned(consultationId, actorId, role) {
    if (!ObjectId.isValid(consultationId)) {
      return null;
    }

    const filter = ConsultationService.ownerFilter(
      actorId,
      role
    );

    if (!filter) {
      return null;
    }

    const consultations = await this.consultations();

    return consultations.findOne({
      _id: new ObjectId(consultationId),
      ...filter
    });
  }


  async requireOwned(consultationId, actorId, role) {
    const consultation = await this.findOwned(
      consultationId,
      actorId,
      role
    );

    if (!consultation) {
      throw AppError.notFound(
        "Consultation not found",
        "CONSULTATION_NOT_FOUND"
      );
    }

    return consultation;
  }


  // ====================================================
  // LIST MILIK SENDIRI
  // ====================================================

  async listMine(actorId, role) {
    const filter = ConsultationService.ownerFilter(
      actorId,
      role
    );

    if (!filter) {
      throw AppError.forbidden();
    }

    const consultations = await this.consultations();

    return consultations
      .find(filter)
      .sort({ scheduledAt: -1, createdAt: -1 })
      .toArray();
  }


  // ====================================================
  // BOOKING
  // ====================================================

  async book(actorId, { psychologistId, date, time, notes }) {
    if (
      !ObjectId.isValid(psychologistId) ||
      !date ||
      !time
    ) {
      throw AppError.badRequest(
        "Psychologist, date, and time are required",
        "VALIDATION_ERROR"
      );
    }

    const psychId = new ObjectId(psychologistId);

    const users = await this.users();

    // Psikolog harus ada DAN approved. Psikolog yang belum
    // diverifikasi tidak boleh menerima booking.
    const psychologist = await users.findOne({
      _id: psychId,
      role: "psychologist",
      verificationStatus: "approved"
    });

    if (!psychologist) {
      throw AppError.notFound(
        "Verified psychologist not found",
        "PSYCHOLOGIST_NOT_FOUND"
      );
    }

    const schedules = await this.schedules();

    const schedule = await schedules.findOne({
      psychologistId: psychId,
      date,
      time,
      isAvailable: true
    });

    if (!schedule) {
      throw AppError.conflict(
        "Selected schedule is unavailable",
        "SLOT_UNAVAILABLE"
      );
    }

    const now = BaseService.now();


    /*
     * PEMERIKSAAN ULANG DI SERVER.
     *
     * Filter isAvailable: true membuat hanya SATU request
     * yang bisa mengambil slot ini, walau beberapa user
     * menekan tombol pada saat yang sama.
     */
    const booked = await schedules.findOneAndUpdate(
      { _id: schedule._id, isAvailable: true },
      {
        $set: {
          isAvailable: false,
          bookedBy: actorId,
          updatedAt: now
        }
      },
      { returnDocument: "after" }
    );

    if (!BaseService.unwrap(booked)) {
      throw AppError.conflict(
        "Jadwal sudah terisi",
        "SLOT_TAKEN"
      );
    }

    const user = await users.findOne({ _id: actorId });

    const consultation = {
      userId: actorId,
      psychologistId: psychId,
      scheduleId: schedule._id,
      userName: user?.name || "User",
      psychologistName: psychologist.name || "Psikolog",
      psychologistAvatar: psychologist.avatar || "",
      date,
      time,
      scheduledAt: new Date(`${date}T${time}:00`),
      status: "pending",
      paymentStatus: "pending",
      notes: typeof notes === "string" ? notes : "",
      createdAt: now,
      updatedAt: now
    };

    const consultations = await this.consultations();

    const result = await consultations.insertOne(consultation);

    return { ...consultation, _id: result.insertedId };
  }


  // ====================================================
  // UBAH STATUS
  // ====================================================
  //
  // Status yang diizinkan BERGANTUNG ROLE:
  //
  //   psychologist -> approved / rejected / completed
  //   user         -> cancelled
  //
  // Jadi user tidak bisa meng-approve konsultasinya
  // sendiri.
  //
  // ====================================================

  async updateStatus(consultationId, actorId, role, status, reason) {
    const allowed =
      role === "psychologist"
        ? ["approved", "rejected", "completed"]
        : ["cancelled"];

    if (!allowed.includes(status)) {
      throw AppError.forbidden(
        "Invalid consultation status",
        "INVALID_STATUS"
      );
    }

    const consultation = await this.requireOwned(
      consultationId,
      actorId,
      role
    );

    const consultations = await this.consultations();
    const now = BaseService.now();

    await consultations.updateOne(
      { _id: consultation._id },
      {
        $set: {
          status,
          rejectionReason:
            status === "rejected" ? String(reason || "") : null,
          updatedAt: now
        }
      }
    );

    // Slot dibebaskan kembali kalau konsultasi dibatalkan
    // atau ditolak.
    if (["cancelled", "rejected"].includes(status)) {
      const schedules = await this.schedules();

      await schedules.updateOne(
        { _id: consultation.scheduleId },
        {
          $set: {
            isAvailable: true,
            bookedBy: null,
            updatedAt: now
          }
        }
      );
    }

    return status;
  }


  // ====================================================
  // RESCHEDULE
  // ====================================================
  //
  // Spec section 14: jadwal baru juga HARUS dicek agar
  // tidak bentrok.
  //
  // ====================================================

  async reschedule(consultationId, actorId, { date, time }) {
    const parsedDate = Validator.dateString(date, "Date", {
      required: true
    });

    const parsedTime = Validator.timeString(time, "Time", {
      required: true
    });

    const consultation = await this.requireOwned(
      consultationId,
      actorId,
      "psychologist"
    );

    if (["cancelled", "completed"].includes(consultation.status)) {
      throw AppError.conflict(
        "Consultation can no longer be rescheduled",
        "NOT_RESCHEDULABLE"
      );
    }

    const schedules = await this.schedules();

    // Slot baru harus milik psikolog ini.
    const target = await schedules.findOne({
      psychologistId: actorId,
      date: parsedDate,
      time: parsedTime
    });

    if (!target) {
      throw AppError.notFound(
        "Schedule slot not found",
        "SLOT_NOT_FOUND"
      );
    }

    const now = BaseService.now();

    // Ambil slot baru secara ATOMIC.
    const claimed = await schedules.findOneAndUpdate(
      { _id: target._id, isAvailable: true },
      {
        $set: {
          isAvailable: false,
          bookedBy: consultation.userId,
          updatedAt: now
        }
      },
      { returnDocument: "after" }
    );

    if (!BaseService.unwrap(claimed)) {
      throw AppError.conflict(
        "Jadwal sudah terisi",
        "SLOT_TAKEN"
      );
    }

    const consultations = await this.consultations();

    await consultations.updateOne(
      { _id: consultation._id },
      {
        $set: {
          scheduleId: target._id,
          date: parsedDate,
          time: parsedTime,
          scheduledAt: new Date(
            `${parsedDate}T${parsedTime}:00`
          ),
          status: "rescheduled",
          updatedAt: now
        }
      }
    );

    /*
     * Slot lama dibebaskan SETELAH slot baru berhasil
     * diambil, supaya tidak ada kondisi kehilangan dua slot
     * sekaligus kalau pengambilan gagal.
     */
    if (
      consultation.scheduleId &&
      String(consultation.scheduleId) !== String(target._id)
    ) {
      await schedules.updateOne(
        { _id: consultation.scheduleId },
        {
          $set: {
            isAvailable: true,
            bookedBy: null,
            updatedAt: now
          }
        }
      );
    }

    return { date: parsedDate, time: parsedTime };
  }


  // ====================================================
  // SCHEDULE (SISI PSIKOLOG)
  // ====================================================

  async listOwnSchedules(actorId) {
    const schedules = await this.schedules();

    return schedules
      .find({ psychologistId: actorId })
      .sort({ date: 1, time: 1 })
      .toArray();
  }


  async listOpenSchedules(psychologistId) {
    const psychId = Validator.objectId(
      psychologistId,
      "Psychologist ID"
    );

    const schedules = await this.schedules();

    return schedules
      .find({ psychologistId: psychId, isAvailable: true })
      .sort({ date: 1, time: 1 })
      .toArray();
  }


  // ====================================================
  // TEMPLATE JADWAL MINGGUAN
  // ====================================================
  //
  // UI psikolog mengatur jadwal sebagai TEMPLATE MINGGUAN
  // (per hari: tersedia / jam mulai / jam selesai),
  // sedangkan collection `schedules` menyimpan SLOT KONKRET
  // bertanggal.
  //
  // Penerjemahannya dikerjakan di SERVER, bukan di browser:
  //
  //   - satu request, bukan puluhan POST per slot
  //   - kepemilikan & bentrok tetap dijaga backend
  //   - slot yang SUDAH DI-BOOKING tidak pernah disentuh
  //
  // Idempoten: menyimpan template yang sama dua kali tidak
  // menduplikasi slot (dijaga unique index
  // psychologistId+date+time).
  //
  // ====================================================

  static get DAY_KEYS() {
    // Index getDay(): 0 = Minggu
    return [
      "minggu",
      "senin",
      "selasa",
      "rabu",
      "kamis",
      "jumat",
      "sabtu"
    ];
  }


  static validateWeeklyTemplate(template) {
    if (!template || typeof template !== "object") {
      throw AppError.badRequest(
        "Template jadwal wajib diisi",
        "TEMPLATE_REQUIRED"
      );
    }

    const cleaned = {};

    for (const key of ConsultationService.DAY_KEYS) {
      const day = template[key];

      if (!day || typeof day !== "object") {
        // Hari yang tidak dikirim dianggap tidak tersedia.
        cleaned[key] = {
          available: false,
          start: "09:00",
          end: "17:00"
        };
        continue;
      }

      const start = Validator.timeString(
        day.start,
        `Jam mulai ${key}`,
        { required: true }
      );

      const end = Validator.timeString(
        day.end,
        `Jam selesai ${key}`,
        { required: true }
      );

      if (end <= start) {
        throw AppError.badRequest(
          `Jam selesai ${key} harus setelah jam mulai`,
          "INVALID_TIME_RANGE"
        );
      }

      cleaned[key] = {
        available: day.available === true,
        start,
        end
      };
    }

    return cleaned;
  }


  // Daftar slot (date + time) yang seharusnya ada menurut
  // template, untuk `days` hari ke depan mulai besok.
  static expandTemplate(template, days) {
    const slots = [];

    const today = new Date();

    for (let offset = 1; offset <= days; offset += 1) {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);

      const key =
        ConsultationService.DAY_KEYS[date.getDay()];

      const day = template[key];

      if (!day?.available) {
        continue;
      }

      const dateStr = date.toISOString().slice(0, 10);

      const startHour = Number(day.start.slice(0, 2));
      const endHour = Number(day.end.slice(0, 2));

      // Slot 1 jam. Jam selesai bersifat eksklusif: 09:00-12:00
      // menghasilkan 09:00, 10:00, 11:00.
      for (let hour = startHour; hour < endHour; hour += 1) {
        slots.push({
          date: dateStr,
          time: `${String(hour).padStart(2, "0")}:00`
        });
      }
    }

    return slots;
  }


  async getWeeklyTemplate(actorId) {
    const profiles = await this.collection("psychologists");

    const profile = await profiles.findOne(
      { userId: actorId },
      { projection: { weeklySchedule: 1 } }
    );

    return profile?.weeklySchedule || null;
  }


  async applyWeeklyTemplate(actorId, template, { days = 28 } = {}) {
    const cleaned =
      ConsultationService.validateWeeklyTemplate(template);

    const now = BaseService.now();

    // Template disimpan agar UI bisa memuatnya kembali.
    const profiles = await this.collection("psychologists");

    await profiles.updateOne(
      { userId: actorId },
      {
        $set: { weeklySchedule: cleaned, updatedAt: now },
        $setOnInsert: { userId: actorId, createdAt: now }
      },
      { upsert: true }
    );

    const desired = ConsultationService.expandTemplate(
      cleaned,
      days
    );

    const desiredKeys = new Set(
      desired.map((s) => `${s.date} ${s.time}`)
    );

    const schedules = await this.schedules();

    const today = Validator.today();

    const existing = await schedules
      .find({
        psychologistId: actorId,
        date: { $gt: today }
      })
      .toArray();

    const existingKeys = new Set(
      existing.map((s) => `${s.date} ${s.time}`)
    );


    // ----------------------------------------------
    // TAMBAH slot yang belum ada.
    // ----------------------------------------------

    const toInsert = desired
      .filter((s) => !existingKeys.has(`${s.date} ${s.time}`))
      .map((s) => ({
        psychologistId: actorId,
        date: s.date,
        time: s.time,
        duration: 60,
        isAvailable: true,
        createdAt: now,
        updatedAt: now
      }));

    let created = 0;

    if (toInsert.length > 0) {
      // ordered: false -> satu duplikat tidak membatalkan
      // sisanya (bisa terjadi kalau dua request bersamaan).
      const result = await schedules
        .insertMany(toInsert, { ordered: false })
        .catch((error) => {
          if (error?.code === 11000) {
            return { insertedCount: error.result?.nInserted || 0 };
          }
          throw error;
        });

      created = result.insertedCount || 0;
    }


    // ----------------------------------------------
    // HAPUS slot masa depan yang tidak lagi ada di
    // template.
    //
    // HANYA yang isAvailable: true. Slot yang sudah
    // di-booking TIDAK pernah dihapus -- membatalkan
    // konsultasi orang hanya karena psikolog mengubah
    // template adalah kehilangan data.
    // ----------------------------------------------

    const obsolete = existing.filter(
      (s) =>
        s.isAvailable === true &&
        !desiredKeys.has(`${s.date} ${s.time}`)
    );

    let removed = 0;

    if (obsolete.length > 0) {
      const result = await schedules.deleteMany({
        _id: { $in: obsolete.map((s) => s._id) }
      });

      removed = result.deletedCount || 0;
    }

    // Slot terbooking yang kini di luar template: tetap ada,
    // tapi dilaporkan supaya UI bisa memberi tahu psikolog.
    const bookedOutsideTemplate = existing.filter(
      (s) =>
        s.isAvailable === false &&
        !desiredKeys.has(`${s.date} ${s.time}`)
    ).length;

    return {
      weeklySchedule: cleaned,
      created,
      removed,
      bookedOutsideTemplate,
      totalSlots: desired.length
    };
  }


  async createSchedule(actorId, { date, time, duration = 60 }) {
    const parsedDate = Validator.dateString(date, "Date", {
      required: true
    });

    const parsedTime = Validator.timeString(time, "Time", {
      required: true
    });

    const schedules = await this.schedules();
    const now = BaseService.now();

    const schedule = {
      psychologistId: actorId,
      date: parsedDate,
      time: parsedTime,
      duration,
      isAvailable: true,
      createdAt: now,
      updatedAt: now
    };

    try {
      const result = await schedules.insertOne(schedule);

      return { ...schedule, _id: result.insertedId };
    } catch (error) {
      if (error?.code === 11000) {
        throw AppError.conflict(
          "Schedule slot already exists",
          "SLOT_EXISTS"
        );
      }

      throw error;
    }
  }


  // ====================================================
  // PESAN
  // ====================================================
  //
  // Hanya PARTICIPANT consultation yang bisa membaca dan
  // mengirim pesan -- dijamin requireOwned().
  //
  // senderId diambil dari JWT, tidak pernah dari body.
  //
  // ====================================================

  async listMessages(consultationId, actorId, role) {
    const consultation = await this.requireOwned(
      consultationId,
      actorId,
      role
    );

    const messages = await this.messages();

    return messages
      .find({ consultationId: consultation._id })
      .sort({ createdAt: 1 })
      .toArray();
  }


  async sendMessage(consultationId, actorId, role, content) {
    const text = Validator.string(content, "Message", {
      required: true,
      max: 5000
    });

    const consultation = await this.requireOwned(
      consultationId,
      actorId,
      role
    );

    const messages = await this.messages();

    const message = {
      consultationId: consultation._id,
      senderId: actorId,
      senderRole: role,
      content: text,
      readAt: null,
      createdAt: BaseService.now()
    };

    const result = await messages.insertOne(message);

    return { ...message, _id: result.insertedId };
  }
}

export const consultationService = new ConsultationService();
