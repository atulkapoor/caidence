"use client";

import { useState, useEffect, useCallback } from "react";
import { listRoles, updateRolePermissions, type RoleData } from "@/lib/api/rbac";
import { toast } from "sonner";
import { ChevronRight, Shield, ShieldCheck, Crown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const RESOURCES = [
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

const ACTIONS = ["read", "write", "delete"];

export function RoleManagementTab() {
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRole, setExpandedRole] = useState<number | null>(null);
    const [saving, setSaving] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    // Track local edits: roleId -> permissions_json
    const [edits, setEdits] = useState<Record<number, Record<string, string[]>>>({});

    const loadRoles = useCallback(async () => {
        setLoading(true);
        try {
            const data = await listRoles();
            setRoles(data.sort((a, b) => b.hierarchy_level - a.hierarchy_level));
        } catch {
            toast.error("Failed to load roles");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadRoles(); }, [loadRoles]);

    const toggleExpand = (id: number) => {
        if (expandedRole === id) {
            setExpandedRole(null);
        } else {
            setExpandedRole(id);
            // Initialize edits from current role permissions
            const role = roles.find(r => r.id === id);
            if (role && !edits[id]) {
                setEdits(prev => ({ ...prev, [id]: { ...role.permissions_json } }));
            }
        }
    };

    const toggleAction = (roleId: number, resource: string, action: string) => {
        setEdits(prev => {
            const current = prev[roleId] || {};
            const actions = current[resource] || [];
            const updated = actions.includes(action)
                ? actions.filter(a => a !== action)
                : [...actions, action];
            return {
                ...prev,
                [roleId]: {
                    ...current,
                    [resource]: updated,
                },
            };
        });
    };

    const hasAction = (roleId: number, resource: string, action: string): boolean => {
        const perms = edits[roleId];
        if (!perms) return false;
        const actions = perms[resource] || [];
        return actions.includes(action) || actions.includes("*");
    };

    const isWildcard = (roleId: number): boolean => {
        const perms = edits[roleId];
        if (!perms) return false;
        return !!perms["*"]?.includes("*");
    };

    const isDirty = (roleId: number): boolean => {
        const role = roles.find(r => r.id === roleId);
        if (!role || !edits[roleId]) return false;
        return JSON.stringify(role.permissions_json) !== JSON.stringify(edits[roleId]);
    };

    const savePermissions = async (roleId: number) => {
        const perms = edits[roleId];
        if (!perms) return;
        setSaving(roleId);
        try {
            // Clean out empty arrays
            const cleaned: Record<string, string[]> = {};
            for (const [key, val] of Object.entries(perms)) {
                if (val.length > 0) cleaned[key] = val;
            }
            await updateRolePermissions(roleId, cleaned);
            toast.success("Role permissions updated");
            await loadRoles();
            // Refresh edits
            setEdits(prev => ({ ...prev, [roleId]: cleaned }));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to save";
            toast.error(message);
        } finally {
            setSaving(null);
        }
    };

    const resetEdits = (roleId: number) => {
        const role = roles.find(r => r.id === roleId);
        if (role) {
            setEdits(prev => ({ ...prev, [roleId]: { ...role.permissions_json } }));
        }
    };

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.display_name && r.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const countPermissions = (role: RoleData): string => {
        const perms = role.permissions_json;
        if (perms["*"]?.includes("*")) return "Full Access";
        let count = 0;
        for (const actions of Object.values(perms)) {
            count += actions.length;
        }
        return `${count} permissions`;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-slate-900">Role Management</h3>
                    <p className="text-sm text-slate-500">View and edit permissions for each role. Changes are saved per role.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 w-64"
                    />
                </div>
            </div>

            {/* Header row */}
            <div className="px-6 py-3 border-b border-slate-100 flex gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                    <Crown size={14} className="text-amber-500" /> Higher hierarchy = more authority
                </span>
                <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" /> Click cells to toggle permissions
                </span>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-500">Loading roles...</div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {filteredRoles.map(role => {
                        const isExpanded = expandedRole === role.id;
                        const wildcard = isWildcard(role.id);
                        const dirty = isDirty(role.id);

                        return (
                            <div key={role.id} className="bg-white transition-colors">
                                <div
                                    onClick={() => toggleExpand(role.id)}
                                    className={cn(
                                        "px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50",
                                        isExpanded && "bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-1 rounded text-slate-400 transition-transform", isExpanded && "rotate-90")}>
                                            <ChevronRight size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{role.display_name || role.name}</span>
                                                {wildcard && (
                                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                                                        FULL ACCESS
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                <span className="font-mono">{role.name}</span>
                                                {" "}&bull;{" "}Level {role.hierarchy_level}
                                                {role.description && <> &bull; {role.description}</>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        {countPermissions(role)}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-slate-100">
                                        {wildcard ? (
                                            <div className="py-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                                                <Shield size={16} className="text-amber-500" />
                                                This role has wildcard (*:*) access. All modules are accessible.
                                            </div>
                                        ) : (
                                            <>
                                                {/* Permission matrix */}
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-slate-200">
                                                                <th className="text-left py-2 pr-4 font-bold text-slate-700 text-xs uppercase">Module</th>
                                                                {ACTIONS.map(action => (
                                                                    <th key={action} className="px-4 py-2 font-bold text-slate-700 text-xs uppercase text-center w-24">
                                                                        {action}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {RESOURCES.map(res => (
                                                                <tr key={res.key} className="hover:bg-white/50">
                                                                    <td className="py-2.5 pr-4 font-medium text-slate-700">{res.label}</td>
                                                                    {ACTIONS.map(action => {
                                                                        const active = hasAction(role.id, res.key, action);
                                                                        return (
                                                                            <td key={action} className="px-4 py-2.5 text-center">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        toggleAction(role.id, res.key, action);
                                                                                    }}
                                                                                    className={cn(
                                                                                        "w-8 h-8 rounded-lg border transition-all text-xs font-bold",
                                                                                        active
                                                                                            ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                                                                                            : "bg-white border-slate-200 text-slate-300 hover:border-slate-300"
                                                                                    )}
                                                                                >
                                                                                    {active ? <ShieldCheck size={14} className="mx-auto" /> : ""}
                                                                                </button>
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Save / Reset buttons */}
                                                {dirty && (
                                                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); resetEdits(role.id); }}
                                                            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        >
                                                            Reset
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); savePermissions(role.id); }}
                                                            disabled={saving === role.id}
                                                            className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                                                        >
                                                            {saving === role.id ? "Saving..." : "Save Changes"}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
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
