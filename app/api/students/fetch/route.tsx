import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { uid }: { uid: string } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: "Missing UID" },
        { status: 400 }
      );
    }

    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No cookies needed for this operation
        },
      },
    });

    // Check if student exists
    const { data: student, error } = await supabase
      .from("students")
      .select("uid, name, regno, email")
      .eq("uid", uid)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows
      console.error("❌ Student fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch student data" },
        { status: 500 }
      );
    }

    if (student) {
      return NextResponse.json({
        exists: true,
        student: {
          uid: student.uid,
          name: student.name,
          email: student.email,
          regno: student.regno,
        },
      });
    } else {
      return NextResponse.json({
        exists: false,
        message: "Student not found",
      });
    }

  } catch (error) {
    console.error("💥 Student fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}