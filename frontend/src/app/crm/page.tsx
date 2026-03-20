"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { createRelationship, deleteRelationship, fetchRelationships, generateXRayReport, RelationshipProfile, updateRelationship, uploadCrmRelationships, downloadCrmTemplate } from "@/lib/api";
import { FileText, Download, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/rbac/PermissionGate";
import { AccessDenied } from "@/components/rbac/AccessDenied";
import { useModalScroll } from "@/hooks/useModalScroll";

export default function CRMPage() {
    const [relationships, setRelationships] = useState<RelationshipProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [showPortfolioModal, setShowPortfolioModal] = useState(false);
    const [editingProfile, setEditingProfile] = useState<RelationshipProfile | null>(null);
    const [formHandle, setFormHandle] = useState("");
    const [formPlatform, setFormPlatform] = useState("Instagram");
    const [formStatus, setFormStatus] = useState<"Active" | "Vetted" | "Past" | "Blacklisted">("Active");
    const [formWhatsapp, setFormWhatsapp] = useState("");
    const [formName, setFormName] = useState("");
    const [saving, setSaving] = useState(false);

    useModalScroll(showPortfolioModal);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchRelationships();
                setRelationships(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleGenerateReport = async (handle: string) => {
        const toastId = toast.loading(`Generating X-Ray Report for ${handle}...`);
        try {
            const res = await generateXRayReport(handle);
            toast.success(`Report generated! (${res.download_url})`, { id: toastId });
        } catch (err: any) {
            console.error(err);
            toast.error(`Failed to generate report: ${err.message}`, { id: toastId });
        }
    };

    const handleExport = () => {
        if (relationships.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Handle", "WhatsApp Numbers", "Platform", "Status", "Total Spend", "Avg ROI", "Last Contact"];
        const csvContent = [
            headers.join(","),
            ...relationships.map(r => [
                r.handle,
                (r.whatsapp_numbers || []).join("|"),
                r.platform,
                r.relationship_status,
                r.total_spend,
                r.avg_roi,
                r.last_contact
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crm_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Export downloaded");
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await downloadCrmTemplate();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "crm_influencer_template.xlsx";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Template downloaded");
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "Failed to download template");
        }
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const toastId = toast.loading("Uploading CRM file...");
        try {
            const result = await uploadCrmRelationships(file);
            toast.success(
                `Imported. Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`,
                { id: toastId }
            );
            if (result.errors?.length) {
                toast.error(`Some rows were skipped. Example: ${result.errors[0]}`);
            }
            const data = await fetchRelationships();
            setRelationships(data);
        } catch (err: any) {
            toast.error(err?.message || "Failed to import CRM file", { id: toastId });
        }
    };

    const filteredRelationships = relationships.filter(rel =>
        rel.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rel.platform || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const resetPortfolioForm = () => {
        setFormHandle("");
        setFormPlatform("Instagram");
        setFormStatus("Active");
        setFormWhatsapp("");
        setFormName("");
        setEditingProfile(null);
    };

    const openAddPortfolio = () => {
        resetPortfolioForm();
        setShowPortfolioModal(true);
    };

    const openEditPortfolio = (rel: RelationshipProfile) => {
        setEditingProfile(rel);
        setFormHandle(rel.handle || "");
        setFormPlatform(rel.platform || "Instagram");
        setFormStatus(rel.relationship_status || "Active");
        setFormWhatsapp((rel.whatsapp_numbers || []).join(", "));
        setFormName("");
        setShowPortfolioModal(true);
    };

    const parseWhatsAppNumbers = (raw: string) => {
        return raw
            .split(/[;,]/)
            .map((value) => value.trim())
            .filter(Boolean);
    };

    const handleSavePortfolio = async () => {
        const handle = formHandle.trim();
        if (!handle) {
            toast.error("Handle is required");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                handle,
                platform: formPlatform,
                relationship_status: formStatus,
                whatsapp_numbers: parseWhatsAppNumbers(formWhatsapp),
                name: formName || undefined,
            };

            if (editingProfile?.creator_id) {
                await updateRelationship(editingProfile.creator_id, payload);
                toast.success("Influencer updated");
            } else {
                await createRelationship(payload);
                toast.success("Influencer added");
            }

            const data = await fetchRelationships();
            setRelationships(data);
            setShowPortfolioModal(false);
            resetPortfolioForm();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "Failed to save influencer");
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePortfolio = async (rel: RelationshipProfile) => {
        if (!rel.creator_id) {
            toast.error("This entry cannot be deleted");
            return;
        }
        if (!confirm(`Remove ${rel.handle} from portfolio?`)) return;
        try {
            await deleteRelationship(rel.creator_id);
            toast.success("Influencer removed");
            const data = await fetchRelationships();
            setRelationships(data);
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "Failed to delete influencer");
        }
    };

    return (
        <DashboardLayout>
            <PermissionGate require="crm:read" fallback={<AccessDenied />}>
            <div className="max-w-7xl mx-auto space-y-8 p-4">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">CRM & Relationships</h1>
                        <p className="text-slate-500">Manage influencer partnerships and track lifetime value.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx"
                            onChange={handleFileSelected}
                            className="hidden"
                        />
                        <PermissionGate require="crm:create">
                            <button
                                onClick={handleDownloadTemplate}
                                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
                            >
                                Download CRM Template
                            </button>
                        </PermissionGate>
                        <PermissionGate require="crm:create">
                        <button
                            onClick={handleUploadClick}
                            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
                        >
                            Upload CRM File
                        </button>
                        </PermissionGate>
                    </div>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Active Relationships</div>
                        <div className="text-3xl font-black text-slate-900">
                            {relationships.filter(r => r.relationship_status === 'Active').length}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Spend (YTD)</div>
                        <div className="text-3xl font-black text-slate-900">
                            ${relationships.reduce((sum, r) => sum + r.total_spend, 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Avg. ROI Multiple</div>
                        <div className="text-3xl font-black text-emerald-600">
                            {relationships.length > 0
                                ? (relationships.reduce((sum, r) => sum + r.avg_roi, 0) / relationships.length).toFixed(1)
                                : '0'}x
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center bg-indigo-50 border-indigo-100">
                        <button onClick={handleExport} className="flex flex-col items-center gap-2 text-indigo-700 font-bold hover:scale-105 transition-transform">
                            <Download className="w-6 h-6" />
                            Download Full Export
                        </button>
                    </div>
                </div>

                {/* Relationships Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-bold text-slate-900">Portfolio</h2>
                        <div className="flex gap-2 items-center">
                            <input
                                placeholder="Search handle..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <PermissionGate require="crm:create">
                                <button
                                    onClick={openAddPortfolio}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Influencer
                                </button>
                            </PermissionGate>
                        </div>
                    </div>

                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">WhatsApp</th>
                                <th className="px-6 py-4">Influencer</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Total Spend</th>
                                <th className="px-6 py-4">Avg. ROI</th>
                                <th className="px-6 py-4">Last Contact</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading relationships...</td></tr>
                            ) : filteredRelationships.map((rel) => (
                                <tr key={rel.handle} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                                        {(rel.whatsapp_numbers || []).length > 0
                                            ? rel.whatsapp_numbers?.join(", ")
                                            : "-"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: rel.avatar_color }}>
                                                {rel.handle.substring(1, 3).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{rel.handle}</div>
                                                <div className="text-xs text-slate-500">{rel.platform}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${rel.relationship_status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                            rel.relationship_status === 'Vetted' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {rel.relationship_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        ${rel.total_spend.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-emerald-600">
                                        {rel.avg_roi}x
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {rel.last_contact}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <PermissionGate require="crm:update">
                                                <button
                                                    onClick={() => handleGenerateReport(rel.handle)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1"
                                                    title="Generate X-Ray Report"
                                                >
                                                    <FileText className="w-4 h-4" /> X-Ray
                                                </button>
                                            </PermissionGate>
                                            <PermissionGate require="crm:update">
                                                <button
                                                    onClick={() => openEditPortfolio(rel)}
                                                    className={`text-slate-500 hover:text-slate-800 font-bold text-xs flex items-center gap-1 ${!rel.creator_id ? "opacity-50 cursor-not-allowed" : ""}`}
                                                    title={rel.creator_id ? "Edit influencer" : "Editing disabled"}
                                                    disabled={!rel.creator_id}
                                                >
                                                    <Pencil className="w-4 h-4" /> Edit
                                                </button>
                                            </PermissionGate>
                                            <PermissionGate require="crm:delete">
                                                <button
                                                    onClick={() => handleDeletePortfolio(rel)}
                                                    className={`text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-1 ${!rel.creator_id ? "opacity-50 cursor-not-allowed" : ""}`}
                                                    title={rel.creator_id ? "Remove influencer" : "Deletion disabled"}
                                                    disabled={!rel.creator_id}
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </PermissionGate>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showPortfolioModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => {
                                if (!saving) {
                                    setShowPortfolioModal(false);
                                    resetPortfolioForm();
                                }
                            }}
                        />
                        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-900">
                                    {editingProfile ? "Edit Influencer" : "Add Influencer"}
                                </h3>
                                <button
                                    onClick={() => {
                                        if (!saving) {
                                            setShowPortfolioModal(false);
                                            resetPortfolioForm();
                                        }
                                    }}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    X
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Handle</label>
                                    <input
                                        value={formHandle}
                                        onChange={(e) => setFormHandle(e.target.value)}
                                        placeholder="@creator_handle"
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Platform</label>
                                        <select
                                            value={formPlatform}
                                            onChange={(e) => setFormPlatform(e.target.value)}
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                                        >
                                            <option value="Instagram">Instagram</option>
                                            <option value="TikTok">TikTok</option>
                                            <option value="YouTube">YouTube</option>
                                            <option value="Twitch">Twitch</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                        <select
                                            value={formStatus}
                                            onChange={(e) => setFormStatus(e.target.value as typeof formStatus)}
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Vetted">Vetted</option>
                                            <option value="Past">Past</option>
                                            <option value="Blacklisted">Blacklisted</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Name (Optional)</label>
                                    <input
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="Creator name"
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">WhatsApp Numbers</label>
                                    <textarea
                                        value={formWhatsapp}
                                        onChange={(e) => setFormWhatsapp(e.target.value)}
                                        placeholder="+919876543210, +919812345678"
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[90px]"
                                    />
                                    <p className="text-xs text-slate-400">Separate numbers with commas or semicolons.</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => {
                                        if (!saving) {
                                            setShowPortfolioModal(false);
                                            resetPortfolioForm();
                                        }
                                    }}
                                    className="px-4 py-2 text-slate-500 font-bold"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePortfolio}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            </PermissionGate>
        </DashboardLayout>
    );
}
