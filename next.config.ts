import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 反向代理（Nginx）转发 Server Actions 请求时，
  // 如果它没有正确设置 X-Forwarded-Host，Next 16 会把这种请求当作 CSRF 拒绝。
  // 在这里显式列出允许的源站域名作为兜底。
  experimental: {
    serverActions: {
      allowedOrigins: [
        "blog.myview.top",
        "www.blog.myview.top",
        "127.0.0.1",
        "127.0.0.1:3000",
        "localhost:3000",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
