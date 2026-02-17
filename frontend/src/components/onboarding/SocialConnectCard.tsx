"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { getConnectionUrl, disconnectPlatform, type SocialConnection } from "@/lib/api/social";
import { cn } from "@/lib/utils";

const PLATFORM_META: Record<string, { label: string; color: string; bgColor: string }> = {
    instagram: { label: "Instagram", color: "text-pink-600", bgColor: "bg-pink-50" },
    youtube: { label: "YouTube", color: "text-red-600", bgColor: "bg-red-50" },
    facebook: { label: "Facebook", color: "text-blue-600", bgColor: "bg-blue-50" },
    linkedin: { label: "LinkedIn", color: "text-blue-700", bgColor: "bg-blue-50" },
    whatsapp: { label: "WhatsApp", color: "text-green-600", bgColor: "bg-green-50" },
    snapchat: { label: "Snapchat", color: "text-yellow-600", bgColor: "bg-yellow-50" },
};

interface SocialConnectCardProps {
    platform: string;
    connection: SocialConnection | null;
    onStatusChange: () => void;
}

export function SocialConnectCard({ platform, connection, onStatusChange }: SocialConnectCardProps) {
    const [loading, setLoading] = useState(false);
    const meta = PLATFORM_META[platform] || { label: platform, color: "text-slate-600", bgColor: "bg-slate-50" };
    const isConnected = connection?.is_active ?? false;

    const handleConnect = async () => {
        setLoading(true);
        try {
            const { authorization_url } = await getConnectionUrl(platform);
            window.location.href = authorization_url;
        } catch {
            toast.error(`Failed to connect ${meta.label}`);
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setLoading(true);
        try {
            await disconnectPlatform(platform);
            toast.success(`Disconnected from ${meta.label}`);
            onStatusChange();
        } catch {
            toast.error(`Failed to disconnect ${meta.label}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn(
            "rounded-2xl border p-5 flex items-center justify-between transition-all",
            isConnected
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
        )}>
            <div className="flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg", meta.bgColor, meta.color)}>
                    {meta.label.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">{meta.label}</h3>
                    <p className="text-sm text-slate-500 font-medium">
                        {isConnected
                            ? connection?.platform_username || "Connected"
                            : "Not connected"}
                    </p>
                </div>
            </div>
            <button
                onClick={isConnected ? handleDisconnect : handleConnect}
                disabled={loading}
                className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50",
                    isConnected
                        ? "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                )}
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isConnected ? (
                    <Check size={14} className="text-emerald-500" />
                ) : (
                    <ExternalLink size={14} />
                )}
                {isConnected ? "Connected" : "Connect"}
            </button>
        </div>
    );
}
