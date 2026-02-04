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
                destination: "http://backend:8000/api/v1/:path*",
            },
        ];
    },
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            https: false,
            http: false,
            path: false,
            stream: false,
            child_process: false,
            "node:https": false,
            "node:fs": false,
            "node:stream": false,
        };
        return config;
    },
};

export default nextConfig;
