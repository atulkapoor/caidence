"use client";

import { useEffect, useState } from "react";
import { fetchCurrentUser, type User } from "@/lib/api/auth";
import {
    listConnections,
    listConnectionsForSettings,
    type SocialConnection,
    type AdminSocialConnection,
} from "@/lib/api/social";
import { SocialConnectCard } from "@/components/onboarding/SocialConnectCard";
import { Loader2 } from "lucide-react";

const PLATFORMS = ["instagram", "youtube", "facebook", "linkedin", "whatsapp", "snapchat"] as const;

export default function SocialAccountsSettings() {
    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [allConnections, setAllConnections] = useState<AdminSocialConnection[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(true);

    const isAdmin = ["super_admin", "agency_admin", "root"].includes(currentUser?.role || "");

    const refresh = () => {
        setLoading(true);
        setTableLoading(true);
        listConnections()
            .then(setConnections)
            .catch(() => setConnections([]))
            .finally(() => setLoading(false));

        listConnectionsForSettings()
            .then(setAllConnections)
            .catch(() => setAllConnections([]))
            .finally(() => setTableLoading(false));
    };

    useEffect(() => {
        fetchCurrentUser()
            .then(setCurrentUser)
            .catch(() => setCurrentUser(null));
        refresh();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <h3 className="font-bold text-slate-900">Connected Accounts</h3>
                <p className="text-sm text-slate-500 font-medium">Manage your social media connections for publishing and analytics.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLATFORMS.map((platform) => (
                    <SocialConnectCard
                        key={platform}
                        platform={platform}
                        connection={connections.find((c) => c.platform === platform && c.is_active) ?? null}
                        onStatusChange={refresh}
                        redirectTo="/settings?tab=social"
                    />
                ))}
            </div>

            <div className="mt-8">
                <h4 className="font-bold text-slate-900">
                    {isAdmin ? "All Social Connections" : "Your Social Connection History"}
                </h4>
                <p className="text-sm text-slate-500 font-medium mb-3">
                    {isAdmin
                        ? "Admin view: all users and platform status."
                        : "Your connected/disconnected accounts history."}
                </p>

                {tableLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    {isAdmin && <th className="text-left p-3 font-bold text-slate-600">User</th>}
                                    <th className="text-left p-3 font-bold text-slate-600">Platform</th>
                                    <th className="text-left p-3 font-bold text-slate-600">Account</th>
                                    <th className="text-left p-3 font-bold text-slate-600">Status</th>
                                    <th className="text-left p-3 font-bold text-slate-600">Connected At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allConnections.length === 0 ? (
                                    <tr>
                                        <td
                                            className="p-4 text-slate-500"
                                            colSpan={isAdmin ? 5 : 4}
                                        >
                                            No social connections found.
                                        </td>
                                    </tr>
                                ) : (
                                    allConnections.map((row) => (
                                        <tr key={row.id} className="border-b last:border-b-0 border-slate-100">
                                            {isAdmin && (
                                                <td className="p-3 text-slate-700">
                                                    {row.user_email || `User #${row.user_id}`}
                                                </td>
                                            )}
                                            <td className="p-3 text-slate-800 capitalize">{row.platform}</td>
                                            <td className="p-3 text-slate-600">
                                                {row.platform_username || row.platform_display_name || "-"}
                                            </td>
                                            <td className="p-3">
                                                <span className={row.is_active ? "text-emerald-600 font-semibold" : "text-slate-500"}>
                                                    {row.is_active ? "Active" : "Disconnected"}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-600">
                                                {row.connected_at ? new Date(row.connected_at).toLocaleString() : "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
