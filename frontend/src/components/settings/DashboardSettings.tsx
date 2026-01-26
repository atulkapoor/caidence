"use client";

import { usePreferences } from "@/context/PreferencesContext";
import { LayoutDashboard } from "lucide-react";

export function DashboardSettings() {
    const { visibleCapabilities, toggleCapability } = usePreferences();

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Dashboard Customization</h2>
                        <p className="text-slate-500 font-medium">Control which AI capability widgets appear on your dashboard.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {Object.keys(visibleCapabilities).map((key) => (
                        <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                            <div>
                                <h3 className="font-bold text-slate-900">{key}</h3>
                                <p className="text-xs text-slate-500 font-medium">Show the {key} widget</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={visibleCapabilities[key as keyof typeof visibleCapabilities]}
                                    onChange={() => toggleCapability(key as any)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
