import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.agent.cvm.dev",
    "*.cvm.dev",
    "*.lhr.life",
    "*.localhost.run",
    "*.trycloudflare.com",
    "*.loca.lt",
    "*.localtunnel.me",
    "*.serveo.net",
    "*.serveousercontent.com",
    "*.spoo.me",
    "*.da.gd",
    "*.github.io",
  ],
};

export default nextConfig;
