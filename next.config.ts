import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer", "puppeteer-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/cv/pdf/**": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default nextConfig;
