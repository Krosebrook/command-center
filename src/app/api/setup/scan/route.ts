import { NextResponse } from "next/server";
import { deepScanDrive } from "@/lib/deep-scanner";

export async function GET() {
  try {
    const results = await deepScanDrive();
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: "Deep scan failed", details: String(error) },
      { status: 500 }
    );
  }
}
