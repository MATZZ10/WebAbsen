import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

export type Role = "teacher" | "student";
export type AttendanceStatus = "present" | "late" | "sick" | "alpa";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  device_id: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentRow = {
  id: string;
  user_id: string | null;
  name: string;
  nisn: string | null;
  class_room_id: string | null;
  class_room_name: string | null;
  face_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceRow = {
  id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  status: AttendanceStatus;
  checked_in_at: string;
  updated_at: string;
  note: string | null;
  face_image_url: string | null;
  confidence: number | null;
  latitude: number | null;
  longitude: number | null;
  updated_by_teacher_id: string | null;
};

const pool =
  (globalThis as unknown as { __pool?: Pool }).__pool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

attachDatabasePool(pool);

if (process.env.NODE_ENV !== "production") {
  (globalThis as unknown as { __pool?: Pool }).__pool = pool;
}

function uid() {
  return globalThis.crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function isTeacherEmail(email?: string | null) {
  if (!email) return false;
  const list = (process.env.TEACHER_EMAILS ?? "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

let schemaReady: Promise<void> | null = null;

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT,
          image TEXT,
          role TEXT NOT NULL CHECK (role IN ('teacher', 'student')) DEFAULT 'student',
          device_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        ALTER TABLE users ADD COLUMN IF NOT EXISTS device_id TEXT;
        CREATE TABLE IF NOT EXISTS class_rooms (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS students (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE,
          name TEXT NOT NULL,
          nisn TEXT UNIQUE,
          class_room_id TEXT,
          face_image_url TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          CONSTRAINT fk_students_class_room FOREIGN KEY (class_room_id) REFERENCES class_rooms(id) ON DELETE SET NULL
        );
        CREATE TABLE IF NOT EXISTS attendance (
          id TEXT PRIMARY KEY,
          student_id TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('present', 'late', 'sick', 'alpa')) DEFAULT 'alpa',
          checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          note TEXT,
          face_image_url TEXT,
          confidence NUMERIC(5,2),
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          updated_by_teacher_id TEXT,
          CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          CONSTRAINT fk_attendance_teacher FOREIGN KEY (updated_by_teacher_id) REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_attendance_checked_in_at ON attendance(checked_in_at);
        CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
        CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
      `);
    })();
  }
  await schemaReady;
}

export async function upsertUserFromOAuth(input: { email: string; name?: string | null; image?: string | null; }) {
  await ensureSchema();
  const existing = await getUserByEmail(input.email);
  const role: Role = isTeacherEmail(input.email) ? "teacher" : existing?.role ?? "student";
  const now = new Date().toISOString();
  const id = existing?.id ?? uid();
  if (existing) {
    await pool.query(`UPDATE users SET name = $1, image = $2, role = $3, updated_at = $4 WHERE email = $5`, [input.name ?? existing.name, input.image ?? existing.image, role, now, input.email]);
  } else {
    await pool.query(`INSERT INTO users (id, email, name, image, role, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [id, input.email, input.name ?? null, input.image ?? null, role, now, now]);
  }
  return (await getUserByEmail(input.email))!;
}

export async function getUserByEmail(email: string): Promise<UserRow | undefined> {
  await ensureSchema();
  const { rows } = await pool.query<UserRow>(`SELECT * FROM users WHERE email = $1 LIMIT 1`, [email]);
  return rows[0];
}

export async function getUserById(id: string): Promise<UserRow | undefined> {
  await ensureSchema();
  const { rows } = await pool.query<UserRow>(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
  return rows[0];
}

export async function setUserDeviceId(userId: string, deviceId: string) {
  await ensureSchema();
  await pool.query(`UPDATE users SET device_id = $1, updated_at = NOW() WHERE id = $2`, [deviceId, userId]);
}

export async function clearUserDeviceId(userId: string) {
  await ensureSchema();
  await pool.query(`UPDATE users SET device_id = NULL, updated_at = NOW() WHERE id = $1`, [userId]);
}

export async function createClassRoom(name: string) {
  await ensureSchema();
  await pool.query(`INSERT INTO class_rooms (id, name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (name) DO NOTHING`, [uid(), name]);
}

export async function createStudent(input: { name: string; nisn?: string | null; classRoomId?: string | null; faceImageUrl?: string | null; userId?: string | null; }) {
  await ensureSchema();
  await pool.query(`INSERT INTO students (id, user_id, name, nisn, class_room_id, face_image_url, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`, [uid(), input.userId ?? null, input.name, input.nisn ?? null, input.classRoomId ?? null, input.faceImageUrl ?? null]);
}

export async function createAttendance(input: {
  studentId: string;
  status: AttendanceStatus;
  checkedInAt: string;
  faceImageUrl?: string | null;
  confidence?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  note?: string | null;
  updatedByTeacherId?: string | null;
}) {
  await ensureSchema();
  await pool.query(
    `INSERT INTO attendance (id, student_id, status, checked_in_at, updated_at, note, face_image_url, confidence, latitude, longitude, updated_by_teacher_id) VALUES ($1,$2,$3,$4,NOW(),$5,$6,$7,$8,$9,$10)`,
    [uid(), input.studentId, input.status, input.checkedInAt, input.note ?? null, input.faceImageUrl ?? null, input.confidence ?? null, input.latitude ?? null, input.longitude ?? null, input.updatedByTeacherId ?? null]
  );
}

export async function listStudents(): Promise<StudentRow[]> {
  await ensureSchema();
  const { rows } = await pool.query<StudentRow>(`
    SELECT s.id, s.user_id, s.name, s.nisn, s.class_room_id, c.name AS class_room_name, s.face_image_url, s.created_at, s.updated_at
    FROM students s
    LEFT JOIN class_rooms c ON c.id = s.class_room_id
    ORDER BY s.name ASC
  `);
  return rows;
}

export async function listAttendanceRange(startIso: string, endIso: string): Promise<AttendanceRow[]> {
  await ensureSchema();
  const { rows } = await pool.query<AttendanceRow>(`
    SELECT a.id, a.student_id, s.name AS student_name, COALESCE(c.name, '-') AS class_name, a.status, a.checked_in_at, a.updated_at, a.note, a.face_image_url, a.confidence::float AS confidence, a.latitude, a.longitude, a.updated_by_teacher_id
    FROM attendance a
    JOIN students s ON s.id = a.student_id
    LEFT JOIN class_rooms c ON c.id = s.class_room_id
    WHERE a.checked_in_at >= $1 AND a.checked_in_at < $2
    ORDER BY a.checked_in_at DESC
  `, [startIso, endIso]);
  return rows;
}

export async function getAttendanceById(id: string): Promise<AttendanceRow | undefined> {
  await ensureSchema();
  const { rows } = await pool.query<AttendanceRow>(`
    SELECT a.id, a.student_id, s.name AS student_name, COALESCE(c.name, '-') AS class_name, a.status, a.checked_in_at, a.updated_at, a.note, a.face_image_url, a.confidence::float AS confidence, a.latitude, a.longitude, a.updated_by_teacher_id
    FROM attendance a
    JOIN students s ON s.id = a.student_id
    LEFT JOIN class_rooms c ON c.id = s.class_room_id
    WHERE a.id = $1
    LIMIT 1
  `, [id]);
  return rows[0];
}

export async function getTodaySummary(startIso: string, endIso: string) {
  await ensureSchema();
  const { rows } = await pool.query<{ status: AttendanceStatus; total: string }>(`
    SELECT status, COUNT(*)::text AS total
    FROM attendance
    WHERE checked_in_at >= $1 AND checked_in_at < $2
    GROUP BY status
  `, [startIso, endIso]);
  const summary = { present: 0, late: 0, sick: 0, alpa: 0 };
  for (const row of rows) summary[row.status] = Number(row.total);
  return summary;
}

export async function updateAttendanceStatus(input: { id: string; status: AttendanceStatus; note?: string | null; teacherId: string; }) {
  await ensureSchema();
  await pool.query(`UPDATE attendance SET status = $1, note = $2, updated_by_teacher_id = $3, updated_at = NOW() WHERE id = $4`, [input.status, input.note ?? null, input.teacherId, input.id]);
  return getAttendanceById(input.id);
}

export function getMonthRange(base = new Date()) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { start, end };
}

export function getTodayRange(base = new Date()) {
  const start = new Date(base); start.setHours(0,0,0,0);
  const end = new Date(base); end.setHours(23,59,59,999);
  return { start, end };
}
