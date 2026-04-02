import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail, clearUserDeviceId } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  if (session.user.role !== "teacher") {
    return NextResponse.json({ error: "forbidden", message: "Hanya admin/teacher yang dapat mereset kunci perangkat." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = body?.email?.toString().trim();
  if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  await clearUserDeviceId(user.id);

  return NextResponse.json({ status: "ok", message: `Device lock set to null for ${email}` });
}
