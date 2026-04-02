import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserById, setUserDeviceId } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const deviceId = body?.deviceId?.toString().trim();
  if (!deviceId) return NextResponse.json({ error: "device_id_required" }, { status: 400 });

  const user = await getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  if (user.device_id && user.device_id !== deviceId) {
    return NextResponse.json({ error: "device_locked", message: "Akun sudah terkunci perangkat lain. Minta admin untuk me-reset GPS perangkat." }, { status: 403 });
  }

  if (!user.device_id) {
    await setUserDeviceId(user.id, deviceId);
  }

  return NextResponse.json({ status: "ok", deviceId });
}
