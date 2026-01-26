"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState("profile");

    // Allow deep linking via ?tab=billing
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

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

// Simple placeholder for the new "Team Members" section
function MembersPlaceholder() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Team Management</h3>
            <p className="text-slate-500 max-w-md mx-auto">
                Invite team members, assign roles, and manage access permissions for your workspace.
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Invite Member
            </button>
        </div>
    )
}
