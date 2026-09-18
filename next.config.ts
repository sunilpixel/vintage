import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // the dev tools button would sit on the chapter counter (bottom-left)
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
