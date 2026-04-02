import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  // Placeholder for your face model integration.
  // You can replace this with real verification service later.
  const image = body.image as string | undefined;

  if (!image) {
    return NextResponse.json({ message: "image required" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    matched: true,
    confidence: 98.3,
    message: "Wajah terdeteksi dengan baik"
  });
}
