"use client";

import { useState, useEffect, Suspense } from "react";
// import { useSearchParams } from "next/navigation"; // Not needed with useTabState
import { useTabState } from "@/hooks/useTabState";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";

// Components
import { ProfileForm } from "@/components/settings/ProfileForm";
import PasswordForm from "@/components/settings/PasswordForm";
import NotificationSettings from "@/components/settings/NotificationSettings";
import BillingSettings from "@/components/settings/BillingSettings";
import SocialAccountsSettings from "@/components/settings/SocialAccountsSettings";
import { DashboardSettings } from "@/components/settings/DashboardSettings"; // Renamed/reused as General Workspace
import { Users, Plus } from "lucide-react"; // For new Members placeholder

function SettingsContent() {
    // const searchParams = useSearchParams(); // Removed, handled by useTabState
    // Use useTabState for full deep linking (read & write to URL)
    const [activeTab, setActiveTab] = useTabState("profile");

    // Map content to tabs
    const renderContent = () => {
        switch (activeTab) {
            // Personal
            case "profile": return <ProfileForm />;
            case "security": return <PasswordForm />;
            case "notifications": return <NotificationSettings />;

            // Workspace
            case "general": return <DashboardSettings />; // Reusing this for general config
            case "billing": return <BillingSettings />;
            case "integrations": return <SocialAccountsSettings />;
            case "members": return <MembersPlaceholder />; // New placeholder

            default: return <ProfileForm />;
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50/50">
                <div className="max-w-7xl mx-auto p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
                        <p className="text-slate-500 text-sm font-medium">Manage your personal profile and workspace preferences.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Internal Sidebar */}
                        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

                        {/* Content Area */}
                        <div className="flex-1 min-w-0">
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                {renderContent()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading settings...</div>}>
            <SettingsContent />
        </Suspense>
    );
}

// Simple placeholder for the new "Team Members" section
function MembersPlaceholder() {
    const [showInviteModal, setShowInviteModal] = useState(false);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Team Management</h3>
            <p className="text-slate-500 max-w-md mx-auto">
                Invite team members, assign roles, and manage access permissions for your workspace.
            </p>
            <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Invite Member
            </button>

            {showInviteModal && (
                <InviteMemberModal onClose={() => setShowInviteModal(false)} />
            )}
        </div>
    )
}

// Invite modal component for settings
function InviteMemberModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("editor");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !name) return;

        setLoading(true);
        try {
            const { inviteUser } = await import("@/lib/api");
            // Get current user's org
            const userJson = localStorage.getItem("user");
            const currentUser = userJson ? JSON.parse(userJson) : {};

            await inviteUser({
                email,
                full_name: name,
                role,
                password: "TempPassword123!",
                organization_id: currentUser.organization_id || 1
            });

            const { toast } = await import("sonner");
            toast.success("Invitation sent successfully!");
            onClose();
        } catch (error: any) {
            const { toast } = await import("sonner");
            toast.error(error.message || "Failed to send invitation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Invite Team Member</h2>
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                        <input
                            required
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="John Doe"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                        <input
                            required
                            type="email"
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="john@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                        <select
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                        >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                            <option value="agency_admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send Invitation"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
