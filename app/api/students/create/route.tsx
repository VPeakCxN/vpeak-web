import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { uid, name, regno, email, avatar }: {
      uid: string;
      name: string;
      regno: string;
      email: string;
      avatar?: string;
    } = await request.json();

    // Validate required fields
    if (!uid || !name || !regno || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email domain
    if (!email.endsWith("@vitstudent.ac.in")) {
      return NextResponse.json(
        { error: "Only vitstudent.ac.in emails allowed" },
        { status: 401 }
      );
    }

    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No cookies needed
        },
      },
    });

    // Insert student record
    const { data: student, error } = await supabase
      .from("students")
      .insert({ 
        uid, 
        name, 
        regno, 
        email 
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Student creation error:", error);
      
      // Check if it's a duplicate key error
      if (error.code === "23505") { // Unique violation
        return NextResponse.json(
          { error: "Student already exists" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create student profile" },
        { status: 500 }
      );
    }

    console.log("✅ Student created successfully:", student.uid);
    
    return NextResponse.json({
      success: true,
      student: {
        uid: student.uid,
        name: student.name,
        email: student.email,
        regno: student.regno,
      },
    });

  } catch (error) {
    console.error("💥 Student creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}