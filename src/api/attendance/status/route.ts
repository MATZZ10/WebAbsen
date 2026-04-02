import { getSchoolSettings, initializeSchoolSettings } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/attendance/status
 * Check if attendance system is open and time gate validation
 */

export async function GET() {
  try {
    let schoolSettings = await getSchoolSettings();
    if (!schoolSettings) {
      schoolSettings = await initializeSchoolSettings();
    }

    // Check if attendance is enabled
    if (!schoolSettings.attendance_enabled) {
      return NextResponse.json({
        open: false,
        reason: "Sistem absensi belum dibuka oleh guru",
        school: schoolSettings
      });
    }

    // Get current time
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');

    const startTime = schoolSettings.attendance_start_time || "07:00";
    const endTime = schoolSettings.attendance_end_time || "14:00";

    // Check if current time is within attendance window
    const isOpen = currentTime >= startTime && currentTime <= endTime;

    if (!isOpen) {
      const [startHour, startMin] = startTime.split(':');
      const [endHour, endMin] = endTime.split(':');
      
      return NextResponse.json({
        open: false,
        reason: `Sistem absensi dibuka pukul ${startTime} - ${endTime}`,
        startTime: startTime,
        endTime: endTime,
        currentTime: currentTime,
        school: schoolSettings
      });
    }

    return NextResponse.json({
      open: true,
      reason: "Sistem absensi sedang dibuka",
      startTime: startTime,
      endTime: endTime,
      currentTime: currentTime,
      allowLateCheckin: schoolSettings.allow_late_checkin,
      school: schoolSettings
    });

  } catch (error) {
    console.error("Get attendance status error:", error);
    return NextResponse.json(
      { error: "Gagal mengecek status absensi" },
      { status: 500 }
    );
  }
}
