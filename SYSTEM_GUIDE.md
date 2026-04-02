# 🎓 WebAbsen - Sistem Absensi Sekolah Modern

Dokumentasi lengkap untuk WebAbsen - Platform absensi sekolah dengan geolocation validation, device locking ketat, dan time gate control.

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Fitur Utama](#fitur-utama)
3. [Arsitektur Sistem](#arsitektur-sistem)
4. [Panduan Setup](#panduan-setup)
5. [Admin Panel](#admin-panel)
6. [Siswa - Halaman Absensi](#siswa---halaman-absensi)
7. [Student Login](#student-login)
8. [API Documentation](#api-documentation)
9. [Security Features](#security-features)
10. [Troubleshooting](#troubleshooting)

---

## Overview

**WebAbsen** adalah platform absensi modern yang dirancang untuk mencegah pembobolan absensi di sekolah. Sistem ini menggunakan:

- ✅ **Geolocation Validation** - Siswa hanya bisa absen dari lokasi yang ditetapkan guru
- ✅ **Time Gate Control** - Guru mengontrol jam buka/tutup sistem absensi
- ✅ **Device Locking** - 1 akun = 1 perangkat (tidak bisa diakali)
- ✅ **Face Recognition** - Verifikasi wajah langsung dari kamera
- ✅ **Admin Panel** - Interface lengkap untuk pengaturan sekolah

---

## Fitur Utama

### 1. Geolocation Validation ✅

Sistem memvalidasi lokasi siswa dengan:
- **GPS Real-time** - Ambil koordinat dari device GPS
- **Radius Validation** - Cek apakah siswa berada dalam radius yang ditentukan guru
- **School Settings** - Koordinat sekolah dapat diatur di admin panel

**Cara Kerja:**
```
Siswa Login → Ambil GPS → Hitung Distance → 
Bandingkan dengan Radius → 
✓ PASS / ✗ REJECT
```

### 2. Time Gate System ✅

Guru dapat mengontrol kapan sistem absensi dibuka:
- **Flexible Time** - Atur jam mulai dan jam akhir
- **Automatic Check** - Sistem otomatis cek waktu saat siswa absen
- **Late Checkin** - Opsi untuk izinkan/tolak absensi terlambat

**Contoh:**
```
Sistem Dibuka: 07:00 - 14:00
- Jam 06:45 → ✗ Belum dibuka
- Jam 07:30 → ✓ Terbuka
- Jam 15:00 → ✗ Sudah ditutup
```

### 3. Device Locking ✅

Proteksi akun dengan:
- **1 Device per Account** - Satu akun hanya bisa login dari 1 device
- **Device Revocation** - Device lama otomatis di-revoke saat login dari device baru
- **Device Fingerprinting** - Browser properties di-hash untuk validasi ekstra

### 4. Landing Page ✅

Halaman depan yang professional dengan:
- Hero section yang eye-catching
- Feature cards yang informatif
- How it works section
- Security information
- Call-to-action buttons

---

## Arsitektur Sistem

```
┌─────────────────────────────────────┐
│     WebAbsen Architecture           │
├─────────────────────────────────────┤
│                                     │
│  Frontend (Next.js)                 │
│  ├── Landing Page (/)               │
│  ├── Student Login (/login)         │
│  ├── Attendance (/attendance)       │
│  ├── Admin Settings (/admin/settings)
│  └── Dashboard (/admin/**)          │
│                                     │
│  API (Route Handlers)               │
│  ├── /api/auth/device               │
│  ├── /api/auth/device/reset         │
│  ├── /api/admin/settings            │
│  ├── /api/attendance/checkin        │
│  └── /api/attendance/status         │
│                                     │
│  Database (PostgreSQL)              │
│  ├── users                          │
│  ├── students                       │
│  ├── attendance                     │
│  ├── device_sessions                │
│  └── school_settings                │
│                                     │
└─────────────────────────────────────┘
```

---

## Panduan Setup

### 1. Database Schema

Schema otomatis dibuat saat aplikasi dijalankan. Tabel yang penting:

**school_settings**
```sql
CREATE TABLE school_settings (
  id TEXT PRIMARY KEY,
  name TEXT,                          -- Nama sekolah
  geolocation_latitude DOUBLE,        -- Latitude lokasi sekolah
  geolocation_longitude DOUBLE,       -- Longitude lokasi sekolah
  geolocation_radius_meters INTEGER,  -- Radius area absensi (meter)
  attendance_enabled BOOLEAN,         -- Aktif/Nonaktif sistem
  attendance_start_time TEXT,         -- Jam mulai (HH:MM)
  attendance_end_time TEXT,           -- Jam akhir (HH:MM)
  allow_late_checkin BOOLEAN,         -- Izin absensi terlambat
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**device_sessions**
```sql
CREATE TABLE device_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,                       -- User(siswa/guru)
  device_id TEXT,                     -- Device unik ID
  device_fingerprint TEXT,            -- Hash device properties
  latitude DOUBLE,                    -- Lokasi saat login
  longitude DOUBLE,
  is_verified BOOLEAN,                -- Sudah diverifikasi
  last_activity_at TIMESTAMPTZ,
  UNIQUE(user_id, device_id)         -- PENTING: 1 device per user
);
```

### 2. Environment Variables

Minimal setup (database & auth):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/webabsen
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=random-secret-key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
TEACHER_EMAILS=teacher@school.com
```

Tidak perlu geolocation config! Semuanya diatur di admin panel.

### 3. Default School Settings

Saat pertama kali run, sistem otomatis membuat:
```
Nama: Sekolah
Latitude: -6.2088
Longitude: 106.8456
Radius: 1000m (1km)
Start Time: 07:00
End Time: 14:00
Enabled: false
```

**⚠️ Guru harus login dan enable sistem di admin settigs sebelum siswa bisa absen!**

---

## Admin Panel

Akses: `/admin/settings`

### Halaman Settings

**Lokasi Sekolah:**
- ✏️ Nama Sekolah - Nama institusi
- ✏️ Latitude - Koordinat Y lokasi sekolah
- ✏️ Longitude - Koordinat X lokasi sekolah
- ✏️ Radius - Jarak maksimal absensi (dalam meter)

**Sistem Absensi:**
- 🔘 Status - Aktifkan/nonaktifkan sistem absensi
- ⏰ Jam Mulai - Waktu buka sistem (format HH:MM)
- ⏰ Jam Akhir - Waktu tutup sistem
- 📝 Izin Terlambat - Boleh tidaknya absensi setelah jam normal

### Workflow Guru

```
1. Login sebagai guru
   ↓
2. Buka https://.../admin/settings
   ↓
3. Atur lokasi sekolah
   - Dapatkan koordinat dari Google Maps
   - Set radius sesuai area sekolah (1-2 km)
   ↓
4. Atur jadwal absensi
   - Jam mulai: 07:00 (atau sesuai)
   - Jam akhir: 14:00 (atau sesuai)
   ↓
5. Aktifkan sistem
   - Toggle "Aktifkan Sistem Absensi"
   ↓
6. Simpan pengaturan
```

---

## Siswa - Halaman Absensi

Akses: `/attendance`

### Interface

```
┌─────────────────────────────────────┐
│  SISTEM ABSENSI SISWA               │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────┐            │
│  │ ✓ Sistem Terbuka    │            │
│  │ Jam 07:00 - 14:00   │            │
│  └─────────────────────┘            │
│                                     │
│  ┌──────────────────────────────┐   │
│  │      VIDEO FEED              │   │
│  │     📷 (Live Camera)         │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                     │
│  ┌─ LOKASI ─┐  ┌─ JAM ─┐          │
│  │ ✓ Ada    │  │ ✓ Buka │          │
│  └──────────┘  └────────┘          │
│                                     │
│  Nomor Induk Siswa: [________]      │
│  [  ABSEN SEKARANG  ]               │
│                                     │
│  ✓ Absensi Berhasil                │
│  NIS: 1234 | Time: 07:45           │
│                                     │
└─────────────────────────────────────┘
```

### Alur Absensi Siswa

```
1. Siswa buka URL /attendance
   ↓
2. Sistem check:
   - ✓ Apakah system dibuka?
   - ✓ Apakah dalam jam absensi?
   - ✓ Apakah lokasi benar? (menunggu GPS)
   ↓
3. Siswa masukkan NIS
   ↓
4. Siswa arahkan wajah ke kamera
   ↓
5. Klik tombol "Absen Sekarang"
   ↓
6. Sistem:
   - Tunggu lokasi GPS tersedia
   - Validasi lokasi vs radius sekolah
   - Deteksi wajah dari video
   - Simpan data absensi (dengan foto + lokasi)
   ↓
7. ✓ Berhasil / ✗ Gagal (dengan pesan jelas)
```

### Error Messages & Solusi

| Error | Penyebab | Solusi |
|-------|----------|--------|
| "Sistem absensi belum dibuka" | Guru belum enable sistem | Tunggu guru buka sistem |
| "Jam absensi sudah berakhir" | Di luar jam yang diset | Absen lebih awal besok |
| "Lokasi di luar area sekolah" | GPS menunjukkan di luar radius | Masuk ke area sekolah |
| "Wajah tidak terdeteksi" | Kamera tidak bisa deteksi wajah | Pastikan pencahayaan bagus |
| "Izin lokasi ditolak" | Browser permission di-block | Izinkan akses lokasi di settings |
| "Kamera tidak aktif" | Kamera di-block atau error | Izinkan akses kamera di browser |

---

## Student Login

Akses: `/login`

### Fitur

- **Device ID Auto-Generate** - Sistem otomatis buat unique ID per device
- **Device Fingerprinting** - Capture browser properties untuk validasi
- **Session Verification** - Verifikasi device sebelum bisa akses dashboard
- **Device Lock** - Jika login dari device baru, device lama di-revoke otomatis

### Alur Login Siswa

```
1. Buka /login
   ↓
2. System:
   - Generate/ambil device ID dari localStorage
   - Create device fingerprint
   ↓
3. Klik "Masuk" atau login dengan Google
   ↓
4. Google OAuth flow
   ↓
5. POST /api/auth/device:
   - Verify device fingerprint
   - Validate geolocation (jika perlu)
   - Revoke device lain (jika ada)
   - Create device session
   ↓
6. ✓ Redirect ke dashboard / ✗ Logout dengan error
```

---

## API Documentation

### POST /api/admin/settings - Update Settings

**Auth:** Teacher only

**Request:**
```json
{
  "name": "SMA Negeri 1 Jakarta",
  "geolocation_latitude": -6.2088,
  "geolocation_longitude": 106.8456,
  "geolocation_radius_meters": 1500,
  "attendance_enabled": true,
  "attendance_start_time": "07:00",
  "attendance_end_time": "14:00",
  "allow_late_checkin": true
}
```

**Response:**
```json
{
  "id": "settings_1",
  "name": "SMA Negeri 1 Jakarta",
  "geolocation_latitude": -6.2088,
  "geolocation_longitude": 106.8456,
  "geolocation_radius_meters": 1500,
  "attendance_enabled": true,
  "attendance_start_time": "07:00",
  "attendance_end_time": "14:00",
  "allow_late_checkin": true,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### GET /api/attendance/status - Check Attendance Status

**Auth:** Public

**Response (Opened):**
```json
{
  "open": true,
  "reason": "Sistem absensi sedang dibuka",
  "startTime": "07:00",
  "endTime": "14:00",
  "currentTime": "07:45",
  "allowLateCheckin": true,
  "school": { ... }
}
```

**Response (Closed):**
```json
{
  "open": false,
  "reason": "Sistem absensi dibuka pukul 07:00 - 14:00",
  "startTime": "07:00",
  "endTime": "14:00",
  "currentTime": "06:30",
  "school": { ... }
}
```

### POST /api/auth/device - Verify Device

**Auth:** Authenticated user

**Request:**
```json
{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "deviceFingerprint": "hash123"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Perangkat berhasil diverifikasi",
  "device": {
    "id": "sess_1",
    "deviceId": "550e8400...",
    "isVerified": true,
    "lastActivityAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response Error (Out of Range):**
```json
{
  "error": "Lokasi Anda di luar area sekolah. Jarak: 2.5km, Radius: 1.0km"
}
```

### POST /api/auth/device/reset - Reset Device (Admin)

**Auth:** Teacher only

**Request:**
```json
{
  "userId": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Semua perangkat dari Muhammad Rafi berhasil direset. User harus login ulang."
}
```

---

## Security Features

### 1. Geolocation Validation

```
Lat1, Lon1 (Sekolah)
        ↓
    [RADIUS]  ← Guru set di settings
        ↓
Lat2, Lon2 (Siswa)
        ↓
Hitung distance = Haversine formula
        ↓
IF distance <= radius → ✓ PASS
ELSE → ✗ REJECT
```

**Implementasi:**
```typescript
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  // Haversine formula
  const toRad = (deg) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return 6371000 * c; // dalam meter
}
```

### 2. Device Locking

```
┌─────────────────────┐
│  User Login         │
│  dengan Device A    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Check existing      │
│ device sessions     │
└──────────┬──────────┘
           ↓
    ┌──────┴──────┐
    ↓             ↓
 Device A      Device B?
  (sama)       (revoke!)
    ↓             ↓
  create       DELETE
  session      session
```

### 3. Device Fingerprinting

```
Fingerprint = hash(
  browser userAgent +
  navigator.platform +
  navigator.language +
  timezone offset +
  deviceId
)
```

**Deteksi:**
- Browser beda → fingerprint beda → potentially suspicious
- Setup change → warning untuk user

### 4. Time Gate

```
current_time = NOW()
start_time = 07:00
end_time = 14:00

IF current_time < start_time → ✗ BELUM BUKA
IF current_time > end_time → ✗ SUDAH TUTUP
IF time in range → ✓ BUKA
```

---

## Troubleshooting

### Guru tidak bisa akses /admin/settings

**Penyebab:** Email guru tidak ada di TEACHER_EMAILS

**Solusi:**
```env
# .env
TEACHER_EMAILS=guru1@sekolah.com,guru2@sekolah.com
# Restart aplikasi
```

### Siswa tidak bisa absen meski di area sekolah

**Kemungkinan:**
1. GPS belum accuracy (tunggu 10-20 detik)
2. Radius terlalu kecil (setting di /admin/settings)
3. Koordinat sekolah salah (perbaiki di admin)

**Test:**
```javascript
// Buka console di browser, coords sudah acculate?
navigator.geolocation.getCurrentPosition(pos => {
  console.log(pos.coords.latitude, pos.coords.longitude);
});
```

### Sistem absensi tidak muncul di halaman /attendance

**Penyebab:** 
1. Guru belum enable sistem (check /admin/settings)
2. Di luar jam absensi

**Solusi:**
- Guru login → /admin/settings → Toggle ON
- Pastikan waktu server komputer benar

### Device lama ter-logout saat login dari device baru

**Ini normal!** Fitur device locking bekerja:
- Device lama otomatis di-revoke
- User harus login ulang dari device lama jika perlu

### Error "Lokasi di luar area sekolah"

**Debug:**
1. Check koordinat sekolah di admin panel
2. Bandingkan dengan Maps/GPS
3. Cek radius (jangan terlalu kecil)
4. GPS device perlu 30-45 detik untuk accuracy

**Koordinat Contoh:**
- Jakarta Selatan: -6.2088, 106.8456
- Bandung: -6.9175, 107.6062
- Yogyakarta: -7.7956, 110.3695

---

## Development Tips

### Running Locally

```bash
# Install dependencies
npm install

# Setup database
# Create .env.local dengan DATABASE_URL

# Start dev server
npm run dev

# Open http://localhost:3000
```

### Database Queries

```sql
-- Check school settings
SELECT * FROM school_settings LIMIT 1;

-- Check attendance hari ini
SELECT a.*, s.name FROM attendance a
JOIN students s ON s.id = a.student_id
WHERE DATE(a.checked_in_at) = CURRENT_DATE
ORDER BY a.checked_in_at DESC;

-- Check device sessions
SELECT d.*, u.name FROM device_sessions d
JOIN users u ON u.id = d.user_id
ORDER BY d.last_activity_at DESC;
```

### Common Coordinates

```
Jakarta Selatan: -6.2088, 106.8456
Jakarta Utara: -6.1256, 106.8272
Bandung: -6.9175, 107.6062
Surabaya: -7.2504, 112.7508
Medan: 3.5952, 98.6722
Yogyakarta: -7.7956, 110.3695
```

---

## Support & Contact

Untuk pertanyaan, lapor bug, atau fitur request:
- Email: support@webabsen.id
- GitHub Issues: github.com/.../issues
- Documentation: docs.webabsen.id

---

**Last Updated:** 2024  
**Version:** 2.0 (School Settings Management)  
**License:** MIT
