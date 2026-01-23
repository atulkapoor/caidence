"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ProfileForm } from "@/components/settings/ProfileForm";
import PasswordForm from "@/components/settings/PasswordForm";
import NotificationSettings from "@/components/settings/NotificationSettings";
import BillingSettings from "@/components/settings/BillingSettings";
import SocialAccountsSettings from "@/components/settings/SocialAccountsSettings";
import { User, Share2, Shield, Bell, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const TABS = [
    { name: "Profile Settings", icon: User },
    { name: "Social Accounts", icon: Share2 },
    { name: "Notifications", icon: Bell },
    { name: "Security", icon: Shield },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("Profile");

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50/50 p-8">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Profile Header Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                        <div className="px-8 pb-8">
                            <div className="flex justify-between items-end -mt-12 mb-6">
                                <div className="flex items-end gap-6">
                                    <div className="h-24 w-24 rounded-full bg-white p-1 shadow-lg">
                                        <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400">
                                            AR
                                        </div>
                                    </div>
                                    <div className="mb-1">
                                        <h1 className="text-2xl font-bold text-slate-900">Alex Rivera</h1>
                                        <p className="text-slate-500 font-medium">Head of Design • San Francisco</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
                                    Edit Profile
                                </button>
                            </div>

                            {/* Horizontal Tabs */}
                            <div className="flex gap-8 border-b border-slate-100">
                                {["Profile", "Password", "Notifications", "Billing", "Integrations"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "pb-4 text-sm font-bold transition-all relative",
                                            activeTab === tab
                                                ? "text-indigo-600"
                                                : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        {tab}
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Settings Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {activeTab === "Profile" && <ProfileForm />}
                            {activeTab === "Password" && <PasswordForm />}
                            {activeTab === "Notifications" && <NotificationSettings />}
                            {activeTab === "Billing" && <BillingSettings />}

                            {activeTab === "Integrations" && (
                                <div className="space-y-4">
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                                                H
                                            </div>
                                            <div>
                                                <h4 className="text-slate-900 font-bold">HubSpot CRM</h4>
                                                <p className="text-sm text-slate-500 font-medium">Sync contacts and deals</p>
                                            </div>
                                        </div>
                                        <button className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold rounded-lg pointer-events-none">Connected</button>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[#00A1F1] rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                                                S
                                            </div>
                                            <div>
                                                <h4 className="text-slate-900 font-bold">Salesforce</h4>
                                                <p className="text-sm text-slate-500 font-medium">Enterprise connector</p>
                                            </div>
                                        </div>
                                        <button onClick={() => toast.success("Integration request sent")} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">Connect</button>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[#E3205E] rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                                                Z
                                            </div>
                                            <div>
                                                <h4 className="text-slate-900 font-bold">Zapier</h4>
                                                <p className="text-sm text-slate-500 font-medium">Automate your workflows</p>
                                            </div>
                                        </div>
                                        <button onClick={() => toast.success("Redirecting to Zapier...")} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">Connect</button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "Social Accounts" && <SocialAccountsSettings />}
                        </div>

                        {/* Side Widgets (Profile Strength etc) */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Profile Completion
                                </h3>
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                                        <span>85% Completed</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[85%] rounded-full" />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Complete your profile to unlock all AI features.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

