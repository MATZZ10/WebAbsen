import { auth } from "@/auth";
import { 
  getUserById,
  revokeAllDeviceSessions
} from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

/**
 * ADMIN ONLY - Reset all devices for a user
 * Only teachers can reset student devices
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Only teachers can reset devices
    if (!session?.user?.id || session.user.role !== "teacher") {
      return NextResponse.json(
        { error: "Hanya guru yang bisa mereset perangkat siswa" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID diperlukan" },
        { status: 400 }
      );
    }

    // Verify user exists
    const targetUser = await getUserById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Teachers cannot reset other teachers' devices
    if (targetUser.role === "teacher") {
      return NextResponse.json(
        { error: "Tidak bisa mereset perangkat guru lain" },
        { status: 403 }
      );
    }

    // Revoke all devices for the user
    await revokeAllDeviceSessions(userId);

    return NextResponse.json({
      success: true,
      message: `Semua perangkat dari ${targetUser.name} berhasil direset. User harus login ulang.`
    });

  } catch (error) {
    console.error("Device reset error:", error);
    return NextResponse.json(
      { error: "Gagal mereset perangkat. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
