"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Mail, User, Calendar, GraduationCap } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthCookieData } from "@/lib/cookies.types";
import { Avatar } from "@radix-ui/react-avatar";
interface DashboardClientProps {
  error?: string | undefined;
}

export function DashboardClient({ error }: DashboardClientProps) {
  const [userData, setUserData] = useState<AuthCookieData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // ✅ STEP 1: Check Supabase session first (most reliable)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("✅ Supabase session found:", session.user.email);
          
          // ✅ STEP 2: Extract data from Google profile
          const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Student";
          const nameParts = fullName.trim().split(/\s+/);
          const regno = nameParts.pop() || "";
          const name = nameParts.join(" ") || "Student";
          
          const user: AuthCookieData = {
            uid: session.user.id,
            name,
            email: session.user.email!,
            regno,
            avatar: session.user.user_metadata?.avatar_url,
          };
          
          setUserData(user);
          setIsAuthenticated(true);
          console.log("✅ Dashboard authenticated:", user.name);
          return;
        }

        // ✅ STEP 3: Fallback to cookies (if Supabase session expired but cookies exist)
        console.log("🔍 Supabase session not found, checking cookies...");
        
        // Get user_data cookie
        const userDataCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('user_data='))
          ?.split('=')[1];
        
        if (userDataCookie) {
          try {
            const parsedUserData = JSON.parse(decodeURIComponent(userDataCookie)) as AuthCookieData;
            console.log("✅ User data from cookie:", parsedUserData.uid);
            
            // Quick validation
            if (parsedUserData.uid && parsedUserData.email?.endsWith('@vitstudent.ac.in')) {
              setUserData(parsedUserData);
              setIsAuthenticated(true);
              console.log("✅ Dashboard authenticated via cookies:", parsedUserData.name);
              return;
            }
          } catch (e) {
            console.error("❌ Invalid user_data cookie:", e);
          }
        }

        // ✅ STEP 4: No valid session found - redirect to login
        console.log("❌ No valid authentication found");
        toast.warning("Session Expired", {
          description: "Please sign in again.",
        });
        router.push("/login");
        
      } catch (error) {
        console.error("💥 Dashboard auth check failed:", error);
        toast.error("Session Error", {
          description: "Unable to verify your session.",
        });
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    try {
      console.log("🔐 Signing out...");
      
      // Clear Supabase session
      await supabase.auth.signOut();
      
      // Clear all cookies
      const cookieNames = [
        "session_id", "session_key", "uid", "name", "email", 
        "regno", "user_data"
      ];
      
      cookieNames.forEach(name => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });

      toast.success("Signed Out", {
        description: "See you soon!",
      });

      router.push("/login");
      router.refresh();
      
    } catch (error) {
      console.error("💥 Sign out error:", error);
      toast.error("Sign Out Failed", {
        description: "Please refresh the page.",
      });
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if provided
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive">
                <h2 className="text-xl font-semibold">Error</h2>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={() => router.push("/login")}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show not authenticated if no session
  if (!isAuthenticated || !userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive">
                <h2 className="text-xl font-semibold">Session Not Found</h2>
                <p className="text-sm">Please sign in again.</p>
              </div>
              <Button onClick={() => router.push("/login")}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ SHOW DASHBOARD - JUST HELLO NAME AS REQUESTED
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4"
    >
      <div className="container mx-auto max-w-4xl">
        {/* Header - SIMPLE HELLO MESSAGE */}
        <div className="flex justify-between items-center mb-8 py-8">
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-bold text-foreground"
            >
              Hello, {userData.name}!
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground"
            >
              Welcome back to VPeak Campus Connect
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </motion.div>
        </div>

        {/* Simple User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <p className="text-lg font-semibold">{userData.name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Registration No.
                  </label>
                  <p className="text-lg font-semibold">{userData.regno}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-lg font-semibold break-all">{userData.email}</p>
                </div>
                {userData.avatar && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Profile Picture
                    </label>
                    <img
                      src={userData.avatar}
                      alt={`${userData.name}'s profile`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Simple Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                <span className="font-medium">Active Session</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="w-full justify-start">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  View Courses
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  My Schedule
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Messages
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}