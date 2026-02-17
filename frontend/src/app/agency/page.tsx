"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useModalScroll } from "@/hooks/useModalScroll";
import { Building2, Users, Briefcase, DollarSign, Plus, Settings, MoreHorizontal, X, Loader2, ShieldAlert } from "lucide-react";
import { fetchBrands, createBrand, Brand } from "@/lib/api";
import { isAgencyLevel, type UserRole } from "@/lib/permissions";
import { toast } from "sonner";
import { PermissionGate } from "@/components/rbac/PermissionGate";
import { AccessDenied } from "@/components/rbac/AccessDenied";

export default function AgencyPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [userRole, setUserRole] = useState<UserRole>("viewer");

    // Detect user role from stored profile
    useEffect(() => {
        try {
            const profile = localStorage.getItem('user_profile');
            if (profile) {
                const parsed = JSON.parse(profile);
                if (parsed.role) setUserRole(parsed.role as UserRole);
            }
        } catch { /* use default */ }
    }, []);

    useModalScroll(showCreateModal);

    const loadBrands = async () => {
        setLoading(true);
        try {
            const data = await fetchBrands();
            setBrands(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load brands. Please try again.");
            // Fallback to empty list or keep previous state
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBrands();
    }, []);

    const stats = [
        { title: "Total Brands", value: brands.length.toString(), icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Active Campaigns", value: "23", icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" }, // Mock
        { title: "Total Creators", value: "156", icon: Users, color: "text-purple-600", bg: "bg-purple-50" }, // Mock
        { title: "Monthly Revenue", value: "$45.2k", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" }, // Mock
    ];

    return (
        <DashboardLayout>
            <PermissionGate require="agency:read" fallback={<AccessDenied />}>
            <div className="max-w-7xl mx-auto space-y-8 p-4">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Agency Dashboard</h1>
                        <p className="text-slate-500">Manage all your brands and campaigns from one place.</p>
                    </div>
                    {isAgencyLevel(userRole) ? (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <Plus className="w-4 h-4" />
                            Add Brand
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                            <ShieldAlert className="w-4 h-4" />
                            Agency role required to create brands
                        </div>
                    )}
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                                    <div className="text-sm text-slate-500 font-medium">{stat.title}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Brands Grid */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Your Brands</h2>
                        <div className="flex gap-2">
                            <select
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                size={1}
                            >
                                <option>All Industries</option>
                                <option>Technology</option>
                                <option>Fashion</option>
                                <option>Beauty</option>
                                <option>Health & Fitness</option>
                                <option>Food & Beverage</option>
                                <option>Travel</option>
                                <option>Finance</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p>Loading your brands...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {brands.map((brand) => (
                                <div
                                    key={brand.id}
                                    className={`bg-white p-6 rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group ${brand.is_active ? "border-slate-200" : "border-slate-100 opacity-60"
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                            {brand.name.charAt(0).toUpperCase()}
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-100 rounded-lg transition-all">
                                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg mb-1">{brand.name}</h3>
                                    <p className="text-sm text-slate-500 mb-4 font-medium">{brand.industry || "Unspecified Industry"}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400 font-medium">0 Creators</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${brand.is_active
                                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                            : "bg-slate-50 text-slate-500 ring-slate-500/10"
                                            }`}>
                                            {brand.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Add New Brand Card */}
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 cursor-pointer transition-all min-h-[200px] h-full"
                            >
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <span className="font-bold">Add New Brand</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Brand Modal */}
            {showCreateModal && (
                <CreateBrandModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadBrands();
                    }}
                />
            )}
            </PermissionGate>
        </DashboardLayout>
    );
}

function CreateBrandModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [name, setName] = useState("");
    const [industry, setIndustry] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setIsSubmitting(true);
        try {
            await createBrand({ name, industry, description });
            toast.success("Brand created successfully!");
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to create brand");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-900">Create New Brand</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Brand Name</label>
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g. Acme Corp"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Industry</label>
                        <select
                            value={industry}
                            onChange={e => setIndustry(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium bg-white"
                        >
                            <option value="">Select an industry...</option>
                            <option value="Technology">Technology</option>
                            <option value="Fashion">Fashion</option>
                            <option value="Beauty">Beauty</option>
                            <option value="Food & Beverage">Food & Beverage</option>
                            <option value="Health & Fitness">Health & Fitness</option>
                            <option value="Travel">Travel</option>
                            <option value="Finance">Finance</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Description</label>
                        <textarea
                            placeholder="Brief description of the brand..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium h-24 resize-none"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !name}
                            className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                            Create Brand
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
