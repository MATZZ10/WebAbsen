import { auth } from "@/auth";
import { 
  createOrUpdateDeviceSession, 
  getDeviceSessionsByUserId,
  revokeDeviceSession,
  verifyDeviceSession,
  getSchoolSettings,
  initializeSchoolSettings
} from "@/lib/db";
import { generateDeviceFingerprint, getDistanceMeters } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

/**
 * STRICT DEVICE VERIFICATION + GEOLOCATION VALIDATION
 * 
 * Rules:
 * - 1 user = 1 device (tidak bisa diakali)
 * - Verifikasi lokasi dari school settings
 * - Check geolocation radius
 * - Attendance time gate validation
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { deviceId, latitude, longitude, deviceFingerprint } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID diperlukan" },
        { status: 400 }
      );
    }

    // Get school settings
    let schoolSettings = await getSchoolSettings();
    if (!schoolSettings) {
      schoolSettings = await initializeSchoolSettings();
    }

    // Validate geolocation if both coordinates provided
    if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
      const distance = getDistanceMeters(
        schoolSettings.geolocation_latitude,
        schoolSettings.geolocation_longitude,
        latitude,
        longitude
      );

      if (distance > schoolSettings.geolocation_radius_meters) {
        return NextResponse.json(
          {
            error: `Lokasi Anda di luar area sekolah. Jarak: ${(distance / 1000).toFixed(2)}km, Radius: ${(schoolSettings.geolocation_radius_meters / 1000).toFixed(2)}km`
          },
          { status: 400 }
        );
      }
    }

    // Generate device fingerprint dari client
    const clientFingerprint = deviceFingerprint || generateDeviceFingerprint(deviceId);

    // Get all active sessions for this user
    const existingSessions = await getDeviceSessionsByUserId(session.user.id);

    // If user has an existing session with DIFFERENT device, revoke it
    if (existingSessions.length > 0) {
      for (const sess of existingSessions) {
        if (sess.deviceId !== deviceId) {
          // STRICT: Revoke all other devices
          await revokeDeviceSession(sess.userId, sess.deviceId);
        }
      }
    }

    // Create or update device session
    const deviceSession = await createOrUpdateDeviceSession({
      userId: session.user.id,
      deviceId,
      deviceFingerprint: clientFingerprint,
      latitude: latitude || null,
      longitude: longitude || null
    });

    // Verify the device
    await verifyDeviceSession(session.user.id, deviceId);

    return NextResponse.json({
      success: true,
      message: "Perangkat berhasil diverifikasi",
      device: {
        id: deviceSession.id,
        deviceId: deviceSession.deviceId,
        isVerified: true,
        lastActivityAt: deviceSession.lastActivityAt
      }
    });

  } catch (error) {
    console.error("Device verification error:", error);
    return NextResponse.json(
      { error: "Gagal memverifikasi perangkat. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const sessions = await getDeviceSessionsByUserId(session.user.id);

    return NextResponse.json({
      success: true,
      devices: sessions
    });

  } catch (error) {
    console.error("Get devices error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data perangkat" },
      { status: 500 }
    );
  }
}
