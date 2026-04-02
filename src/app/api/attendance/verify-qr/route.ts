import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getQrSessionByCode, createAttendance, getSchoolSettings, getTodayRange } from "@/lib/db";
import { getDistanceMeters } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { qrCode, latitude, longitude } = await req.json();

    if (!qrCode) {
      return NextResponse.json({ error: "QR code required" }, { status: 400 });
    }

    const studentId = session.user.id;

    const qrSession = await getQrSessionByCode(qrCode);
    if (!qrSession) {
      return NextResponse.json({ error: "Invalid or expired QR code" }, { status: 400 });
    }

    if (!qrSession.is_active) {
      return NextResponse.json({ error: "QR code is no longer active" }, { status: 400 });
    }

    const schoolSettings = await getSchoolSettings();
    if (!schoolSettings) {
      return NextResponse.json({ error: "School settings not configured" }, { status: 400 });
    }

    if (!latitude || !longitude) {
      return NextResponse.json({ error: "Location required" }, { status: 400 });
    }

    if (schoolSettings.geolocation_latitude && schoolSettings.geolocation_longitude) {
      const distance = getDistanceMeters(
        latitude,
        longitude,
        schoolSettings.geolocation_latitude,
        schoolSettings.geolocation_longitude
      );

      if (distance > schoolSettings.geolocation_radius_meters) {
        return NextResponse.json(
          {
            error: `Location out of range. Distance: ${(distance / 1000).toFixed(2)}km`,
            distance,
          },
          { status: 400 }
        );
      }
    }

    const { start, end } = getTodayRange();
    await createAttendance({
      studentId,
      status: "present",
      checkedInAt: new Date().toISOString(),
      latitude,
      longitude,
      attendanceMethod: "qr",
    });

    return NextResponse.json({
      success: true,
      message: "QR attendance recorded successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process QR code" },
      { status: 500 }
    );
  }
}
