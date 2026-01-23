"use client";

import { Save } from "lucide-react";

export function ProfileForm() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Personal Information</h3>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Full Name</label>
                        <input
                            type="text"
                            defaultValue="Alex Rivera"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Email Address</label>
                        <input
                            type="email"
                            defaultValue="alex.rivera@cadence.ai"
                            readOnly
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Company</label>
                        <input
                            type="text"
                            defaultValue="C(AI)DENCE"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Location</label>
                        <input
                            type="text"
                            defaultValue="San Francisco, CA"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Bio</label>
                    <textarea
                        rows={4}
                        defaultValue="Product Designer passionate about AI and user experience. Building the future of marketing workflows."
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-none font-medium leading-relaxed"
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={() => toast.success("Profile updated successfully!")}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                    >
                        Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
}

import { toast } from "sonner";
