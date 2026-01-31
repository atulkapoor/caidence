/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    transpilePackages: ["@react-pdf/renderer"],
    typescript: {
        ignoreBuildErrors: true,
    },
    output: "standalone",
    async rewrites() {
        return [
            {
                source: "/api/proxy/:path*",
                destination: "http://localhost:8000/api/:path*",
            },
        ];
    },
};

export default nextConfig;
