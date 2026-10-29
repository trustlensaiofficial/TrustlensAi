/** @type {import('next').NextConfig} */
const nextConfig = {
  // The dev-only overlay badge sat on top of the prototype's own floating
  // dock. It never ships in a production build, but turning it off keeps
  // local runs and screenshots identical to what is deployed.
  devIndicators: false,
};

export default nextConfig;
