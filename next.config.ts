import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Génère .next/standalone : un serveur Node minimal avec uniquement les deps
  // utilisées au runtime. Utilisé par l'étape `runner` du Dockerfile.
  output: "standalone",
};

export default nextConfig;
