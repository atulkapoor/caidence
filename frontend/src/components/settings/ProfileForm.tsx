"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { usePreferences } from "@/context/PreferencesContext";
import { getProfile, updateProfile, type UserProfile } from "@/lib/api/profile";

export function ProfileForm() {
    const router = useRouter();
    const { industry, setIndustry } = usePreferences();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Controlled form state
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        company: "",
        location: "",
        bio: "",
    });

    // Load profile on mount
    useEffect(() => {
        async function loadProfile() {
            try {
                const profile = await getProfile();
                setFormData({
                    full_name: profile.full_name || "",
                    email: profile.email || "",
                    company: profile.company || "",
                    location: profile.location || "",
                    bio: profile.bio || "",
                });
                if (profile.industry) {
                    setIndustry(profile.industry);
                }
            } catch (error) {
                console.error("Failed to load profile:", error);
                // Fallback: Try to get user info from localStorage
                try {
                    const userJson = localStorage.getItem("user");
                    if (userJson) {
                        const user = JSON.parse(userJson);
                        setFormData(prev => ({
                            ...prev,
                            full_name: user.full_name || prev.full_name,
                            email: user.email || prev.email,
                        }));
                    }
                } catch (e) {
                    console.error("Failed to load from localStorage:", e);
                }
                toast.error("Failed to load profile from server");
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [setIndustry]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile({
                full_name: formData.full_name,
                company: formData.company,
                location: formData.location,
                bio: formData.bio,
                industry: industry,
            });
            toast.success("Profile updated successfully!");
            // Refresh page to reload data from backend
            router.refresh();
        } catch (error) {
            console.error("Failed to save profile:", error);
            toast.error("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="h-12 bg-slate-200 rounded"></div>
                        <div className="h-12 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Personal Information</h3>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Full Name</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => handleChange("full_name", e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            readOnly
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed font-medium"
                        />
                        <p className="text-xs text-slate-400">Contact support to change email</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Company</label>
                        <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => handleChange("company", e.target.value)}
                            placeholder="Your company name"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Industry Profile</label>
                        <div className="relative">
                            <select
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium appearance-none pr-10"
                            >
                                <option value="Technology">Technology & SaaS</option>
                                <option value="Real Estate">Real Estate & Construction</option>
                                <option value="E-Commerce">E-Commerce & Retail</option>
                                <option value="Healthcare">Healthcare & Wellness</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Location</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => handleChange("location", e.target.value)}
                            placeholder="City, Country (e.g., San Francisco, USA)"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Bio</label>
                    <textarea
                        rows={4}
                        value={formData.bio}
                        onChange={(e) => handleChange("bio", e.target.value)}
                        placeholder="Tell us about yourself, your expertise, and interests..."
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-none font-medium leading-relaxed"
                    />
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Profile
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
