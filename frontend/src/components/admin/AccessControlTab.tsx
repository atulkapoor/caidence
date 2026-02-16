"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAdminUsers, fetchOrganizationUsers, AdminUser } from "@/lib/api";
import { getUserPermissions, listUserOverrides, createOverride, updateOverride, deleteOverride, type PermissionOverride, type EffectivePermissions } from "@/lib/api/rbac";
import { toast } from "sonner";
import { Search, ChevronRight, Shield, ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSuperAdmin as checkSuperAdmin } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";

// All controllable modules
const MODULES = [
    { key: "agency", label: "Agency Hub" },
    { key: "creators", label: "Creator Roster" },
    { key: "ai_agent", label: "AI Agent" },
    { key: "ai_chat", label: "AI Chat" },
    { key: "workflow", label: "Workflow Builder" },
    { key: "content_studio", label: "Content Studio" },
    { key: "design_studio", label: "Design Studio" },
    { key: "presentation_studio", label: "Presentation Studio" },
    { key: "marcom", label: "Marcom Hub" },
    { key: "crm", label: "CRM" },
    { key: "campaign", label: "Campaign Planner" },
    { key: "discovery", label: "Discovery Engine" },
    { key: "analytics", label: "Analytics" },
    { key: "content", label: "Content" },
    { key: "admin", label: "Admin Panel" },
];

type PermState = "inherited" | "granted" | "denied";

interface UserPermData {
    effective: EffectivePermissions | null;
    overrides: PermissionOverride[];
}

