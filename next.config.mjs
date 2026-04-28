/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Used for cache-busting immutable static assets in the client bundle.
    // Prefer Vercel's build-time commit SHA when available.
    NEXT_PUBLIC_ASSET_VERSION:
      process.env.NEXT_PUBLIC_ASSET_VERSION ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.VERCEL_DEPLOYMENT_ID ??
      "dev",
  },
  async headers() {
    const staticCache = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return [
      { source: "/models/:path*", headers: staticCache },
      { source: "/chess-textures/:path*", headers: staticCache },
      { source: "/hdri/:path*", headers: staticCache },
    ];
  },
};

export default nextConfig;
