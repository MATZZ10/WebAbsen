import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { listAttendanceRange, listStudents } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "Start and end dates required" },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    const attendance = await listAttendanceRange(
      startDate.toISOString(),
      endDate.toISOString()
    );

    const allStudents = await listStudents();

    let filtered = attendance;
    if (classId && classId !== "all") {
      filtered = filtered.filter((a) => a.class_name === classId);
    }
    if (status && status !== "all") {
      filtered = filtered.filter((a) => a.status === status);
    }

    const statistics = {
      totalRecords: filtered.length,
      present: filtered.filter((a) => a.status === "present").length,
      late: filtered.filter((a) => a.status === "late").length,
      sick: filtered.filter((a) => a.status === "sick").length,
      alpa: filtered.filter((a) => a.status === "alpa").length,
      faceMethod: filtered.filter((a) => a.attendance_method === "face").length,
      qrMethod: filtered.filter((a) => a.attendance_method === "qr").length,
    };

    const studentStats = new Map<
      string,
      {
        studentName: string;
        className: string;
        totalDays: number;
        presentDays: number;
        lateDays: number;
        sickDays: number;
        alpaDays: number;
        attendanceRate: number;
        lastAttendance: string | null;
        trends: { date: string; status: string }[];
      }
    >();

    for (const a of filtered) {
      if (!studentStats.has(a.student_id)) {
        studentStats.set(a.student_id, {
          studentName: a.student_name,
          className: a.class_name,
          totalDays: 0,
          presentDays: 0,
          lateDays: 0,
          sickDays: 0,
          alpaDays: 0,
          attendanceRate: 0,
          lastAttendance: null,
          trends: [],
        });
      }

      const stats = studentStats.get(a.student_id)!;
      stats.totalDays++;
      if (a.status === "present") stats.presentDays++;
      else if (a.status === "late") stats.lateDays++;
      else if (a.status === "sick") stats.sickDays++;
      else if (a.status === "alpa") stats.alpaDays++;

      const date = new Date(a.checked_in_at).toLocaleDateString("id-ID");
      if (!stats.lastAttendance) stats.lastAttendance = date;
      stats.trends.push({ date, status: a.status });
    }

    for (const stats of studentStats.values()) {
      stats.attendanceRate =
        stats.totalDays > 0
          ? Math.round(
              ((stats.presentDays + stats.lateDays) / stats.totalDays) * 100
            )
          : 0;
    }

    const frequentlyAbsent = Array.from(studentStats.values())
      .filter((s) => s.alpaDays > 2 || s.attendanceRate < 70)
      .sort((a, b) => b.alpaDays - a.alpaDays)
      .slice(0, 10);

    const classList = [
      ...new Set(allStudents.map((s) => s.class_room_name).filter(Boolean)),
    ];

    return NextResponse.json({
      success: true,
      statistics,
      studentStats: Array.from(studentStats.entries()).map(([, stats]) => stats),
      frequentlyAbsent,
      classList,
      records: filtered.map((a) => ({
        id: a.id,
        studentId: a.student_id,
        studentName: a.student_name,
        className: a.class_name,
        status: a.status,
        checkedInAt: a.checked_in_at,
        attendanceMethod: a.attendance_method,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch recap data" },
      { status: 500 }
    );
  }
}
