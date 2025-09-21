"use client";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { Logo } from "@/components/logo/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MessageSquare,
  Calendar,
  BookOpen,
  ShoppingBag,
  Trophy,
  MapPin,
  TrendingUp,
  Lightbulb,
  Camera,
  Shield,
  Zap,
  ArrowRight,
  Star,
  Building2,
  Heart,
  Lock,
  ChevronRight,
  Sparkles,
  Eye,
  UserCheck,
  Database,
  Fingerprint,
} from "lucide-react";
import { useEffect, useState } from "react";
import { VerifiedUser } from "@/lib/auth/types";

const featuresMain = [
  {
    icon: Users,
    title: "Posts & Feed",
    description: "Campus updates, notes, and posts with scoped visibility.",
    badge: "Core",
    size: "large",
  },
  {
    icon: MessageSquare,
    title: "Chats",
    description: "1:1 and group conversations with role permissions.",
    badge: "Core",
    size: "medium",
  },
  {
    icon: Building2,
    title: "Clubs",
    description: "Join clubs and engage with communities.",
    badge: "Core",
    size: "small",
  },
  {
    icon: Calendar,
    title: "Events",
    description: "Browse fests, RSVP, and get reminders.",
    badge: "Core",
    size: "medium",
  },
  {
    icon: BookOpen,
    title: "Timetable",
    description: "Personal schedules, exams, and reminders.",
    badge: "Core",
    size: "large",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    description: "Buy/sell books and essentials safely.",
    badge: "Core",
    size: "small",
  },
];

const whyVPeakFeatures = [
  {
    icon: Shield,
    title: "Unified Experience",
    description: "Replace fragmented tools with one comprehensive platform designed specifically for campus life.",
  },
  {
    icon: UserCheck,
    title: "Role-Aware Permissions",
    description: "Smart access controls that understand your role as student, faculty, or admin automatically.",
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    description: "Stay connected with instant notifications and live updates across all campus activities.",
  },
];

const privacyFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All personal conversations and sensitive data are protected with military-grade encryption.",
  },
  {
    icon: Eye,
    title: "Granular Privacy Controls",
    description: "Choose exactly who can see your posts, profile information, and activity status.",
  },
  {
    icon: Database,
    title: "Local Data Storage",
    description: "Your academic records and personal information stay within your institution's secure servers.",
  },
  {
    icon: Fingerprint,
    title: "Secure Authentication",
    description: "Multi-factor authentication and biometric login options keep your account protected.",
  },
];

const featuresAdditional = [
  {
    icon: MapPin,
    title: "Campus Map & Navigation",
    description: "Wayfinding for classrooms, hostels, cafeterias, labs, and event venues.",
    badge: "Additional",
    size: "medium",
  },
  {
    icon: TrendingUp,
    title: "Analytics & Insights",
    description: "Privacy-conscious attendance and grade trend views with personal performance indicators.",
    badge: "Additional",
    size: "large",
  },
  {
    icon: Trophy,
    title: "Rewards & Gamification",
    description: "Points, badges, and leaderboards to incentivize contributions and engagement.",
    badge: "Additional",
    size: "small",
  },
  {
    icon: Lightbulb,
    title: "Idea & Innovation Hub",
    description: "Pitch ideas, form teams, and join challenges to foster student-led initiatives.",
    badge: "Additional",
    size: "medium",
  },
  {
    icon: Camera,
    title: "Media Gallery",
    description: "Event and club photos/videos with selective visibility and tagging.",
    badge: "Additional",
    size: "small",
  },
  {
    icon: Heart,
    title: "Interest-based Communities",
    description: "Topic spaces for music, sports, coding, and hobbies to promote peer learning.",
    badge: "Additional",
    size: "large",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.58, 1] },
  },
};

const heroVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0, 0, 0.58, 1] },
  },
};

const logoVariants: Variants = {
  hidden: { opacity: 0, rotate: 0 },
  visible: {
    opacity: 1,
    rotate: 360,
    transition: {
      rotate: {
        repeat: Infinity,
        duration: 10, // Slow spin (10 seconds per rotation)
        ease: "linear",
      },
      opacity: { duration: 0.5 },
    },
  },
};

