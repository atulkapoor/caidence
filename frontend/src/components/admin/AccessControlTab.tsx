"use client";

import { useState, useEffect } from "react";
import { fetchAdminUsers, fetchOrganizationUsers, AdminUser } from "@/lib/api";
import { toast } from "sonner";
import { Search, ChevronDown, ChevronRight, Check, X, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// Modules from Sidebar
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
    { key: "campaigns", label: "Campaign Planner" },
    { key: "discovery", label: "Discovery Engine" },
    { key: "analytics", label: "Analytics" },
    { key: "admin", label: "Admin Panel" }, // Dangerous
];

interface UserPermission {
    resource: string;
    action: string;
}

interface ExtendedAdminUser extends AdminUser {
    custom_permissions?: UserPermission[];
}

export function AccessControlTab() {
    const [users, setUsers] = useState<ExtendedAdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedUser, setExpandedUser] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminUsers();
            setUsers(data);
        } catch (error) {
            // Fallback: If 403/Fail, try fetching org users (Agency Admin view)
            try {
                const userJson = localStorage.getItem("user");
                if (userJson) {
                    const currentUser = JSON.parse(userJson);
                    if (currentUser.organization_id) {
                        const orgUsers = await fetchOrganizationUsers(currentUser.organization_id);
                        setUsers(orgUsers as ExtendedAdminUser[]);
                        return;
                    }
                }
            } catch (fbError) {
                console.error("Fallback fetch failed", fbError);
            }

            console.error(error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const togglePermission = async (userId: number, resourceKey: string, currentAction: string) => {
        const newAction = currentAction === "write" ? "none" : "write";

        // Optimistic UI update
        setUsers(prev => prev.map(u => {
            if (u.id !== userId) return u;
            const perms = u.custom_permissions || [];
            const existingIdx = perms.findIndex(p => p.resource === resourceKey);
            let newPerms;

            if (existingIdx >= 0) {
                newPerms = [...perms];
                newPerms[existingIdx] = { ...newPerms[existingIdx], action: newAction };
            } else {
                newPerms = [...perms, { resource: resourceKey, action: newAction }];
            }
            return { ...u, custom_permissions: newPerms };
        }));

        try {
            // Call API
            const token = localStorage.getItem("token");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/admin/users/${userId}/permissions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    module: resourceKey,
                    access_level: newAction
                })
            });

            if (!response.ok) throw new Error("Failed to update");
            toast.success(`Permission updated for ${resourceKey}`);
        } catch (error) {
            toast.error("Failed to save permission");
            loadUsers(); // Revert
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedUser(expandedUser === id ? null : id);
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-slate-900">User Access Control</h3>
                    <p className="text-sm text-slate-500">Manage granular permissions per user.</p>
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

            {loading ? (
                <div className="p-12 text-center text-slate-500">Loading permission matrix...</div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {filteredUsers.map(user => {
                        const isExpanded = expandedUser === user.id;
                        return (
                            <div key={user.id} className="bg-white transition-colors">
                                <div
                                    onClick={() => toggleExpand(user.id)}
                                    className={`px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${isExpanded ? 'bg-slate-50' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-1 rounded text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                            <ChevronRight size={18} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{user.full_name || "Unnamed User"}</div>
                                            <div className="text-xs text-slate-500">{user.email} • <span className="capitalize font-medium text-slate-700">{user.role}</span></div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        {user.role === 'super_admin' ? MODULES.length : (user.custom_permissions?.filter(p => p.action === 'write').length || 0)} Modules Enabled
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {MODULES.map(mod => {
                                            // Check permission. Default: if module is 'admin' and user not super_admin, restricted.
                                            // Ideally default permission logic is complex (Role based). 
                                            // For this prototype, we assume "write" if found in perms or if no perms exist (open by default? No, usually closed).
                                            // Actually, let's assume default is "write" for testing unless strictly "none".

                                            // Update: Let's assume Role dictates default, but we only show OVERRIDES here.
                                            // For Simplicity: We just showing the toggle state.
                                            // If no permission record exists, we assume user HAS access (default RBAC) unless toggled off?
                                            // Or assume NO access unless toggled on?
                                            // Let's assume: If no record, it inherits Role. 
                                            // BUT display needs to know the Role access.
                                            // Simplification: We blindly toggle record.

                                            const perm = user.custom_permissions?.find(p => p.resource === mod.key);
                                            const isSuperAdmin = user.role === 'super_admin';
                                            const isEnabled = perm ? perm.action === 'write' : isSuperAdmin;

                                            return (
                                                <div key={mod.key} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                                                    <span className="text-sm font-medium text-slate-700">{mod.label}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            togglePermission(user.id, mod.key, isEnabled ? 'write' : 'none');
                                                        }}
                                                        className={cn(
                                                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white/75",
                                                            isEnabled ? "bg-indigo-600" : "bg-slate-200"
                                                        )}
                                                    >
                                                        <span
                                                            aria-hidden="true"
                                                            className={cn(
                                                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                                                isEnabled ? "translate-x-5" : "translate-x-0"
                                                            )}
                                                        />
                                                    </button>
                                                </div>
                                            );
                                        })}
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
