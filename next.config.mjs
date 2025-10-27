// next.config.mjs
/** @type {import('next').NextConfig} */

// استنتاج الدومين من متغير البيئة لو موجود
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "sygnesgnnaoadhrzacmp.supabase.co";

const nextConfig = {
  reactStrictMode: true,

  images: {
    // السماح لصور Supabase العامة بالعرض عبر next/image
    remotePatterns: [
      {
        protocol: "https",
        hostname: SUPABASE_HOST,
        pathname: "/storage/v1/object/**",
      },
      // يمكن إضافة دومينات أخرى هنا عند الحاجة
    ],
  },

  // لو عايز تتجاهل أخطاء ESLint وقت الـ build
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