const getHierarchicalGridClasses = (index: number) => {
  if (index === 0) return "col-span-2 row-span-2";
  if (index === 1) return "col-span-2 row-span-1";
  if (index === 2) return "col-span-1 row-span-1";
  if (index === 3) return "col-span-1 row-span-1";
  if (index === 4) return "col-span-2 row-span-1";
  return "col-span-1 row-span-1";
};

export default function LandingPage() {
  const [user, setUser] = useState<VerifiedUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/user", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch((err) => {
        console.error("Fetch error:", err);
      });
  }, []);

  return (
    <div>
      {error && (
        <div className="container mx-auto px-4 py-4 text-red-500">
          {error}
        </div>
      )}

      <motion.section
        initial="hidden"
        animate="visible"
        variants={heroVariants}
        className="min-h-screen flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 py-20 px-4"
      >
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Logo size={100}/>
            <Badge variant="secondary" className="mb-4 inline-flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Unified Campus Platform
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6 text-balance">
              Welcome to VPeak
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 text-pretty">
              Unify academics, social life, and official communications in one student-first web app. Replace fragmented
              tools with a trusted, timely platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="group">
                <Link href="/login">
                  Get Started <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/">
                  Explore Features <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <section className="min-h-screen flex flex-col justify-center py-20 px-4 bg-gradient-to-b from-background to-muted/10">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Core Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Essential tools to streamline your campus life with seamless integration and role-aware access.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {featuresMain.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative group"
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card overflow-hidden rounded-2xl">
                  <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="pt-8 pb-4 px-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors duration-300">
                        <feature.icon className="h-8 w-8 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-sm font-medium px-3 py-1">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-semibold group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-8">
                    <CardDescription className="text-base text-muted-foreground leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="min-h-screen flex flex-col justify-center py-20 px-4 bg-primary">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary-foreground">Why VPeak?</h2>
            <p className="text-xl text-primary-foreground/60 max-w-3xl mx-auto text-pretty">
              Built specifically for modern campus life, VPeak addresses the unique challenges students and faculty
              face with fragmented digital tools.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {whyVPeakFeatures.map((feature, index) => (
              <motion.div key={index} variants={itemVariants} className="smooth-transition">
                <Card className="h-full text-xl  border-0 shadow-xl transition-all duration-300 group bg-primary-foreground">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-secondary text-primary group-hover:scale-110 transition-transform">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl  text-primary group-hover:text-secondary">
                        {feature.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="min-h-screen flex flex-col justify-center py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Privacy at VPeak</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 text-pretty">
              Your privacy and security are our top priorities. We've built VPeak with privacy-first principles and
              industry-leading security measures.
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-secondary/30"></div>

            <div className="space-y-12">
              {privacyFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="relative flex items-start gap-8"
                >
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center shadow-lg">
                      <feature.icon className="h-8 w-8 text-secondary-foreground" />
                    </div>
                  </div>

                  <Card className="flex-1 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-card">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-2xl group-hover:text-secondary transition-colors">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-lg leading-relaxed">{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="min-h-screen flex flex-col justify-center py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Additional Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Enhance your experience with tools for navigation, engagement, and innovation.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {featuresAdditional.map((feature, index) => (
              <motion.div key={index} variants={itemVariants} className="smooth-transition">
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group bg-card">
                  <CardHeader className="pb-6 text-center">
                    <div className="mx-auto mb-4 p-4 bg-accent/10 rounded-2xl w-fit group-hover:bg-accent/20 transition-colors">
                      <feature.icon className="h-12 w-12 text-accent" />
                    </div>
                    <Badge variant="outline" className="w-fit mx-auto mb-4">
                      {feature.badge}
                    </Badge>
                    <CardTitle className="text-xl group-hover:text-accent transition-colors">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="min-h-screen flex flex-col justify-center py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-primary to-accent rounded-2xl p-12 text-primary-foreground"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              Ready to Transform Your Campus Experience?
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-pretty">
              Join VPeak today and unify your academic and social life in one powerful platform.
            </p>
            <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-secondary-foreground">
              <Link href="/login">
                Sign Up Now <Star className="h-5 w-5 ml-2 animate-pulse" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}