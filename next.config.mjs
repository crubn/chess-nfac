/** @type {import('next').NextConfig} */
const nextConfig = {
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
