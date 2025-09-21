import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database, AuthCookieData } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Session fetch called');

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('📦 Cookies received:', allCookies.map(c => ({ name: c.name, value: c.value ? 'present' : 'empty' })));

    const session_id = cookieStore.get('session_id')?.value;
    const session_key = cookieStore.get('session_key')?.value;
    const uid = cookieStore.get('uid')?.value;
    const userDataCookie = cookieStore.get('user_data')?.value;

    if (!session_id || !session_key || !uid) {
      console.log('❌ Missing required cookies');
      return NextResponse.json(
        { valid: false, reason: 'Missing session cookies' },
        { status: 401 }
      );
    }

    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            console.log('⚠️ Failed to set cookies');
          }
        },
      },
    });

    // Verify session in sessions table
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_id', session_id)
      .eq('session_key', session_key)
      .eq('uid', uid)
      .single();

    if (sessionError || !sessionData) {
      console.log('❌ Session not found or invalid:', sessionError?.message);
      return NextResponse.json(
        { valid: false, reason: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Check if session is expired
    const expiresAt = new Date(sessionData.expires_at);
    if (expiresAt < new Date()) {
      console.log('❌ Session expired:', sessionData.expires_at);
      return NextResponse.json(
        { valid: false, reason: 'Session expired' },
        { status: 401 }
      );
    }

    // Get user data
    let userData: AuthCookieData | null = null;
    if (userDataCookie) {
      try {
        userData = JSON.parse(userDataCookie) as AuthCookieData;
        console.log('✅ User data from cookie:', userData.uid);
      } catch {
        console.log('⚠️ Invalid user_data cookie');
      }
    }

    if (!userData) {
      console.log('🔍 Fetching user data from database...');
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('uid, name, regno, email') // Removed 'avatar'
        .eq('uid', uid)
        .single();

      if (studentError || !student) {
        console.log('❌ Student not found:', studentError?.message);
        return NextResponse.json(
          { valid: false, reason: 'User profile not found' },
          { status: 401 }
        );
      }

      userData = {
        uid: student.uid,
        name: student.name,
        email: student.email,
        regno: student.regno,
      };

      cookieStore.set('user_data', JSON.stringify(userData), {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    console.log('✅ Session fetch complete:', userData.uid);

    return NextResponse.json({
      valid: true,
      user: userData,
      session: {
        id: sessionData.session_id,
        uid: sessionData.uid,
        session_key: sessionData.session_key,
        created_at: sessionData.created_at,
        expires_at: sessionData.expires_at,
      },
    });
  } catch (error) {
    console.error('💥 Session fetch error:', error);
    return NextResponse.json(
      {
        valid: false,
        reason: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}