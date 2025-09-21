import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';
import { AuthCookieData } from '@/lib/cookies.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Session fetch called');

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('📦 Cookies received:', allCookies.map(c => ({ name: c.name, value: c.value ? 'present' : 'empty' })));

    const uid = cookieStore.get('uid')?.value;
    const userDataCookie = cookieStore.get('user_data')?.value;

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

    // Get Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔍 Supabase getSession result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      error: sessionError?.message,
    });

    if (sessionError) {
      console.log('❌ Supabase session error:', sessionError.message);
      return NextResponse.json(
        { valid: false, reason: `Supabase session error: ${sessionError.message}` },
        { status: 401 }
      );
    }

    if (!session || !session.user) {
      console.log('❌ No active Supabase session or user');
      return NextResponse.json(
        { valid: false, reason: 'No active Supabase session' },
        { status: 401 }
      );
    }

    console.log('✅ Supabase user:', session.user.id);

    // Verify UID matches
    if (uid && session.user.id !== uid) {
      console.log('❌ UID mismatch:', { supabaseUid: session.user.id, cookieUid: uid });
      return NextResponse.json(
        { valid: false, reason: 'Session UID mismatch' },
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
        .select('uid, name, regno, email')
        .eq('uid', session.user.id)
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
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    console.log('✅ Session fetch complete:', userData.uid);

    return NextResponse.json({
      valid: true,
      user: userData,
      session: {
        id: session.access_token,
        uid: session.user.id,
        created_at: new Date(session.created_at * 1000).toISOString(),
        expires_at: new Date(session.expires_at * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('💥 Session fetch error:', error);
    return NextResponse.json(
      { valid: false, reason: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}