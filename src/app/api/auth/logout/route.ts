import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear the auth cookie
    cookieStore.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, 
      path: "/",
    });
    
    logger.info("Admin logged out.");

    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    logger.error("Logout API Error", { error: error.message });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
