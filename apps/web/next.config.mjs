/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@figma-3d/shared",
    "@figma-3d/3d-core",
    "@figma-3d/history",
    "@figma-3d/protocol",
    "@figma-3d/collab"
  ]
};

export default nextConfig;
