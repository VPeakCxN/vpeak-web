// components/footer.tsx
import Link from 'next/link';
import Image from 'next/image';
import logo from '@/components/images/logo.png'; // or use src="/logo.png" from /public

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

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 font-semibold mb-2">
            <Image src={logo} alt="VPeak logo" className="h-6 w-auto" />
            <span>VPeak</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Unified campus platform built with Next.js and Supabase.
          </p>
        </div>

        <div>
          <h4 className="font-medium mb-3">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/features" className="hover:underline">Features</Link></li>
            <li><Link href="https://github.com/vpeak/vpeak-web" className="hover:underline">Docs</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-3">Account</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/login" className="hover:underline">Log in</Link></li>
            <li><Link href="/auth/signup" className="hover:underline">Sign up</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          © 2025 VPeak. All rights reserved.
        </div>
      </div>
    </footer>
  );
}