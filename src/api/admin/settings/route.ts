import { auth } from "@/auth";
import { getSchoolSettings, initializeSchoolSettings, updateSchoolSettings } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/settings - Get school settings
 * POST /api/admin/settings - Create/Update school settings (teacher only)
 */

export async function GET(request: NextRequest) {
  try {
    let settings = await getSchoolSettings();
    if (!settings) {
      settings = await initializeSchoolSettings();
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil pengaturan sekolah" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    // Only teachers can update settings
    if (!session?.user?.id || session.user.role !== "teacher") {
      return NextResponse.json(
        { error: "Hanya guru yang bisa mengubah pengaturan sekolah" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      geolocation_latitude,
      geolocation_longitude,
      geolocation_radius_meters,
      attendance_enabled,
      attendance_start_time,
      attendance_end_time,
      allow_late_checkin
    } = body;

    // Validate inputs
    if (geolocation_radius_meters && geolocation_radius_meters < 50) {
      return NextResponse.json(
        { error: "Radius lokasi minimal 50 meter" },
        { status: 400 }
      );
    }

    if (attendance_start_time && attendance_end_time) {
      if (attendance_start_time >= attendance_end_time) {
        return NextResponse.json(
          { error: "Jam mulai harus lebih awal dari jam akhir" },
          { status: 400 }
        );
      }
    }

    const updated = await updateSchoolSettings({
      name,
      geolocation_latitude,
      geolocation_longitude,
      geolocation_radius_meters,
      attendance_enabled,
      attendance_start_time,
      attendance_end_time,
      allow_late_checkin
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Gagal mengubah pengaturan sekolah" },
      { status: 500 }
    );
  }
}
