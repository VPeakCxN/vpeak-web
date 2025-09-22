"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sun, Moon, Settings, LogOut, Menu, X } from "lucide-react";
import logo from "@/components/images/logo.png";
import { signOut } from "@/lib/auth/actions";
import { useCookies } from "@/hooks/getCookies";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet"; // Added SheetDescription
import { Sidebar } from '@/components/sidebar';

export function SiteHeaderClient() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { authSession, isAuthenticated, user, currentUserId } = useCookies();

  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Use the user from cookies if available
  const headerUser = user
    ? {
        name: user.name ?? "User",
        image: user.avatar ?? undefined,
      }
    : null;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Mobile menu button and Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden" // Visible only on mobile
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full p-0"> {/* Full-screen on mobile */}
              {/* Add SheetTitle and SheetDescription for accessibility - visually hidden */}
              <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Mobile navigation menu for accessing app features</SheetDescription>
              <div className="flex justify-end p-4">
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Close">
                    <X className="h-6 w-6" />
                  </Button>
                </SheetClose>
              </div>
              <Sidebar mobile /> {/* Pass mobile prop to render visible on mobile */}
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <Image src={logo} alt="VPeak logo" className="h-7 w-auto" priority />
            <span className="font-semibold uppercase tracking-wide">VPeak</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {/* Animated Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative h-8 w-8"
            aria-label="Toggle theme"
          >
            <motion.span
              className="absolute inset-0 flex items-center justify-center"
              animate={{ opacity: isDarkMode ? 0 : 1, scale: isDarkMode ? 0.5 : 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Sun className="h-5 w-5" />
            </motion.span>
            <motion.span
              className="absolute inset-0 flex items-center justify-center"
              animate={{ opacity: isDarkMode ? 1 : 0, scale: isDarkMode ? 1 : 0.5 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Moon className="h-5 w-5" />
            </motion.span>
          </Button>

          {isAuthenticated && headerUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={headerUser.image} alt={headerUser.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {headerUser.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{headerUser.name}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <form action={signOut} className="w-full">
                    <button type="submit" className="flex w-full cursor-pointer items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-secondary"
              onClick={() => router.push("/login")}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
