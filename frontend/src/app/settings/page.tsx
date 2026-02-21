"use client";

"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { User, Mail, Building, MapPin, Briefcase, Save, Loader2, FileText, Globe, Search, UserPlus, MoreVertical } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
    fetchSoical,
    getProfile,
    updateProfile,
    UserProfile,
    createSocial,
    updateSocial,
    deleteSocial,
    SocialMediaModel
} from "@/lib/api/profile";
import { toast } from "sonner";
import Image from "next/image";
import { useModalScroll } from "@/hooks/useModalScroll";

function SettingsContent() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

    // Form states
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
            // Refresh page to reload data from backend
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
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage your account preferences and profile details.</p>
                    </div>
                </div>

                {/* Tabs */}
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
                </div>

                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Sidebar / Avatar Card */}
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

                        {/* Main Form */}
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

                {/* Preferences Tab (Placeholder) */}
                {activeTab === "preferences" && (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center py-20">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Globe className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Preferences Coming Soon</h3>
                        <p className="text-slate-500">Global application settings will be available here.</p>
                    </div>
                )}

                {activeTab === 'social' && <GridTable />}
            </div>
        </div>
    );
}

function GridTable() {
    const [socialData, setSocialData] = useState<SocialMediaModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<SocialMediaModel | null>(null);

    useModalScroll(showModal);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetchSoical();
            setSocialData(res ?? []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load social");
            setSocialData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900">Social</h3>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search social..."
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 w-64"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-md hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <UserPlus size={16} />
                        Add
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-500">Loading...</div>
            ) : (
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-bold text-xs uppercase">Id</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase">Platform</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase">client Id</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase">client Secret</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase">Account Id</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase">Account Name</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase">Account Email</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {socialData.map((soical) => (
                            <tr key={soical.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 capitalize">
                                        {soical.id}
                                    </span>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{soical.platform}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{soical.client_id}</div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{soical.client_secret}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{soical.account_id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{soical.account_name}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{soical.account_email}</div>
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                    {/* Edit Button */}
                                    <button
                                        onClick={() => setEditing(soical)}
                                        className="text-blue-600 hover:text-blue-700 font-semibold text-xs 
             bg-blue-50 hover:bg-blue-100 px-3 py-1.5 
             rounded-lg transition-colors mr-2"
                                    >
                                        Edit
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                        onClick={async () => {
                                            if (!confirm("Are you sure you want to delete this social?")) return;

                                            try {
                                                await deleteSocial(soical.id);
                                                toast.success("Social deleted");
                                                load();
                                            } catch (e) {
                                                toast.error("Failed to delete social");
                                            }
                                        }}
                                        className="text-red-600 hover:text-red-700 font-semibold text-xs 
             bg-red-50 hover:bg-red-100 px-3 py-1.5 
             rounded-lg transition-colors mr-2"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {(showModal || editing) && (
                <SettingModal
                    editing={editing}
                    onClose={() => {
                        setShowModal(false);
                        setEditing(null);
                    }}
                    onSuccess={load}
                />
            )}
        </div>
    );
}

function SettingModal({
    editing,
    onClose,
    onSuccess
}: {
    editing?: SocialMediaModel | null;
    onClose: () => void;
    onSuccess: () => void;
}) {

    const [formData, setFormData] = useState({
        platform: "",
        client_id: "",
        client_secret: "",
        account_id: "",
        account_name: "",
        account_email: ""
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editing) {
            setFormData({
                platform: editing.platform || "",
                client_id: editing.client_id || "",
                client_secret: editing.client_secret || "",
                account_id: editing.account_id || "",
                account_name: editing.account_name || "",
                account_email: editing.account_email || ""
            });
        }
    }, [editing]);


    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editing) {
                await updateSocial(editing.id, formData);
                toast.success("Social Updated");
            } else {
                await createSocial(formData);
                toast.success("Social Added");
            }
            onSuccess();
            onClose();
        } catch {
            toast.error("Action failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold text-slate-900 mb-6">
                    {editing ? 'Edit' : 'Add'} New Social
                </h2>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Platform</label>
                        <select
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.platform}
                            onChange={e => setFormData({ ...formData, platform: e.target.value })}
                        >
                            <option value="">Select a platform</option>
                            <option value="linkedin">Linkedin</option>
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                            <option value="twitter">Twitter</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Client Id</label>
                        <input
                            required
                            type="text"
                            placeholder="Enter Client Id"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.client_id}
                            onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Client Secret</label>
                        <input
                            required
                            type="text"
                            placeholder="Enter Client secret"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.client_secret}
                            onChange={e => setFormData({ ...formData, client_secret: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Account Id</label>
                        <input
                            required
                            type="text"
                            placeholder="Enter Account Id"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.account_id}
                            onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Account Name</label>
                        <input
                            required
                            type="text"
                            placeholder="Enter Account Name"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.account_name}
                            onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Account Email</label>
                        <input
                            required
                            type="text"
                            placeholder="Enter Account Email"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.account_email}
                            onChange={e => setFormData({ ...formData, account_email: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-md hover:bg-slate-800 disabled:opacity-50"
                        >
                            {loading
                                ? editing
                                    ? "Updating..."
                                    : "Adding..."
                                : editing
                                    ? "Update Social"
                                    : "Add Social"}
                        </button>
                    </div>
                </form>
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
