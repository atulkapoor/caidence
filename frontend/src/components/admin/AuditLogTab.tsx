"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuditLog, type AuditLogEntry } from "@/lib/api/rbac";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight, Clock, User, Shield, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_COLORS: Record<string, string> = {
    role_assigned: "bg-blue-100 text-blue-700",
    role_created: "bg-emerald-100 text-emerald-700",
    role_updated: "bg-amber-100 text-amber-700",
    role_deleted: "bg-red-100 text-red-700",
    role_permissions_updated: "bg-purple-100 text-purple-700",
    override_created: "bg-blue-100 text-blue-700",
    override_updated: "bg-amber-100 text-amber-700",
    override_deleted: "bg-red-100 text-red-700",
    bulk_overrides: "bg-indigo-100 text-indigo-700",
};

const ACTION_LABELS: Record<string, string> = {
    role_assigned: "Role Assigned",
    role_created: "Role Created",
    role_updated: "Role Updated",
    role_deleted: "Role Deleted",
    role_permissions_updated: "Permissions Updated",
    override_created: "Override Created",
    override_updated: "Override Updated",
    override_deleted: "Override Deleted",
    bulk_overrides: "Bulk Update",
};

const PAGE_SIZE = 25;

export function AuditLogTab() {
    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("");

    const loadEntries = useCallback(async (pageNum: number, filter?: string) => {
        setLoading(true);
        try {
            const data = await getAuditLog({
                limit: PAGE_SIZE + 1, // fetch one extra to detect "has more"
                offset: pageNum * PAGE_SIZE,
                action_filter: filter || undefined,
            });
            setHasMore(data.length > PAGE_SIZE);
            setEntries(data.slice(0, PAGE_SIZE));
        } catch {
            toast.error("Failed to load audit log");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEntries(page, actionFilter);
    }, [loadEntries, page, actionFilter]);

    const filteredEntries = entries.filter(e => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            e.actor_email.toLowerCase().includes(term) ||
            (e.target_user_email && e.target_user_email.toLowerCase().includes(term)) ||
            e.action.toLowerCase().includes(term)
        );
    });

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDetails = (details: Record<string, unknown>): string => {
        if (!details || Object.keys(details).length === 0) return "";
        // Show a condensed summary
        const parts: string[] = [];
        if (details.role_name) parts.push(`role: ${details.role_name}`);
        if (details.resource) parts.push(`resource: ${details.resource}`);
        if (details.action) parts.push(`action: ${details.action}`);
        if (details.is_allowed !== undefined) parts.push(details.is_allowed ? "allowed" : "denied");
        if (details.old_role) parts.push(`${details.old_role} → ${details.new_role || "?"}`);
        if (parts.length > 0) return parts.join(" · ");
        // Fallback: stringify
        return JSON.stringify(details).slice(0, 120);
    };

    const uniqueActions = Array.from(new Set(entries.map(e => e.action)));

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-bold text-lg text-slate-900">RBAC Audit Log</h3>
                    <p className="text-sm text-slate-500">Track all permission and role changes across the platform.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none bg-white"
                        >
                            <option value="">All Actions</option>
                            {Object.entries(ACTION_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 w-56"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-500">Loading audit log...</div>
            ) : filteredEntries.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                    <Shield size={32} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No audit entries found</p>
                    <p className="text-xs mt-1">Permission changes will appear here.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {filteredEntries.map(entry => (
                        <div key={entry.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="mt-0.5 p-1.5 bg-slate-100 rounded-lg">
                                        <User size={14} className="text-slate-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-slate-900 text-sm">{entry.actor_email}</span>
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                                                ACTION_COLORS[entry.action] || "bg-slate-100 text-slate-600"
                                            )}>
                                                {ACTION_LABELS[entry.action] || entry.action.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        {entry.target_user_email && (
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Target: <span className="font-medium text-slate-700">{entry.target_user_email}</span>
                                            </p>
                                        )}
                                        {entry.details && Object.keys(entry.details).length > 0 && (
                                            <p className="text-xs text-slate-400 mt-1 font-mono truncate max-w-xl">
                                                {formatDetails(entry.details)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap shrink-0">
                                    <Clock size={12} />
                                    {formatDate(entry.created_at)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                    Page {page + 1} &bull; Showing {filteredEntries.length} entries
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!hasMore}
                        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
