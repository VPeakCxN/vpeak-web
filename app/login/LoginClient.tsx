// app/login/LoginClient.tsx
"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import logo from "@/components/images/logo.png";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chrome, Shield, Lock, Zap, Mail } from "lucide-react";
import { signInWithGoogleAction } from "./actions";
import Link from "next/link";

const logoVariants: Variants = {
  hidden: { opacity: 0, rotate: 0 },
  visible: {
    opacity: 1,
    rotate: 360,
    transition: {
      rotate: {
        repeat: Infinity,
        duration: 10,
        ease: "linear",
      },
      opacity: { duration: 0.5 },
    },
  },
};

export function LoginClient() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <Card className="bg-card border border-border shadow-xl overflow-hidden">
        <CardHeader className="text-center pt-6 space-y-4">
          <motion.img
            src={logo.src}
            alt="VPeak logo"
            width={80}
            height={80}
            variants={logoVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto mb-6"
          />

          <div className="space-y-1">
            <h2 className="text-lg font-sans text-muted-foreground">
              Welcome To,
            </h2>
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
          <form action={signInWithGoogleAction}>
            <Button
              type="submit"
              className="w-full max-w-xs mx-auto flex justify-center gap-2 bg-primary text-primary-foreground hover:bg-secondary smooth-transition"
            >
              <Chrome className="w-4 h-4" />
              Sign in with Google
            </Button>
          </form>

          <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
            <span className="bg-card px-2">or</span>
          </div>

          <Link href="/login/email">
            <Button
              variant="outline"
              className="w-full max-w-xs mx-auto flex justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Sign in with Email
            </Button>
          </Link>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border">
            <div className="text-center space-y-2">
              <Lock className="w-6 h-6 text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">
                End-to-End Encrypted
              </p>
            </div>
            <div className="text-center space-y-2">
              <Shield className="w-6 h-6 text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">
                OAuth 2.0 + PKCE
              </p>
            </div>
            <div className="text-center space-y-2">
              <Zap className="w-6 h-6 text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">
                JWT Sessions
              </p>
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