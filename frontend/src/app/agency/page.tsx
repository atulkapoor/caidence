"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useModalScroll } from "@/hooks/useModalScroll";
import { Building2, Users, Briefcase, DollarSign, Plus, Settings, MoreHorizontal, X, Loader2, ShieldAlert, Link2, Power, Trash2 } from "lucide-react";
import { fetchBrands, createBrand, updateBrand, deleteBrand, Brand } from "@/lib/api";
import { listConnections, type SocialConnection } from "@/lib/api/social";
import { SocialConnectCard } from "@/components/onboarding/SocialConnectCard";
import { isAgencyLevel, type UserRole } from "@/lib/permissions";
import { usePermissionContext } from "@/contexts/PermissionContext";
import { toast } from "sonner";
import { PermissionGate } from "@/components/rbac/PermissionGate";
import { AccessDenied } from "@/components/rbac/AccessDenied";

export default function AgencyPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [userRole, setUserRole] = useState<UserRole>("viewer");
    const [connectionsByBrand, setConnectionsByBrand] = useState<Record<number, SocialConnection[]>>({});
    const [connectionsLoadingByBrand, setConnectionsLoadingByBrand] = useState<Record<number, boolean>>({});
    const [openMenuBrandId, setOpenMenuBrandId] = useState<number | null>(null);
    const { hasPermission } = usePermissionContext();

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

    useModalScroll(showCreateModal || showEditModal);

    const loadBrands = async () => {
        setLoading(true);
        try {
            const data = await fetchBrands();
            setBrands(data);
            await loadConnectionsForBrands(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load brands. Please try again.");
            // Fallback to empty list or keep previous state
        } finally {
            setLoading(false);
        }
    };

    const loadConnectionsForBrands = async (data: Brand[]) => {
        if (data.length === 0) return;
        const loadingMap: Record<number, boolean> = {};
        data.forEach((brand) => {
            loadingMap[brand.id] = true;
        });
        setConnectionsLoadingByBrand(loadingMap);
        try {
            const results = await Promise.all(
                data.map(async (brand) => {
                    try {
                        const connections = await listConnections(brand.id);
                        return [brand.id, connections] as const;
                    } catch {
                        return [brand.id, []] as const;
                    }
                })
            );
            const nextMap: Record<number, SocialConnection[]> = {};
            results.forEach(([brandId, connections]) => {
                nextMap[brandId] = connections;
            });
            setConnectionsByBrand(nextMap);
        } finally {
            const doneMap: Record<number, boolean> = {};
            data.forEach((brand) => {
                doneMap[brand.id] = false;
            });
            setConnectionsLoadingByBrand(doneMap);
        }
    };

    const openEditModal = (brand: Brand) => {
        setSelectedBrand(brand);
        setShowEditModal(true);
    };

    const handleBrandUpdated = (updated: Brand) => {
        setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        setSelectedBrand(updated);
    };

    const getActiveConnectionCount = (brandId: number) =>
        (connectionsByBrand[brandId] || []).filter((c) => c.is_active).length;
    useEffect(() => {
        loadBrands();
    }, []);

    useEffect(() => {
        if (openMenuBrandId === null) return;
        const handleClick = () => setOpenMenuBrandId(null);
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [openMenuBrandId]);

    const handleToggleActive = async (brand: Brand) => {
        try {
            const updated = await updateBrand(brand.id, { is_active: !brand.is_active });
            setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
            toast.success(`${updated.name} is now ${updated.is_active ? "active" : "inactive"}`);
        } catch (error: any) {
            toast.error(error?.message || "Failed to update brand status");
        }
    };

    const handleDeleteBrand = async (brand: Brand) => {
        const confirmDelete = window.confirm(`Delete ${brand.name}? This will archive the brand.`);
        if (!confirmDelete) return;
        try {
            await deleteBrand(brand.id);
            setBrands((prev) => prev.map((b) => (b.id === brand.id ? { ...b, is_active: false } : b)));
            toast.success(`${brand.name} archived`);
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete brand");
        }
    };

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
                    <PermissionGate require="agency:create" fallback={
                        isAgencyLevel(userRole) ? (
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                <ShieldAlert className="w-4 h-4" />
                                You don&apos;t have permission to create brands
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                <ShieldAlert className="w-4 h-4" />
                                Agency role required to create brands
                            </div>
                        )
                    }>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <Plus className="w-4 h-4" />
                            Add Brand
                        </button>
                    </PermissionGate>
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
                                        {hasPermission("agency:update") || hasPermission("agency:delete") ? (
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuBrandId((prev) => (prev === brand.id ? null : brand.id));
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-100 rounded-lg transition-all"
                                                >
                                                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                                </button>
                                                {openMenuBrandId === brand.id && (
                                                    <div
                                                        className="absolute right-0 top-10 z-10 w-44 rounded-xl border border-slate-200 bg-white shadow-lg p-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {hasPermission("agency:update") && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        openEditModal(brand);
                                                                        setOpenMenuBrandId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                                                                >
                                                                    Edit Brand
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleToggleActive(brand);
                                                                        setOpenMenuBrandId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                                                                >
                                                                    <Power className="w-4 h-4 text-slate-500" />
                                                                    {brand.is_active ? "Deactivate" : "Activate"}
                                                                </button>
                                                            </>
                                                        )}
                                                        {hasPermission("agency:delete") && (
                                                            <button
                                                                onClick={() => {
                                                                    handleDeleteBrand(brand);
                                                                    setOpenMenuBrandId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-rose-500" />
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg mb-1">{brand.name}</h3>
                                    <p className="text-sm text-slate-500 mb-4 font-medium">{brand.industry || "Unspecified Industry"}</p>
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-3">
                                        <span className="flex items-center gap-1">
                                            <Link2 className="w-3 h-3" />
                                            {connectionsLoadingByBrand[brand.id]
                                                ? "Checking social..."
                                                : getActiveConnectionCount(brand.id) > 0
                                                    ? `${getActiveConnectionCount(brand.id)} connected`
                                                    : "Not connected"}
                                        </span>
                                        {getActiveConnectionCount(brand.id) === 0 && !connectionsLoadingByBrand[brand.id] && (
                                            <PermissionGate require="agency:update">
                                                <button
                                                    onClick={() => openEditModal(brand)}
                                                    className="text-indigo-600 hover:text-indigo-700 font-bold"
                                                >
                                                    Connect
                                                </button>
                                            </PermissionGate>
                                        )}
                                    </div>
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
                            <PermissionGate require="agency:create">
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50 cursor-pointer transition-all min-h-[200px] h-full"
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold">Add New Brand</span>
                                </button>
                            </PermissionGate>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Brand Modal */}
                            {showCreateModal && (
                <CreateBrandModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        loadBrands();
                    }}
                />
            )}
            {showEditModal && selectedBrand && (
                <EditBrandModal
                    brand={selectedBrand}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedBrand(null);
                    }}
                    onUpdated={handleBrandUpdated}
                    onConnectionsChange={async () => {
                        const connections = await listConnections(selectedBrand.id);
                        setConnectionsByBrand((prev) => ({
                            ...prev,
                            [selectedBrand.id]: connections,
                        }));
                    }}
                />
            )}
            </PermissionGate>
        </DashboardLayout>
    );
}

function EditBrandModal({
    brand,
    onClose,
    onUpdated,
    onConnectionsChange,
}: {
    brand: Brand;
    onClose: () => void;
    onUpdated: (brand: Brand) => void;
    onConnectionsChange: () => Promise<void>;
}) {
    const [name, setName] = useState(brand.name);
    const [industry, setIndustry] = useState(brand.industry || "");
    const [description, setDescription] = useState(brand.description || "");
    const [isSaving, setIsSaving] = useState(false);
    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [isConnectionsLoading, setIsConnectionsLoading] = useState(true);
    const platforms = ["instagram", "youtube", "facebook", "linkedin", "whatsapp", "snapchat"] as const;

    useEffect(() => {
        refreshConnections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [brand.id]);

    const refreshConnections = async () => {
        setIsConnectionsLoading(true);
        try {
            const data = await listConnections(brand.id);
            setConnections(data);
        } catch {
            setConnections([]);
        } finally {
            setIsConnectionsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Brand name is required");
            return;
        }
        setIsSaving(true);
        try {
            const updated = await updateBrand(brand.id, {
                name: name.trim(),
                industry: industry || undefined,
                description: description || undefined,
            });
            onUpdated(updated);
            toast.success("Brand updated");
        } catch (error: any) {
            toast.error(error?.message || "Failed to update brand");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-900">Edit Brand</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Brand Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Industry</label>
                            <select
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
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
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium h-28 resize-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <h4 className="text-sm font-bold text-slate-900">Social Connections</h4>
                            <p className="text-xs text-slate-500">Connect social accounts for {brand.name}. These will be used for publishing.</p>
                        </div>
                        {isConnectionsLoading ? (
                            <div className="text-xs text-slate-500">Loading social connections...</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {platforms.map((platform) => (
                                    <SocialConnectCard
                                        key={platform}
                                        platform={platform}
                                        connection={connections.find((c) => c.platform === platform && c.is_active) ?? null}
                                        onStatusChange={async () => {
                                            await refreshConnections();
                                            await onConnectionsChange();
                                        }}
                                        redirectTo="/agency"
                                        brandId={brand.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

function CreateBrandModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [name, setName] = useState("");
    const [industry, setIndustry] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdBrand, setCreatedBrand] = useState<Brand | null>(null);
    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [isConnectionsLoading, setIsConnectionsLoading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const platforms = ["instagram", "youtube", "facebook", "linkedin", "whatsapp", "snapchat"] as const;

    const refreshConnections = async (brandId: number) => {
        setIsConnectionsLoading(true);
        try {
            const data = await listConnections(brandId);
            setConnections(data);
        } catch {
            setConnections([]);
        } finally {
            setIsConnectionsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || createdBrand) return;

        setIsSubmitting(true);
        try {
            const brand = await createBrand({ name, industry, description });
            setCreatedBrand(brand);
            setStep(2);
            toast.success("Brand created successfully!");
            await refreshConnections(brand.id);
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
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {step === 2 ? "Step 2 of 2" : "Step 1 of 2"}
                    </div>

                    {step === 1 && !createdBrand && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Brand Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="e.g. Acme Corp"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    disabled={Boolean(createdBrand)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Industry</label>
                                <select
                                    value={industry}
                                    onChange={e => setIndustry(e.target.value)}
                                    disabled={Boolean(createdBrand)}
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
                                    disabled={Boolean(createdBrand)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium h-24 resize-none"
                                />
                            </div>
                        </>
                    )}

                    {step === 2 && createdBrand && (
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">Connect Social Accounts (Optional)</h4>
                                <p className="text-xs text-slate-500">These connections will be stored for {createdBrand.name} and used when publishing.</p>
                            </div>
                            {isConnectionsLoading ? (
                                <div className="text-xs text-slate-500">Loading social connections...</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {platforms.map((platform) => (
                                        <SocialConnectCard
                                            key={platform}
                                            platform={platform}
                                            connection={connections.find((c) => c.platform === platform && c.is_active) ?? null}
                                            onStatusChange={() => refreshConnections(createdBrand.id)}
                                            redirectTo="/agency"
                                            brandId={createdBrand.id}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        {step === 1 && !createdBrand && (
                            <button
                                type="submit"
                                disabled={isSubmitting || !name}
                                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                                Next
                            </button>
                        )}
                        {step === 2 && createdBrand && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <Building2 className="w-4 h-4" />
                                Create Brand
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
