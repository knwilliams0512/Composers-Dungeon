/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emits .next/standalone: a self-contained server with only the node_modules
  // it actually traced. The Windows installer ships that plus a Node runtime,
  // so end users never run npm install or a build. `next start` still works.
  output: "standalone",
};

export default nextConfig;
