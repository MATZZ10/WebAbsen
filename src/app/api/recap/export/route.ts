import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureSchema, getMonthRange, listAttendanceRange } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await ensureSchema();
  const { start, end } = getMonthRange(new Date());
  const rows = await listAttendanceRange(start.toISOString(), end.toISOString());

  return NextResponse.json({ ok: true, data: rows });
}
