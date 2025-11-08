// next.config.mjs
/** @type {import('next').NextConfig} */

// استنتاج الدومين من متغير البيئة (آمن لو الـ ENV مش موجود)
const SUPABASE_HOST = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
      : null;
    return url?.hostname ?? "sygnesgnnaoadhrzacmp.supabase.co";
  } catch {
    return "sygnesgnnaoadhrzacmp.supabase.co";
  }
})();

const nextConfig = {
  reactStrictMode: true,
  images: {
    // احذف 'domains' نهائيًا لتفادي التحذير
    remotePatterns: [
      {
        protocol: "https",
        hostname: SUPABASE_HOST,
        pathname: "/storage/v1/object/**",
      },
      // لو عندك مصادر أخرى فعلاً، سيبهم أو زوّدهم هنا:
      // { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      // { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
    ],
  },
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;
