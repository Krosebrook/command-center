import { NextResponse } from "next/server";
import { scanDrive } from "@/lib/scanner";

export async function GET() {
  const stats = await scanDrive();
  return NextResponse.json(stats);
}
