import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { createQrSession, getActiveQrSession, deactivateQrSession, listQrSessions } from "@/lib/db";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action } = await req.json();

    if (action === "generate") {
      const deactivate = await getActiveQrSession(session.user.id);
      if (deactivate) {
        await deactivateQrSession(deactivate.id);
      }

      const qrCode = `qr_${session.user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const qrSession = await createQrSession({
        qrCode,
        createdByTeacherId: session.user.id,
      });

      const qrImageUrl = await QRCode.toDataURL(qrCode, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      return NextResponse.json({
        success: true,
        qrSession: {
          id: qrSession.id,
          code: qrSession.qr_code,
          imageUrl: qrImageUrl,
          createdAt: qrSession.created_at,
        },
      });
    }

    if (action === "list") {
      const sessions = await listQrSessions(session.user.id, 10);
      return NextResponse.json({
        success: true,
        sessions: sessions.map((s) => ({
          id: s.id,
          code: s.qr_code,
          isActive: s.is_active,
          createdAt: s.created_at,
          usedAt: s.used_at,
        })),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
