import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones/laptops on the same LAN load the dev server (e.g. via
  // http://192.168.1.12:3000) without Next's cross-origin dev-asset guard
  // blocking HMR/RSC requests. Update the IP if your machine's LAN address changes.
  allowedDevOrigins: ["192.168.1.12"],
};

export default nextConfig;
