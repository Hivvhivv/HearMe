import express from "express";
import { ObjectId } from "mongodb";
import { getDb } from "./db.js";
import { authenticate, authorize } from "./auth.middleware.js";

const router = express.Router();

function userId(req, res) {
  if (!ObjectId.isValid(req.user?.sub)) {
    res.status(400).json({ message: "Invalid user ID" });
    return null;
  }
  return new ObjectId(req.user.sub);
}

async function findConsultationForUser(db, consultationId, actorId, role) {
  if (!ObjectId.isValid(consultationId)) return null;
  const filter = { _id: new ObjectId(consultationId) };
  if (role === "psychologist") filter.psychologistId = actorId;
  else if (role === "user") filter.userId = actorId;
  else return null;
  return db.collection("consultations").findOne(filter);
}

router.get("/mine", authenticate, async (req, res) => {
  try {
    const actorId = userId(req, res);
    if (!actorId) return;
    const filter = req.user.role === "psychologist"
      ? { psychologistId: actorId }
      : req.user.role === "user" ? { userId: actorId } : null;
    if (!filter) return res.status(403).json({ message: "Forbidden" });
    const consultations = await (await getDb()).collection("consultations")
      .find(filter).sort({ scheduledAt: -1, createdAt: -1 }).toArray();
    return res.json({ consultations });
  } catch (error) {
    console.error("Get consultations error:", error);
    return res.status(500).json({ message: "Failed to get consultations" });
  }
});

router.post("/", authenticate, authorize("user"), async (req, res) => {
  try {
    const { psychologistId, date, time, notes } = req.body || {};
    if (!ObjectId.isValid(psychologistId) || !date || !time) {
      return res.status(400).json({ message: "Psychologist, date, and time are required" });
    }
    const actorId = userId(req, res);
    if (!actorId) return;
    const db = await getDb();
    const psychId = new ObjectId(psychologistId);
    const psychologist = await db.collection("users").findOne({
      _id: psychId, role: "psychologist", verificationStatus: "approved"
    });
    if (!psychologist) return res.status(404).json({ message: "Verified psychologist not found" });

    const schedule = await db.collection("schedules").findOne({
      psychologistId: psychId, date, time, isAvailable: true
    });
    if (!schedule) return res.status(409).json({ message: "Selected schedule is unavailable" });

    const now = new Date();
    const booked = await db.collection("schedules").findOneAndUpdate(
      { _id: schedule._id, isAvailable: true },
      { $set: { isAvailable: false, bookedBy: actorId, updatedAt: now } },
      { returnDocument: "after" }
    );
    if (!booked) return res.status(409).json({ message: "Selected schedule was just booked" });

    const user = await db.collection("users").findOne({ _id: actorId });
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
    const result = await db.collection("consultations").insertOne(consultation);
    return res.status(201).json({ consultation: { ...consultation, _id: result.insertedId } });
  } catch (error) {
    console.error("Create consultation error:", error);
    return res.status(500).json({ message: "Failed to create consultation" });
  }
});

router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const actorId = userId(req, res);
    if (!actorId) return;
    const { status, reason } = req.body || {};
    const role = req.user.role;
    const allowed = role === "psychologist" ? ["approved", "rejected", "completed"] : ["cancelled"];
    if (!allowed.includes(status)) return res.status(403).json({ message: "Invalid consultation status" });
    const db = await getDb();
    const consultation = await findConsultationForUser(db, req.params.id, actorId, role);
    if (!consultation) return res.status(404).json({ message: "Consultation not found" });
    const now = new Date();
    await db.collection("consultations").updateOne(
      { _id: consultation._id },
      { $set: { status, rejectionReason: status === "rejected" ? String(reason || "") : null, updatedAt: now } }
    );
    if (["cancelled", "rejected"].includes(status)) {
      await db.collection("schedules").updateOne(
        { _id: consultation.scheduleId }, { $set: { isAvailable: true, bookedBy: null, updatedAt: now } }
      );
    }
    return res.json({ message: "Consultation updated", status });
  } catch (error) {
    console.error("Update consultation error:", error);
    return res.status(500).json({ message: "Failed to update consultation" });
  }
});

router.get("/schedules/:psychologistId", authenticate, async (req, res) => {
  try {
    // Express mencocokkan route ini sebelum /schedules/mine.
    // Tangani path khusus tersebut di sini agar tidak dianggap ObjectId.
    if (req.params.psychologistId === "mine") {
      if (req.user.role !== "psychologist") {
        return res.status(403).json({ message: "Psychologist access only" });
      }
      const actorId = userId(req, res);
      if (!actorId) return;
      const schedules = await (await getDb()).collection("schedules")
        .find({ psychologistId: actorId }).sort({ date: 1, time: 1 }).toArray();
      return res.json({ schedules });
    }
    if (!ObjectId.isValid(req.params.psychologistId)) return res.status(400).json({ message: "Invalid psychologist ID" });
    const schedules = await (await getDb()).collection("schedules").find({
      psychologistId: new ObjectId(req.params.psychologistId), isAvailable: true
    }).sort({ date: 1, time: 1 }).toArray();
    return res.json({ schedules });
  } catch (error) {
    console.error("Get schedules error:", error);
    return res.status(500).json({ message: "Failed to get schedules" });
  }
});

router.get("/schedules/mine", authenticate, authorize("psychologist"), async (req, res) => {
  const actorId = userId(req, res); if (!actorId) return;
  const schedules = await (await getDb()).collection("schedules").find({ psychologistId: actorId }).sort({ date: 1, time: 1 }).toArray();
  return res.json({ schedules });
});

router.post("/schedules/mine", authenticate, authorize("psychologist"), async (req, res) => {
  try {
    const actorId = userId(req, res); if (!actorId) return;
    const { date, time, duration = 60 } = req.body || {};
    if (!date || !time) return res.status(400).json({ message: "Date and time are required" });
    const now = new Date();
    const schedule = { psychologistId: actorId, date, time, duration, isAvailable: true, createdAt: now, updatedAt: now };
    const result = await (await getDb()).collection("schedules").insertOne(schedule);
    return res.status(201).json({ schedule: { ...schedule, _id: result.insertedId } });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: "Schedule slot already exists" });
    return res.status(500).json({ message: "Failed to create schedule" });
  }
});

router.get("/:id/messages", authenticate, async (req, res) => {
  const actorId = userId(req, res); if (!actorId) return;
  const db = await getDb();
  const consultation = await findConsultationForUser(db, req.params.id, actorId, req.user.role);
  if (!consultation) return res.status(404).json({ message: "Consultation not found" });
  const messages = await db.collection("consultation_messages").find({ consultationId: consultation._id }).sort({ createdAt: 1 }).toArray();
  return res.json({ messages });
});

router.post("/:id/messages", authenticate, async (req, res) => {
  const actorId = userId(req, res); if (!actorId) return;
  const { content } = req.body || {};
  if (!String(content || "").trim()) return res.status(400).json({ message: "Message is required" });
  const db = await getDb();
  const consultation = await findConsultationForUser(db, req.params.id, actorId, req.user.role);
  if (!consultation) return res.status(404).json({ message: "Consultation not found" });
  const message = { consultationId: consultation._id, senderId: actorId, senderRole: req.user.role, content: String(content).trim(), readAt: null, createdAt: new Date() };
  const result = await db.collection("consultation_messages").insertOne(message);
  return res.status(201).json({ message: { ...message, _id: result.insertedId } });
});

export default router;
