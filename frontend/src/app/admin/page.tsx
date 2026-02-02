"use client";

import { useState, useEffect } from "react";
import { useTabState } from "@/hooks/useTabState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users, Building, CreditCard, Shield, UserPlus, Search, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccessControlTab } from "@/components/admin/AccessControlTab";
import { toast } from "sonner";
import { fetchAdminUsers, fetchOrganizationUsers, approveUser, inviteUser, AdminUser } from "@/lib/api";

// --- Types ---
interface PlatformOverview {
    total_organizations: number;
    total_users: number;
    total_brands: number;
    pending_approvals: number;
    mrr: number;
    active_subscriptions: number;
}

interface AdminOrg {
    id: number;
    name: string;
    plan_tier: string;
    user_count: number;
    is_active: boolean;
}

// --- Main Page Component ---
// --- Main Page Component ---
import { Suspense } from "react";

function AdminContent() {
    const [activeTab, setActiveTab] = useTabState("overview");

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50/50 p-8">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Console</h1>
                        <p className="text-slate-500 font-medium">Platform management and system oversight.</p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-slate-200">
                        {["overview", "users", "access", "organizations", "billing"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-6 py-3 text-sm font-bold border-b-2 transition-all capitalize",
                                    activeTab === tab
                                        ? "border-slate-900 text-slate-900"
                                        : "border-transparent text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {tab === "access" ? "Access Control" : tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === "overview" && <AdminOverview />}
                        {activeTab === "users" && <UserManagement />}
                        {activeTab === "access" && <AccessControlTab />}
                        {activeTab === "organizations" && <OrganizationManagement />}
                        {activeTab === "billing" && <BillingOverview />}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading admin panel...</div>}>
            <AdminContent />
        </Suspense>
    );
}

// --- Sub-Components ---

function AdminOverview() {
    const [stats, setStats] = useState<PlatformOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data fetch - replace with API call
        setTimeout(() => {
            setStats({
                total_organizations: 12,
                total_users: 145,
                total_brands: 34,
                pending_approvals: 3,
                mrr: 12500,
                active_subscriptions: 15
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) return <div className="p-12 text-center text-slate-500 font-medium">Loading platform stats...</div>;
    if (!stats) return null;

    const cards = [
        { label: "Total Users", value: stats.total_users, icon: Users, color: "text-blue-500 bg-blue-50" },
        { label: "Organizations", value: stats.total_organizations, icon: Building, color: "text-purple-500 bg-purple-50" },
        { label: "Pending Users", value: stats.pending_approvals, icon: Shield, color: "text-orange-500 bg-orange-50", alert: true },
        { label: "MRR", value: `$${stats.mrr.toLocaleString()}`, icon: CreditCard, color: "text-emerald-500 bg-emerald-50" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${card.color}`}>
                            <card.icon className="h-6 w-6" />
                        </div>
                        {card.alert && (
                            <span className="flex items-center gap-1 text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full animate-pulse">
                                Action Needed
                            </span>
                        )}
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">{card.value}</div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wide">{card.label}</div>
                </div>
            ))}
        </div>
    );
}

function UserManagement() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminUsers();
            setUsers(data);
        } catch (error) {
            // Fallback: Try fetching org users if admin fetch fails (e.g. Agency Admin accessing this)
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
                console.error("Fallback failed", fbError);
            }

            console.error(error);
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleApprove = async (id: number) => {
        try {
            await approveUser(id);
            setUsers(users.map(u => u.id === id ? { ...u, is_approved: true } : u));
            toast.success("User approved successfully");
        } catch (error) {
            toast.error("Failed to approve user");
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900">User Directory</h3>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 w-64"
                        />
                    </div>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <UserPlus size={16} />
                        Add User
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-500">Loading users...</div>
            ) : (
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-bold text-xs uppercase">User</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase">Role</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase">Status</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase">Joined</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-bold text-slate-900">{user.full_name}</div>
                                        <div className="text-slate-500 text-xs">{user.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 capitalize">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {user.is_approved ? (
                                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-orange-600 font-bold text-xs">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Pending Approval
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-medium">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {!user.is_approved && (
                                        <button
                                            onClick={() => handleApprove(user.id)}
                                            className="text-emerald-600 hover:text-emerald-700 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors mr-2"
                                        >
                                            Approve
                                        </button>
                                    )}
                                    <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {showInviteModal && (
                <InviteUserModal onClose={() => setShowInviteModal(false)} onSuccess={loadUsers} />
            )}
        </div>
    );
}

function InviteUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        email: "",
        full_name: "",
        role: "super_admin",
        password: "TempPassword123!", // Default temp password
        organization_id: 0
    });
    const [loading, setLoading] = useState(false);
    const [organizations, setOrganizations] = useState<AdminOrg[]>([]);

    useEffect(() => {
        const loadOrgs = async () => {
            try {
                // @ts-ignore
                const orgs = await fetchOrganizations();
                setOrganizations(orgs);
                if (orgs.length > 0) {
                    setFormData(prev => ({ ...prev, organization_id: orgs[0].id }));
                }
            } catch (e) {
                console.error("Failed to load orgs", e);
            }
        };
        loadOrgs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await inviteUser(formData);
            toast.success("User invited successfully");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to invite user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Add New User</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                        <input
                            required
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                        <input
                            required
                            type="email"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                        <select
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="super_admin">Super Admin</option>
                            <option value="agency_admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Organization</label>
                        <select
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.organization_id}
                            onChange={e => setFormData({ ...formData, organization_id: Number(e.target.value) })}
                        >
                            <option value={0} disabled>Select Organization</option>
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Temporary Password</label>
                        <input
                            required
                            type="text"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50"
                        >
                            {loading ? "Adding..." : "Add User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function OrganizationManagement() {
    const [orgs, setOrgs] = useState<AdminOrg[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOrgs = async () => {
            try {
                // @ts-ignore
                const data = await fetchOrganizations();
                setOrgs(data);
            } catch (error) {
                console.error("Failed to load orgs", error);
            } finally {
                setLoading(false);
            }
        };
        loadOrgs();
    }, []);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-900">Organizations</h3>
            </div>
            {loading ? (
                <div className="p-12 text-center text-slate-500">Loading organizations...</div>
            ) : (
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-bold text-xs uppercase">Name</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase">Plan</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase">Users</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orgs.map((org) => (
                            <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900">{org.name}</td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "inline-flex items-center px-2 py-1 rounded-md text-xs font-bold capitalize",
                                        org.plan_tier === "enterprise" ? "bg-purple-100 text-purple-700" :
                                            org.plan_tier === "pro" ? "bg-blue-100 text-blue-700" :
                                                "bg-slate-100 text-slate-600"
                                    )}>
                                        {org.plan_tier}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-medium">{org.user_count}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-emerald-600 font-bold text-xs">Active</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

function BillingOverview() {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="max-w-md mx-auto">
                <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center mb-6">
                    <CreditCard size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Billing Dashboard</h3>
                <p className="text-slate-500 font-medium mb-8">
                    Revenue metrics and subscription management interface.
                </p>
                <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                    View Stripe Dashboard
                </button>
            </div>
        </div>
    );
}
