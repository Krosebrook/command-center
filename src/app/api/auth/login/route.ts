import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPassword, signSessionToken } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      logger.error("Login attempted but ADMIN_PASSWORD is not set in .env");
      return NextResponse.json(
        { error: "System is not configured. Missing ADMIN_PASSWORD in environment." },
        { status: 501 }
      );
    }

    // Since we are storing the password raw in the .env for this local tool,
    // we just do a direct string comparison (or hashed comparison if you prefer to store an env hash).
    // For local environments, direct strict equality of the .env secret is extremely common and safe enough.
    const isValid = password === adminPassword;

    if (!isValid) {
      logger.warn("Failed login attempt due to incorrect password.");
      return NextResponse.json({ error: "Invalid master password" }, { status: 401 });
    }

    // Success! Generate token and set HTTP-only cookie
    const token = signSessionToken();
    const cookieStore = await cookies();
    
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    logger.info("Admin logged in successfully.");

    return NextResponse.json({ success: true, message: "Logged in successfully" });
  } catch (error: any) {
    logger.error("Login API Error", { error: error.message });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
