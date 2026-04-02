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
  attendance_method: "face" | "qr";
};

export type QrSession = {
  id: string;
  qr_code: string;
  created_by_teacher_id: string;
  is_active: boolean;
  created_at: string;
  used_at: string | null;
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
          attendance_method TEXT NOT NULL CHECK (attendance_method IN ('face', 'qr')) DEFAULT 'face',
          CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          CONSTRAINT fk_attendance_teacher FOREIGN KEY (updated_by_teacher_id) REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE TABLE IF NOT EXISTS qr_sessions (
          id TEXT PRIMARY KEY,
          qr_code TEXT NOT NULL UNIQUE,
          created_by_teacher_id TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          used_at TIMESTAMPTZ,
          CONSTRAINT fk_qr_sessions_teacher FOREIGN KEY (created_by_teacher_id) REFERENCES users(id) ON DELETE CASCADE
        );
        ALTER TABLE attendance ADD COLUMN IF NOT EXISTS attendance_method TEXT NOT NULL CHECK (attendance_method IN ('face', 'qr')) DEFAULT 'face';
        CREATE TABLE IF NOT EXISTS school_settings (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          geolocation_latitude DOUBLE PRECISION NOT NULL,
          geolocation_longitude DOUBLE PRECISION NOT NULL,
          geolocation_radius_meters INTEGER NOT NULL DEFAULT 1000,
          attendance_enabled BOOLEAN NOT NULL DEFAULT false,
          attendance_start_time TEXT,
          attendance_end_time TEXT,
          allow_late_checkin BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS device_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          device_id TEXT NOT NULL,
          device_fingerprint TEXT NOT NULL,
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          is_verified BOOLEAN NOT NULL DEFAULT false,
          last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT fk_device_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, device_id)
        );
        CREATE INDEX IF NOT EXISTS idx_attendance_checked_in_at ON attendance(checked_in_at);
        CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
        CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
        CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON device_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_device_sessions_device_id ON device_sessions(device_id);
        CREATE INDEX IF NOT EXISTS idx_qr_sessions_active ON qr_sessions(is_active, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_qr_sessions_code ON qr_sessions(qr_code);
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
  attendanceMethod?: "face" | "qr";
}) {
  await ensureSchema();
  await pool.query(
    `INSERT INTO attendance (id, student_id, status, checked_in_at, updated_at, note, face_image_url, confidence, latitude, longitude, updated_by_teacher_id, attendance_method) VALUES ($1,$2,$3,$4,NOW(),$5,$6,$7,$8,$9,$10,$11)`,
    [uid(), input.studentId, input.status, input.checkedInAt, input.note ?? null, input.faceImageUrl ?? null, input.confidence ?? null, input.latitude ?? null, input.longitude ?? null, input.updatedByTeacherId ?? null, input.attendanceMethod ?? "face"]
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
    SELECT a.id, a.student_id, s.name AS student_name, COALESCE(c.name, '-') AS class_name, a.status, a.checked_in_at, a.updated_at, a.note, a.face_image_url, a.confidence::float AS confidence, a.latitude, a.longitude, a.updated_by_teacher_id, CAST(a.attendance_method AS TEXT) AS attendance_method
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
    SELECT a.id, a.student_id, s.name AS student_name, COALESCE(c.name, '-') AS class_name, a.status, a.checked_in_at, a.updated_at, a.note, a.face_image_url, a.confidence::float AS confidence, a.latitude, a.longitude, a.updated_by_teacher_id, CAST(a.attendance_method AS TEXT) AS attendance_method
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

// Device Session Management (Strict Device Locking)
export type DeviceSession = {
  id: string;
  userId: string;
  deviceId: string;
  deviceFingerprint: string;
  latitude: number | null;
  longitude: number | null;
  isVerified: boolean;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
};

export async function getDeviceSession(userId: string, deviceId: string): Promise<DeviceSession | undefined> {
  await ensureSchema();
  const { rows } = await pool.query<any>(
    `SELECT id, user_id as "userId", device_id as "deviceId", device_fingerprint as "deviceFingerprint", 
            latitude, longitude, is_verified as "isVerified", last_activity_at as "lastActivityAt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM device_sessions WHERE user_id = $1 AND device_id = $2 LIMIT 1`,
    [userId, deviceId]
  );
  return rows[0];
}

export async function getDeviceSessionsByUserId(userId: string): Promise<DeviceSession[]> {
  await ensureSchema();
  const { rows } = await pool.query<any>(
    `SELECT id, user_id as "userId", device_id as "deviceId", device_fingerprint as "deviceFingerprint",
            latitude, longitude, is_verified as "isVerified", last_activity_at as "lastActivityAt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM device_sessions WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

export async function createOrUpdateDeviceSession(input: {
  userId: string;
  deviceId: string;
  deviceFingerprint: string;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<DeviceSession> {
  await ensureSchema();
  const existing = await getDeviceSession(input.userId, input.deviceId);
  
  if (existing) {
    // Update existing session
    const { rows } = await pool.query<any>(
      `UPDATE device_sessions 
       SET latitude = $1, longitude = $2, last_activity_at = NOW(), updated_at = NOW()
       WHERE user_id = $3 AND device_id = $4
       RETURNING id, user_id as "userId", device_id as "deviceId", device_fingerprint as "deviceFingerprint",
                 latitude, longitude, is_verified as "isVerified", last_activity_at as "lastActivityAt",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [input.latitude ?? null, input.longitude ?? null, input.userId, input.deviceId]
    );
    return rows[0];
  } else {
    // Create new session
    const sessionId = uid();
    const { rows } = await pool.query<any>(
      `INSERT INTO device_sessions 
       (id, user_id, device_id, device_fingerprint, latitude, longitude, is_verified, last_activity_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW(), NOW())
       RETURNING id, user_id as "userId", device_id as "deviceId", device_fingerprint as "deviceFingerprint",
                 latitude, longitude, is_verified as "isVerified", last_activity_at as "lastActivityAt",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [sessionId, input.userId, input.deviceId, input.deviceFingerprint, input.latitude ?? null, input.longitude ?? null]
    );
    return rows[0];
  }
}

export async function verifyDeviceSession(userId: string, deviceId: string): Promise<void> {
  await ensureSchema();
  await pool.query(
    `UPDATE device_sessions SET is_verified = true, updated_at = NOW() WHERE user_id = $1 AND device_id = $2`,
    [userId, deviceId]
  );
}

export async function revokeAllDeviceSessions(userId: string): Promise<void> {
  await ensureSchema();
  await pool.query(`DELETE FROM device_sessions WHERE user_id = $1`, [userId]);
}

export async function revokeDeviceSession(userId: string, deviceId: string): Promise<void> {
  await ensureSchema();
  await pool.query(`DELETE FROM device_sessions WHERE user_id = $1 AND device_id = $2`, [userId, deviceId]);
}

// School Settings Management
export type SchoolSettings = {
  id: string;
  name: string;
  geolocation_latitude: number;
  geolocation_longitude: number;
  geolocation_radius_meters: number;
  attendance_enabled: boolean;
  attendance_start_time: string | null;
  attendance_end_time: string | null;
  allow_late_checkin: boolean;
  created_at: string;
  updated_at: string;
};

export async function getSchoolSettings(): Promise<SchoolSettings | undefined> {
  await ensureSchema();
  const { rows } = await pool.query<SchoolSettings>(
    `SELECT * FROM school_settings LIMIT 1`
  );
  return rows[0];
}

export async function initializeSchoolSettings(): Promise<SchoolSettings> {
  await ensureSchema();
  const existing = await getSchoolSettings();
  if (existing) return existing;

  const settingsId = uid();
  const { rows } = await pool.query<SchoolSettings>(
    `INSERT INTO school_settings 
     (id, name, geolocation_latitude, geolocation_longitude, geolocation_radius_meters, 
      attendance_enabled, attendance_start_time, attendance_end_time, allow_late_checkin, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     RETURNING *`,
    [
      settingsId,
      "Sekolah",
      -6.2088, // Default Jakarta Selatan
      106.8456,
      1000, // 1km radius
      false,
      "07:00",
      "14:00",
      true
    ]
  );
  return rows[0];
}

export async function updateSchoolSettings(input: {
  name?: string;
  geolocation_latitude?: number;
  geolocation_longitude?: number;
  geolocation_radius_meters?: number;
  attendance_enabled?: boolean;
  attendance_start_time?: string | null;
  attendance_end_time?: string | null;
  allow_late_checkin?: boolean;
}): Promise<SchoolSettings> {
  await ensureSchema();
  const current = await getSchoolSettings() || await initializeSchoolSettings();

  const { rows } = await pool.query<SchoolSettings>(
    `UPDATE school_settings 
     SET 
       name = COALESCE($1, name),
       geolocation_latitude = COALESCE($2, geolocation_latitude),
       geolocation_longitude = COALESCE($3, geolocation_longitude),
       geolocation_radius_meters = COALESCE($4, geolocation_radius_meters),
       attendance_enabled = COALESCE($5, attendance_enabled),
       attendance_start_time = COALESCE($6, attendance_start_time),
       attendance_end_time = COALESCE($7, attendance_end_time),
       allow_late_checkin = COALESCE($8, allow_late_checkin),
       updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [
      input.name || null,
      input.geolocation_latitude || null,
      input.geolocation_longitude || null,
      input.geolocation_radius_meters || null,
      input.attendance_enabled ?? null,
      input.attendance_start_time ?? null,
      input.attendance_end_time ?? null,
      input.allow_late_checkin ?? null,
      current.id
    ]
  );
  return rows[0];
}

export async function createQrSession(input: {
  qrCode: string;
  createdByTeacherId: string;
}): Promise<QrSession> {
  await ensureSchema();
  const { rows } = await pool.query<QrSession>(
    `INSERT INTO qr_sessions (id, qr_code, created_by_teacher_id, is_active, created_at)
     VALUES ($1, $2, $3, true, NOW())
     RETURNING id, qr_code, created_by_teacher_id, is_active, created_at, used_at`,
    [uid(), input.qrCode, input.createdByTeacherId]
  );
  return rows[0];
}

export async function getQrSessionByCode(qrCode: string): Promise<QrSession | undefined> {
  await ensureSchema();
  const { rows } = await pool.query<QrSession>(
    `SELECT id, qr_code, created_by_teacher_id, is_active, created_at, used_at FROM qr_sessions WHERE qr_code = $1 LIMIT 1`,
    [qrCode]
  );
  return rows[0];
}

export async function getActiveQrSession(teacherId: string): Promise<QrSession | undefined> {
  await ensureSchema();
  const { rows } = await pool.query<QrSession>(
    `SELECT id, qr_code, created_by_teacher_id, is_active, created_at, used_at FROM qr_sessions WHERE created_by_teacher_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
    [teacherId]
  );
  return rows[0];
}

export async function deactivateQrSession(qrSessionId: string): Promise<void> {
  await ensureSchema();
  await pool.query(`UPDATE qr_sessions SET is_active = false, used_at = NOW() WHERE id = $1`, [qrSessionId]);
}

export async function listQrSessions(teacherId: string, limit = 10): Promise<QrSession[]> {
  await ensureSchema();
  const { rows } = await pool.query<QrSession>(
    `SELECT id, qr_code, created_by_teacher_id, is_active, created_at, used_at FROM qr_sessions WHERE created_by_teacher_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [teacherId, limit]
  );
  return rows;
}
