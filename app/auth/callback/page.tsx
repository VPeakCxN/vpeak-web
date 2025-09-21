"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      let currentSession = null; // ✅ FIXED: Use let instead of const for reassignability
      
      try {
        if (!isMounted) return;
        
        console.log("🔄 Auth callback started");
        console.log("📍 Full URL:", window.location.href);
        console.log("🔍 Search params:", Object.fromEntries(searchParams));

        // Check for OAuth errors first
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        
        if (error || errorDescription) {
          console.error("❌ OAuth error:", { error, errorDescription });
          toast.error("Sign In Failed", {
            description: error || errorDescription || "Authentication was cancelled",
          });
          if (isMounted) {
            setIsProcessing(false);
            router.push("/login");
          }
          return;
        }

        // ✅ STEP 1: Check for PKCE tokens in URL hash
        const hash = window.location.hash;
        console.log("🔍 URL Hash (PKCE tokens):", hash ? hash.substring(0, 50) + "..." : "No hash");

        if (hash.includes('access_token')) {
          console.log("✅ PKCE tokens detected in URL hash");
        } else {
          console.log("⚠️ No PKCE tokens in URL - this might be an issue");
        }

        // ✅ STEP 2: Get session - Supabase should automatically exchange PKCE tokens
        console.log("🔄 Attempting to get Supabase session...");
        
        // Wait a moment for the URL to fully load and tokens to be processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        console.log("📋 Session result:", { 
          hasSession: !!session, 
          sessionError: sessionError?.message,
          userId: session?.user?.id,
          email: session?.user?.email,
          accessToken: session?.access_token ? "present" : "missing"
        });

        currentSession = session; // ✅ FIXED: Assign to let variable

        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          // Try to refresh session
          console.log("🔄 Attempting session refresh...");
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error("❌ Refresh failed:", refreshError);
          }
          
          // Try one more time
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            console.log("✅ Session recovered on retry");
            currentSession = retrySession; // ✅ FIXED: Reassign to let variable
          } else {
            toast.error("Authentication Failed", {
              description: "Failed to establish secure session. Please try again.",
            });
            if (isMounted) {
              setIsProcessing(false);
              router.push("/login");
            }
            return;
          }
        }

        if (!currentSession || !currentSession.user) {
          console.error("❌ No user session available");
          toast.error("Authentication Failed", {
            description: "No user data received. Please try signing in again.",
          });
          if (isMounted) {
            setIsProcessing(false);
            router.push("/login");
          }
          return;
        }

        const user = currentSession.user; // ✅ FIXED: Use currentSession
        const email = user.email;

        if (!email) {
          console.error("❌ No email in user object");
          toast.error("Authentication Failed", {
            description: "No email address received from Google.",
          });
          if (isMounted) {
            setIsProcessing(false);
            router.push("/login");
          }
          return;
        }

        console.log("✅ Supabase session established:", { 
          email, 
          userId: user.id,
          fullName: user.user_metadata?.full_name 
        });

        // ✅ STEP 3: Validate email domain (NOW after successful Google auth)
        console.log("🔍 Validating email domain...");
        if (!email.endsWith("@vitstudent.ac.in")) {
          console.log("❌ Invalid email domain:", email);
          await supabase.auth.signOut();
          toast.error("Access Denied", {
            description: `Only @vitstudent.ac.in email addresses are allowed. Your email: ${email}`,
          });
          if (isMounted) {
            setIsProcessing(false);
            router.push("/login");
          }
          return;
        }

        console.log("✅ Email domain validated:", email);

        // ✅ STEP 4: Extract user data
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
        const nameParts = fullName.trim().split(/\s+/);
        const regno = nameParts.pop() || "";
        const name = nameParts.join(" ") || "Student";

        console.log("👤 Extracted user data:", { 
          fullName, 
          name, 
          regno, 
          email,
          avatar: user.user_metadata?.avatar_url
        });

        // ✅ STEP 5: Create VPeak session
        console.log("🔄 Creating VPeak session...");
        
        const response = await fetch("/api/auth/session/create", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            email,
            name,
            regno,
            avatar: user.user_metadata?.avatar_url,
          }),
          credentials: 'include',
        });

        console.log("📡 VPeak session API response:", { 
          status: response.status,
          ok: response.ok
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ VPeak session creation failed:", errorText);
          toast.error("Session Error", {
            description: "Failed to create your VPeak account. Please try again.",
          });
          await supabase.auth.signOut();
          if (isMounted) {
            setIsProcessing(false);
            router.push("/login");
          }
          return;
        }

        const sessionData = await response.json();
        console.log("✅ VPeak session created:", sessionData.session_id);

        // ✅ STEP 6: Set client-side cookies
        console.log("🍪 Setting session cookies...");
        
        const cookieExpiry = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000).toUTCString();
        const cookiePath = "/";
        const isSecure = window.location.protocol === 'https:';
        
        const setCookie = (name: string, value: string) => {
          const cookieString = [
            `${name}=${encodeURIComponent(value)}`,
            `expires=${cookieExpiry}`,
            `path=${cookiePath}`,
            `SameSite=Lax`
          ].join('; ');
          
          document.cookie = isSecure ? `${cookieString}; Secure` : cookieString;
          console.log(`✅ Set cookie: ${name}`);
        };

        // Set all session cookies
        setCookie("session_id", sessionData.session_id);
        setCookie("session_key", sessionData.session_key);
        setCookie("uid", sessionData.user.uid);
        setCookie("name", sessionData.user.name);
        setCookie("email", sessionData.user.email);
        setCookie("regno", sessionData.user.regno);
        setCookie("user_data", JSON.stringify(sessionData.user));

        console.log("✅ All session cookies set");

        // ✅ STEP 7: Persist Supabase session
        console.log("💾 Persisting Supabase session...");
        const { error: persistError } = await supabase.auth.setSession({
          access_token: currentSession.access_token, // ✅ FIXED: Use currentSession
          refresh_token: currentSession.refresh_token!,
        });

        if (persistError) {
          console.error("⚠️ Supabase session persist error:", persistError.message);
          toast.warning("Session Warning", {
            description: "VPeak session created, but local storage might need refresh.",
          });
        } else {
          console.log("✅ Supabase session persisted");
        }

        // ✅ STEP 8: Clean URL (remove hash)
        window.history.replaceState({}, document.title, window.location.pathname);

        console.log("🎉 Authentication complete! Redirecting to dashboard...");

        toast.success("Welcome to VPeak!", {
          description: `Hello ${name}! You're now signed in as ${regno}.`,
          duration: 5000,
        });

        if (isMounted) {
          setIsProcessing(false);
          // Small delay to show success toast
          setTimeout(() => router.push("/dashboard"), 1500);
        }

      } catch (err) {
        console.error("💥 Callback error:", err);
        if (isMounted) {
          toast.error("Authentication Error", {
            description: "Something went wrong during sign in. Please try again.",
          });
          setIsProcessing(false);
          // Clean up
          await supabase.auth.signOut();
          router.push("/login");
        }
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  if (!isProcessing) {
    return null; // Component unmounts after redirect
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">
          {isProcessing ? "Setting up your VPeak account..." : "Complete!"}
        </p>
      </div>
    </div>
  );
}