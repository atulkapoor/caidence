"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { User, Building, MapPin, Briefcase, Save, Loader2, FileText, Globe } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getProfile, updateProfile, UserProfile } from "@/lib/api/profile";
import SocialAccountsSettings from "@/components/settings/SocialAccountsSettings";
import OnboardingSettings from "@/components/settings/OnboardingSettings";
import { toast } from "sonner";

function SettingsContent() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

    const [formData, setFormData] = useState({
        full_name: "",
        company: "",
        location: "",
        bio: "",
        industry: "",
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await getProfile();
            setProfile(data);
            setFormData({
                full_name: data.full_name || "",
                company: data.company || "",
                location: data.location || "",
                bio: data.bio || "",
                industry: data.industry || "",
            });
        } catch (error) {
            console.error("Failed to load profile", error);
            toast.error("Failed to load profile settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await updateProfile(formData);
            setProfile(updated);
            toast.success("Profile updated successfully");
            router.refresh();
        } catch (error) {
            console.error("Failed to update profile", error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h bg-slate-50/50 p-6 sm:p-8">
            <div className="max-w-8xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage your account preferences and profile details.</p>
                    </div>
                </div>

                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`pb-4 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "profile"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab("preferences")}
                        className={`pb-4 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "preferences"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                        Preferences
                    </button>
                    <button
                        onClick={() => setActiveTab("social")}
                        className={`pb-4 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "social"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                        Social
                    </button>
                    <button
                        onClick={() => setActiveTab("onboarding")}
                        className={`pb-4 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "onboarding"
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                        Onboarding
                    </button>
                </div>

                {activeTab === "profile" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1 space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                                <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-indigo-600">
                                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : profile?.email.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="font-bold text-slate-900">{profile?.full_name || "User"}</h3>
                                <p className="text-sm text-slate-500 mb-4">{profile?.email}</p>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                                    {profile?.role} Plan
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" />
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                            placeholder="Your full name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Building className="w-4 h-4 text-slate-400" />
                                            Company
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                            placeholder="Company Name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                            placeholder="City, Country"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-slate-400" />
                                            Industry
                                        </label>
                                        <select
                                            value={formData.industry}
                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium bg-white"
                                        >
                                            <option value="">Select an industry...</option>
                                            <option value="Technology">Technology</option>
                                            <option value="E-Commerce">E-Commerce</option>
                                            <option value="Real Estate">Real Estate</option>
                                            <option value="Healthcare">Healthcare</option>
                                            <option value="Fashion">Fashion</option>
                                            <option value="Beauty">Beauty</option>
                                            <option value="Food & Beverage">Food & Beverage</option>
                                            <option value="Health & Fitness">Health & Fitness</option>
                                            <option value="Travel">Travel</option>
                                            <option value="Finance">Finance</option>
                                            <option value="Education">Education</option>
                                            <option value="Entertainment">Entertainment</option>
                                            <option value="Retail">Retail</option>
                                            <option value="SaaS">SaaS</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            Bio
                                        </label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium min-h-[100px]"
                                            placeholder="Tell us a bit about yourself..."
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === "preferences" && (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center py-20">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Globe className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Preferences Coming Soon</h3>
                        <p className="text-slate-500">Global application settings will be available here.</p>
                    </div>
                )}

                {activeTab === "social" && <SocialAccountsSettings />}
                {activeTab === "onboarding" && <OnboardingSettings />}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
            </DashboardLayout>
        }>
            <DashboardLayout>
                <SettingsContent />
            </DashboardLayout>
        </Suspense>
    );
}