export function AccessControlTab() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedUser, setExpandedUser] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [userPermData, setUserPermData] = useState<Record<number, UserPermData>>({});
    const [loadingPerms, setLoadingPerms] = useState<number | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminUsers();
            setUsers(data);
        } catch {
            try {
                const userJson = localStorage.getItem("user");
                if (userJson) {
                    const currentUser = JSON.parse(userJson);
                    if (currentUser.organization_id) {
                        const orgUsers = await fetchOrganizationUsers(currentUser.organization_id);
                        setUsers(orgUsers as AdminUser[]);
                        return;
                    }
                }
            } catch (fbError) {
                console.error("Fallback fetch failed", fbError);
            }
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsers(); }, []);

    const loadUserPerms = useCallback(async (userId: number) => {
        setLoadingPerms(userId);
        try {
            const [effective, overrides] = await Promise.all([
                getUserPermissions(userId),
                listUserOverrides(userId),
            ]);
            setUserPermData(prev => ({ ...prev, [userId]: { effective, overrides } }));
        } catch {
            toast.error("Failed to load user permissions");
        } finally {
            setLoadingPerms(null);
        }
    }, []);

    const toggleExpand = (id: number) => {
        if (expandedUser === id) {
            setExpandedUser(null);
        } else {
            setExpandedUser(id);
            if (!userPermData[id]) {
                loadUserPerms(id);
            }
        }
    };

    const getPermState = (user: AdminUser, moduleKey: string): { state: PermState; override?: PermissionOverride } => {
        const data = userPermData[user.id];
        if (!data) return { state: "inherited" };

        // Check for explicit override
        const override = data.overrides.find(o => o.resource === moduleKey);
        if (override) {
            if (!override.is_allowed || override.action === "none") return { state: "denied", override };
            if (override.action === "write" || override.action === "read") return { state: "granted", override };
        }

        return { state: "inherited" };
    };

    const hasRolePermission = (user: AdminUser, moduleKey: string): boolean => {
        const data = userPermData[user.id];
        if (!data?.effective) return false;
        if (data.effective.is_super_admin) return true;
        return data.effective.permissions.some(p => p.startsWith(`${moduleKey}:`));
    };

    const cyclePermission = async (user: AdminUser, moduleKey: string, currentState: PermState, override?: PermissionOverride) => {
        try {
            if (currentState === "inherited") {
                // → Grant explicit write
                await createOverride({
                    user_id: user.id,
                    resource: moduleKey,
                    action: "write",
                    is_allowed: true,
                });
                toast.success(`Granted ${moduleKey} access`);
            } else if (currentState === "granted") {
                // → Deny explicitly
                if (override) {
                    await updateOverride(override.id, { action: "none", is_allowed: false });
                } else {
                    await createOverride({
                        user_id: user.id,
                        resource: moduleKey,
                        action: "none",
                        is_allowed: false,
                    });
                }
                toast.success(`Denied ${moduleKey} access`);
            } else {
                // Denied → Remove override (back to inherited)
                if (override) {
                    await deleteOverride(override.id);
                }
                toast.success(`Reset ${moduleKey} to role default`);
            }
            // Reload permissions
            await loadUserPerms(user.id);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update";
            toast.error(message);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const countEnabled = (user: AdminUser): number => {
        if (checkSuperAdmin(user.role as UserRole)) return MODULES.length;
        const data = userPermData[user.id];
        if (!data?.effective) return 0;
        const moduleKeys = new Set(MODULES.map(m => m.key));
        const activeModules = new Set<string>();
        for (const perm of data.effective.permissions) {
            const [resource] = perm.split(":");
            if (moduleKeys.has(resource)) activeModules.add(resource);
        }
        return activeModules.size;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-slate-900">User Access Control</h3>
                    <p className="text-sm text-slate-500">Manage granular permissions per user. Click toggles to cycle: Inherited → Granted → Denied → Inherited.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 w-64"
                    />
                </div>
            </div>

            {/* Legend */}
            <div className="px-6 py-3 border-b border-slate-100 flex gap-6 text-xs">
                <span className="flex items-center gap-1.5">
                    <Shield size={14} className="text-slate-400" /> Inherited from role
                </span>
                <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" /> Explicitly granted
                </span>
                <span className="flex items-center gap-1.5">
                    <ShieldX size={14} className="text-red-500" /> Explicitly denied
                </span>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-500">Loading permission matrix...</div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {filteredUsers.map(user => {
                        const isExpanded = expandedUser === user.id;
                        const isAdmin = checkSuperAdmin(user.role as UserRole);

                        return (
                            <div key={user.id} className="bg-white transition-colors">
                                <div
                                    onClick={() => toggleExpand(user.id)}
                                    className={`px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${isExpanded ? "bg-slate-50" : ""}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-1 rounded text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                                            <ChevronRight size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{user.full_name || "Unnamed User"}</div>
                                            <div className="text-xs text-slate-500">
                                                {user.email} •{" "}
                                                <span className="capitalize font-medium text-slate-700">{user.role.replace(/_/g, " ")}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        {isAdmin ? MODULES.length : countEnabled(user)} / {MODULES.length} Modules
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-slate-100">
                                        {loadingPerms === user.id ? (
                                            <div className="py-4 text-center text-sm text-slate-400">Loading permissions...</div>
                                        ) : isAdmin ? (
                                            <div className="py-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                                                <ShieldAlert size={16} className="text-amber-500" />
                                                Super Admin has unrestricted access to all modules.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {MODULES.map(mod => {
                                                    const { state, override } = getPermState(user, mod.key);
                                                    const roleHas = hasRolePermission(user, mod.key);
                                                    const effectiveAccess = state === "granted" || (state === "inherited" && roleHas);

                                                    return (
                                                        <div
                                                            key={mod.key}
                                                            className={cn(
                                                                "flex items-center justify-between p-3 border rounded-lg transition-colors",
                                                                state === "denied"
                                                                    ? "bg-red-50 border-red-200"
                                                                    : state === "granted"
                                                                    ? "bg-emerald-50 border-emerald-200"
                                                                    : effectiveAccess
                                                                    ? "bg-white border-slate-200"
                                                                    : "bg-slate-50 border-slate-200"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {state === "denied" ? (
                                                                    <ShieldX size={16} className="text-red-500" />
                                                                ) : state === "granted" ? (
                                                                    <ShieldCheck size={16} className="text-emerald-600" />
                                                                ) : (
                                                                    <Shield size={16} className={effectiveAccess ? "text-slate-400" : "text-slate-300"} />
                                                                )}
                                                                <span className={cn(
                                                                    "text-sm font-medium",
                                                                    state === "denied" ? "text-red-700" : "text-slate-700"
                                                                )}>
                                                                    {mod.label}
                                                                </span>
                                                            </div>

                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    cyclePermission(user, mod.key, state, override);
                                                                }}
                                                                className={cn(
                                                                    "px-2 py-1 text-xs font-semibold rounded-md border transition-colors",
                                                                    state === "denied"
                                                                        ? "border-red-300 text-red-700 hover:bg-red-100"
                                                                        : state === "granted"
                                                                        ? "border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                                                                        : "border-slate-300 text-slate-600 hover:bg-slate-100"
                                                                )}
                                                                title={
                                                                    state === "inherited"
                                                                        ? "Click to grant explicit access"
                                                                        : state === "granted"
                                                                        ? "Click to deny access"
                                                                        : "Click to reset to role default"
                                                                }
                                                            >
                                                                {state === "inherited" && (roleHas ? "Role" : "No access")}
                                                                {state === "granted" && "Granted"}
                                                                {state === "denied" && "Denied"}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
