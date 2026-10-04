import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  ],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
