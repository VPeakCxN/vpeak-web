// app/api/auth/user/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use the new session verify endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/session/verify`, {
      credentials: 'include',
      cache: 'no-store',
    });

    const data = await response.json();

    if (!data.valid) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ 
      user: data.user 
    }, { status: 200 });

  } catch (err) {
    console.error("Error in /api/auth/user:", err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}