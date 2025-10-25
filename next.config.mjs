/** @type {import('next').NextConfig} */

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : 'project-ref.supabase.co'; // fallback example; set env in real app
  
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    disableStaticImages: false,
    remotePatterns: [
      { protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/*' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google avatar CDN
    ],
  },
}

export default nextConfig
