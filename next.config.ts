import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // cacheComponents/partialPrefetching left off for now: almost every route
  // in this app is per-user/dynamic (auth-gated dashboard/profile), so static
  // prerendering buys little and would require annotating nearly every page.
  // Revisit once there's real static/public content (e.g. Phase 9 editorial pages).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
