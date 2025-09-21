"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { VerifiedUser } from "@/lib/auth/types";

export default function SettingsPage() {
  const [user, setUser] = useState<VerifiedUser | null>(null);
  const [error, setError] = useState(null);
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
        setError(err);
      });
  }, []);

  // Profile
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [phone, setPhone] = useState("+1 234 567 890");

  // Account
  const [password, setPassword] = useState("");

  // Notifications
  const [notificationsEmail, setNotificationsEmail] = useState(true);
  const [notificationsSMS, setNotificationsSMS] = useState(false);
  const [notificationsPush, setNotificationsPush] = useState(true);

  // Privacy
  const [profileVisibility, setProfileVisibility] = useState("public");

  // Security
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  const onSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Profile settings saved!");
  };

  const onSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Account settings saved!");
  };

  const onSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Notification settings saved!");
  };

  const onSavePrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Privacy settings saved!");
  };

  // Animation variants for sections
  const sectionVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
  };

  // Animation variants for inputs
  const inputVariants = {
    focus: { scale: 1.01, boxShadow: "0 0 0 2px color-mix(in oklab, var(--ring) 20%, transparent)", transition: { duration: 0.3 } },
    blur: { scale: 1, boxShadow: "none", transition: { duration: 0.3 } },
  };

  // Animation variants for buttons
  const buttonVariants = {
    hover: { scale: 1.03, transition: { duration: 0.3 } },
    tap: { scale: 0.98, transition: { duration: 0.2 } },
  };

  // Animation variants for checkboxes/radio labels
  const labelVariants = {
    hover: { x: 3, transition: { duration: 0.3 } },
    rest: { x: 0, transition: { duration: 0.3 } },
  };

  return (
    <>
      {error && <div>{error}</div>}
        {/* Main */}
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          {/* Profile Info */}
          <motion.section variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Profile Information</h2>
            <form onSubmit={onSaveProfile} className="space-y-4">
              <label className="block">
                Full Name
                <motion.input type="text" value={name} onChange={(e) => setName(e.target.value)} required variants={inputVariants} whileFocus="focus" className="w-full px-4 py-2 border rounded" />
              </label>

              <label className="block">
                Email Address
                <motion.input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required variants={inputVariants} whileFocus="focus" className="w-full px-4 py-2 border rounded" />
              </label>
              <label className="block">
                Phone Number
                <motion.input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} variants={inputVariants} whileFocus="focus" className="w-full px-4 py-2 border rounded" />
              </label>
              <motion.button type="submit" variants={buttonVariants} whileHover="hover" whileTap="tap" className="bg-primary text-primary-foreground px-6 py-3 rounded">Save Profile</motion.button>
            </form>
          </motion.section>

          {/* Account Settings */}
          <motion.section variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Account Settings</h2>
            <form onSubmit={onSaveAccount} className="space-y-4">
              <label className="block">
                Change Password
                <motion.input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" variants={inputVariants} whileFocus="focus" className="w-full px-4 py-2 border rounded" />
              </label>

              <motion.button type="submit" variants={buttonVariants} whileHover="hover" whileTap="tap" className="bg-primary text-primary-foreground px-6 py-3 rounded">Update Password</motion.button>
            </form>
          </motion.section>

          {/* Notifications */}
          <motion.section variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
            <form onSubmit={onSaveNotifications} className="space-y-4">
              <motion.label variants={labelVariants} whileHover="hover" initial="rest" className="flex items-center gap-2">
                <input type="checkbox" checked={notificationsEmail} onChange={(e) => setNotificationsEmail(e.target.checked)} className="rounded border-input text-primary focus:ring-ring w-5 h-5 smooth-transition" />
                Email Notifications
              </motion.label>

              <motion.label variants={labelVariants} whileHover="hover" initial="rest" className="flex items-center gap-2">
                <input type="checkbox" checked={notificationsSMS} onChange={(e) => setNotificationsSMS(e.target.checked)} className="rounded border-input text-primary focus:ring-ring w-5 h-5 smooth-transition" />
                SMS Notifications
              </motion.label>
              <motion.label variants={labelVariants} whileHover="hover" initial="rest" className="flex items-center gap-2">
                <input type="checkbox" checked={notificationsPush} onChange={(e) => setNotificationsPush(e.target.checked)} className="rounded border-input text-primary focus:ring-ring w-5 h-5 smooth-transition" />
                Push Notifications
              </motion.label>

              <motion.button type="submit" variants={buttonVariants} whileHover="hover" whileTap="tap" className="bg-primary text-primary-foreground px-6 py-3 rounded">Save Notifications</motion.button>
            </form>
          </motion.section>

          {/* Privacy */}
          <motion.section variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Privacy</h2>
            <form onSubmit={onSavePrivacy} className="space-y-4">
              <motion.label variants={labelVariants} whileHover="hover" initial="rest" className="flex items-center gap-2">
                <input type="radio" checked={profileVisibility === "public"} onChange={() => setProfileVisibility("public")} name="profileVisibility" className="rounded-full border-input text-primary focus:ring-ring w-5 h-5 smooth-transition" />
                Public Profile
              </motion.label>

              <motion.label variants={labelVariants} whileHover="hover" initial="rest" className="flex items-center gap-2">
                <input type="radio" checked={profileVisibility === "private"} onChange={() => setProfileVisibility("private")} name="profileVisibility" className="rounded-full border-input text-primary focus:ring-ring w-5 h-5 smooth-transition" />
                Private Profile
              </motion.label>

              <motion.button type="submit" variants={buttonVariants} whileHover="hover" whileTap="tap" className="bg-primary text-primary-foreground px-6 py-3 rounded">Save Privacy</motion.button>
            </form>
          </motion.section>

          {/* Security */}
          <motion.section variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Security</h2>
            <motion.label variants={labelVariants} whileHover="hover" initial="rest" className="flex items-center gap-2">
              <input type="checkbox" checked={twoFactorAuth} onChange={(e) => setTwoFactorAuth(e.target.checked)} className="rounded border-input text-primary focus:ring-ring w-5 h-5 smooth-transition" />
              Enable Two-Factor Authentication (2FA)
            </motion.label>
          </motion.section>

          {/* Danger Zone */}
          <motion.section variants={sectionVariants} initial="hidden" animate="visible">
            <h2 className="text-2xl font-semibold mb-4 text-destructive">Danger Zone</h2>
            <motion.button onClick={() => confirm("Are you sure you want to delete your account? This action cannot be undone.") && alert("Account deleted.")} className="bg-destructive text-destructive-foreground px-6 py-3 rounded-[--radius-md] font-semibold hover:bg-[color-mix(in_oklab,_var(--destructive)_90%,_var(--secondary))] smooth-transition" variants={buttonVariants} whileHover="hover" whileTap="tap">
              Delete Account
            </motion.button>
          </motion.section>
        </main>
            </>
  );
}