// app/login/LoginClient.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chrome, Lock, Shield, Zap, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/logo/logo";
import { Loading } from "@/components/loading/loading";

export function LoginClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // CLIENT-SIDE REDIRECT: check session on mount
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // User is already logged in, redirect to dashboard
        router.replace("/dashboard");
      }

      setIsLoading(false);
    };

    checkSession();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        toast.error("OAuth Error", { description: oauthError.message });
        setError(oauthError.message);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Setup Error", {
          description: "No redirect URL received. Check Supabase configuration.",
        });
        setError("Failed to get OAuth URL from Supabase");
      }
    } catch (err: any) {
      toast.error("Connection Error", {
        description: err?.message || "Unable to connect to Google",
      });
      setError(err?.message || "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = () => {
    router.push("/login/email");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="bg-card border border-border shadow-xl overflow-hidden">
        <CardHeader className="text-center pt-6 space-y-4">
          <Logo size={80} />

          <div className="space-y-1">
            <h2 className="text-lg font-sans text-muted-foreground">Welcome To,</h2>
            <CardTitle className="text-3xl text-gradient-primary">
              <span className="font-semibold uppercase tracking-wide">VPeak</span>
            </CardTitle>
            <span className="font-semibold arial">Campus Connect</span>
          </div>

          <CardDescription className="text-secondary">
            Securely sign in to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pb-8 px-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            className="w-full max-w-xs mx-auto flex justify-center gap-2 bg-primary text-primary-foreground hover:bg-secondary smooth-transition"
            disabled={isLoading}
          >
            <Chrome className="w-4 h-4" />
            {isLoading ? <Loading size={16} /> : "Sign in with Google"}
          </Button>

          <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
            <span className="bg-card px-2">or</span>
          </div>

          <Button
            onClick={handleEmailSignIn}
            type="button"
            variant="outline"
            className="w-full max-w-xs mx-auto flex justify-center gap-2"
            disabled={isLoading}
          >
            <Mail className="w-4 h-4" />
            Sign in with Email
          </Button>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border">
            <div className="text-center space-y-2">
              <Lock className="w-6 h-6 text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">End-to-End Encrypted</p>
            </div>
            <div className="text-center space-y-2">
              <Shield className="w-6 h-6 text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">OAuth 2.0 + PKCE</p>
            </div>
            <div className="text-center space-y-2">
              <Zap className="w-6 h-6 text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">JWT Sessions</p>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-center text-muted-foreground"
          >
            By signing in, you agree to our{" "}
            <a
              href="/terms"
              className="text-primary underline underline-offset-2 hover:opacity-80 smooth-transition"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-primary underline underline-offset-2 hover:opacity-80 smooth-transition"
            >
              Privacy Policy
            </a>
            .
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}