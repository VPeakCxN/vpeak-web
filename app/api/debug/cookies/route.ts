import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    const sessionCookies = allCookies.filter(cookie => 
      ['session_id', 'session_key', 'uid', 'name', 'email', 'regno', 'user_data'].includes(cookie.name)
    );

    // Also check client-side cookies
    const clientCookies = document.cookie
      .split(';')
      .map(cookie => cookie.trim())
      .filter(cookie => {
        const [name] = cookie.split('=');
        return ['session_id', 'session_key', 'uid', 'name', 'email', 'regno', 'user_data'].includes(name);
      })
      .map(cookie => {
        const [name, ...valueParts] = cookie.split('=');
        return { name, value: decodeURIComponent(valueParts.join('=')) };
      });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      serverCookies: sessionCookies.map(c => ({ 
        name: c.name, 
        hasValue: !!c.value,
        valuePreview: c.value ? c.value.substring(0, 20) + "..." : null 
      })),
      clientCookies: clientCookies.map(c => ({ 
        name: c.name, 
        hasValue: !!c.value,
        valuePreview: c.value ? c.value.substring(0, 20) + "..." : null 
      })),
      cookieCount: {
        server: allCookies.length,
        sessionServer: sessionCookies.length,
        client: clientCookies.length
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Debug failed", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}