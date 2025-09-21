// app/login/email/LoginEmail.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import logo from "@/components/images/logo.png"

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

export function LoginEmail() {
  
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

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
              Welcome Back to,
            </h2>
            <CardTitle className="text-3xl text-gradient-primary">
              <span className="font-semibold uppercase tracking-wide">
                VPeak
              </span>
            </CardTitle>
            <span className="font-semibold arial">Campus Connect</span>
          </div>
          <CardDescription className="text-secondary">
            Sign in with your email and password
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 pb-8 px-6">
          {error && (
            <p className="text-red-500 text-center text-sm">
              {decodeURIComponent(error)}
            </p>
          )}
          <form className="space-y-4" action="/api/auth/email" method="post">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full justify-center gap-2 bg-primary text-primary-foreground hover:bg-secondary smooth-transition"
            >
              Sign In
            </Button>
          </form>

          <div className="pt-4 border-t border-border">
            <Link
              href="/login"
              className="flex items-center gap-2 text-primary hover:opacity-80 smooth-transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <p className="text-xs text-muted-foreground">
                Back to Sign-in Options
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}