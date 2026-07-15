import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones/laptops on the same LAN, and anyone through the Cloudflare
  // tunnel, load the dev server without Next's cross-origin dev-asset guard
  // blocking HMR/RSC requests. These must be bare hostnames (no scheme, no
  // trailing slash) — Next matches this list directly against the request's
  // Origin hostname. Quick tunnels (trycloudflare.com) mint a new random
  // subdomain every restart, so a wildcard is used instead of today's URL.
  allowedDevOrigins: ["192.168.1.12", "*.trycloudflare.com", "192.168.15.254"],
};

export default nextConfig;
