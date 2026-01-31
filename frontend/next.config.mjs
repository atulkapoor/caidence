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
                source: "/api/v1/:path*",
                destination: `${process.env.INTERNAL_API_URL || "http://localhost:8000"}/api/v1/:path*`,
            },
        ];
    },
};

export default nextConfig;
