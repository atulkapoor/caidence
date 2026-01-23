"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { User, Settings, Lock, Share2, DollarSign, Facebook, Linkedin, Youtube, Instagram, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import NotificationSettings from "@/components/settings/NotificationSettings";
import BillingSettings from "@/components/settings/BillingSettings";
import { toast } from "sonner";

const TABS = ["Profile Settings", "Social Accounts", "Billing", "Notifications"];

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState("Profile Settings");

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50/50 p-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
                        <p className="text-slate-500 text-sm font-medium">Manage your profile, integrations, and preferences.</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 hide-scrollbar overflow-x-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-6 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap",
                                    activeTab === tab
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {activeTab === "Profile Settings" && <ProfileSettingsTab />}

                        {activeTab === "Social Accounts" && <SocialAccountsTab />}

                        {activeTab === "Billing" && <BillingSettings />}

                        {activeTab === "Notifications" && <NotificationSettings />}
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}

function ProfileSettingsTab() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "Atul",
        lastName: "Kapoor",
        email: "atul@example.com",
        company: "C(AI)DENCE Inc."
    });

    const handleSave = () => {
        if (!formData.firstName || !formData.lastName || !formData.email) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            toast.success("Profile updated successfully!");
        }, 1000);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex gap-6 items-center">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg">
                    <User className="w-10 h-10 text-slate-400" />
                </div>
                <div>
                    <button onClick={() => toast.success("Photo uploaded successfully!")} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">
                        Upload New Picture
                    </button>
                    <p className="text-xs text-slate-500 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                </div>
            </div>

            <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">First Name</label>
                        <input
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Last Name</label>
                        <input
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email Address</label>
                    <div className="relative">
                        <input
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 flex items-center gap-1 text-xs font-bold bg-green-50 px-2 py-1 rounded-md">
                            <Check className="w-3 h-3" /> Verified
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Company Name</label>
                    <input
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SocialAccountsTab() {
    const integrations = [
        { name: "Meta (Facebook & Instagram)", icon: Facebook, color: "bg-[#1877F2]", connected: true, account: "C(AI)DENCE Official" },
        { name: "Google Ads", icon: Check, color: "bg-[#4285F4]", connected: false, account: "" },
        { name: "LinkedIn", icon: Linkedin, color: "bg-[#0077b5]", connected: true, account: "Atul Kapoor" },
        { name: "YouTube", icon: Youtube, color: "bg-[#FF0000]", connected: false, account: "" },
        { name: "HubSpot", icon: Share2, color: "bg-[#FF7A59]", connected: false, account: "" },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Share2 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-blue-900">Connect Your Platforms</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        Connecting your social media and ad accounts allows C(AI)DENCE to auto-publish content and retrieve real-time analytics.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {integrations.map((app, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${app.color}`}>
                                <app.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{app.name}</h4>
                                {app.connected ? (
                                    <p className="text-xs font-bold text-green-600 flex items-center gap-1 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        Connected as {app.account}
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-400">Not connected</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => toast.success(app.connected ? `Disconnected from ${app.name}` : `Connected to ${app.name}`)}
                            className={cn(
                                "px-4 py-2 text-sm font-bold rounded-lg transition-all border",
                                app.connected
                                    ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600 hover:border-red-200"
                                    : "bg-slate-900 border-transparent text-white hover:bg-slate-800 shadow-md hover:shadow-lg"
                            )}
                        >
                            {app.connected ? "Disconnect" : "Connect"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
