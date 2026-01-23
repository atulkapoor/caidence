"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, Mail, Smartphone, Globe } from "lucide-react";

export default function NotificationSettings() {
    const [settings, setSettings] = useState({
        emailDigest: true,
        newFollowers: true,
        campaignUpdates: true,
        securityAlerts: true,
        marketingEmails: false,
        pushNotifications: true,
    });

    const handleToggle = (key: keyof typeof settings) => {
        setSettings((prev) => {
            const newState = { ...prev, [key]: !prev[key] };
            // Show toast on change
            toast.success(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${newState[key] ? 'enabled' : 'disabled'}`);
            return newState;
        });
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <Mail size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Email Notifications</h2>
                        <p className="text-sm text-slate-500">Manage what emails you receive</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <ToggleItem
                        label="Weekly Performance Digest"
                        description="Summary of your campaign performance sent every Monday."
                        checked={settings.emailDigest}
                        onChange={() => handleToggle("emailDigest")}
                    />
                    <ToggleItem
                        label="Campaign Updates"
                        description="Get notified when a campaign status changes."
                        checked={settings.campaignUpdates}
                        onChange={() => handleToggle("campaignUpdates")}
                    />
                    <ToggleItem
                        label="Marketing & Tips"
                        description="Receive tips on how to improve your ROI."
                        checked={settings.marketingEmails}
                        onChange={() => handleToggle("marketingEmails")}
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <Smartphone size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Push Notifications</h2>
                        <p className="text-sm text-slate-500">Manage realtime alerts</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <ToggleItem
                        label="Enable Push Notifications"
                        description="Receive real-time alerts on your device."
                        checked={settings.pushNotifications}
                        onChange={() => handleToggle("pushNotifications")}
                    />
                    <ToggleItem
                        label="Security Alerts"
                        description="Get notified about logins from new devices."
                        checked={settings.securityAlerts}
                        onChange={() => handleToggle("securityAlerts")}
                    />
                    <ToggleItem
                        label="New Followers / Interactions"
                        description="When someone interacts with your agency profile."
                        checked={settings.newFollowers}
                        onChange={() => handleToggle("newFollowers")}
                    />
                </div>
            </div>
        </div>
    );
}

function ToggleItem({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
            <div>
                <h3 className="text-slate-900 font-bold text-sm">{label}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>
            </div>
            <button
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );
}
