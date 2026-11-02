/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the development overlay from obscuring the prototype UI.
  devIndicators: false,

  // Resolve the project root explicitly. This avoids Next.js selecting a
  // package-lock.json from the parent directory on the owner's Mac.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
