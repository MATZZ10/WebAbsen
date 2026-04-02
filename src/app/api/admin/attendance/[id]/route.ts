import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { updateAttendanceStatus } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const status = body.status as "present" | "late" | "sick" | "alpa";
  const note = typeof body.note === "string" ? body.note : null;

  if (!["present", "late", "sick", "alpa"].includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  const updated = await updateAttendanceStatus({
    id,
    status,
    note,
    teacherId: session.user.id,
  });

  return NextResponse.json({ ok: true, data: updated });
}
