import { NextRequest, NextResponse } from "next/server";
import { ScanResult } from "@/lib/deep-scanner";
import { generateSuggestions } from "@/lib/suggestions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { results } = body as { results: ScanResult[] };

    if (!results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: "results array is required" },
        { status: 400 }
      );
    }

    const suggestions = await generateSuggestions(results);
    return NextResponse.json(suggestions);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate suggestions", details: String(error) },
      { status: 500 }
    );
  }
}
