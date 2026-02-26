"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, ExternalLink, RotateCcw } from "lucide-react";
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
    showReconnect?: boolean;
    buttonSize?: "compact" | "default";
    redirectTo?: string;
}

export function SocialConnectCard({
    platform,
    connection,
    onStatusChange,
    showReconnect = true,
    buttonSize = "default",
    redirectTo,
}: SocialConnectCardProps) {
    const [loadingAction, setLoadingAction] = useState<"connect" | "reconnect" | "disconnect" | null>(null);
    const meta = PLATFORM_META[platform] || { label: platform, color: "text-slate-600", bgColor: "bg-slate-50" };
    const isConnected = connection?.is_active ?? false;
    const compact = buttonSize === "compact";
    const isLoading = loadingAction !== null;
    const isConnectLoading = loadingAction === "connect";
    const isReconnectLoading = loadingAction === "reconnect";
    const isDisconnectLoading = loadingAction === "disconnect";

    const handleConnect = async () => {
        setLoadingAction("connect");
        try {
            const { authorization_url } = await getConnectionUrl(platform, redirectTo);
            window.location.href = authorization_url;
        } catch {
            toast.error(`Failed to connect ${meta.label}`);
            setLoadingAction(null);
        }
    };

    const handleDisconnect = async () => {
        setLoadingAction("disconnect");
        try {
            await disconnectPlatform(platform);
            toast.success(`Disconnected from ${meta.label}`);
            onStatusChange();
        } catch {
            toast.error(`Failed to disconnect ${meta.label}`);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleReconnect = async () => {
        setLoadingAction("reconnect");
        try {
            const { authorization_url } = await getConnectionUrl(platform, redirectTo);
            window.location.href = authorization_url;
        } catch {
            toast.error(`Failed to reconnect ${meta.label}`);
            setLoadingAction(null);
        }
    };

    if (!compact) {
        return (
            <div className={cn(
                "rounded-2xl border p-5 flex items-center justify-between transition-all",
                isConnected
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            )}>
                <div className="flex items-center gap-4 min-w-0 flex-1 pr-3">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg", meta.bgColor, meta.color)}>
                        {meta.label.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-900">{meta.label}</h3>
                        <p className="text-sm text-slate-500 font-medium truncate">
                            {isConnected ? connection?.platform_username || "Connected" : "Not connected"}
                        </p>
                    </div>
                </div>
                {!isConnected ? (
                    <button
                        onClick={handleConnect}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
                    >
                        {isConnectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink size={14} />}
                        Connect
                    </button>
                ) : (
                    <div className="flex items-center gap-2 shrink-0">
                        {showReconnect && (
                            <button
                                onClick={handleReconnect}
                                disabled={isLoading}
                                className="px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                            >
                                {isReconnectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw size={14} />}
                                Reconnect
                            </button>
                        )}
                        <button
                            onClick={handleDisconnect}
                            disabled={isLoading}
                            className="px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 whitespace-nowrap"
                        >
                            {isDisconnectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={14} className="text-emerald-500" />}
                            Disconnect
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={cn(
            "rounded-2xl border p-5 min-h-[150px] flex flex-col justify-between gap-4 transition-all",
            isConnected
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
        )}>
            <div className="flex items-center gap-4 min-w-0 w-full">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg", meta.bgColor, meta.color)}>
                    {meta.label.charAt(0)}
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-slate-900">{meta.label}</h3>
                    <p className="text-sm text-slate-500 font-medium">
                        {isConnected
                            ? connection?.platform_username || "Connected"
                            : "Not connected"}
                    </p>
                </div>
            </div>
            {!isConnected ? (
                <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-800 whitespace-nowrap"
                >
                    {isConnectLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink size={12} />}
                    Connect
                </button>
            ) : (
                <div className="w-full flex items-center gap-2">
                    {showReconnect && (
                        <button
                            onClick={handleReconnect}
                            disabled={isLoading}
                            className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                        >
                            {isReconnectLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw size={12} />}
                            Reconnect
                        </button>
                    )}
                    <button
                        onClick={handleDisconnect}
                        disabled={isLoading}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 whitespace-nowrap"
                    >
                        {isDisconnectLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check size={12} className="text-emerald-500" />}
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
}
