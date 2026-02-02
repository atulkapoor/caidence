"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { fetchRelationships, generateXRayReport, RelationshipProfile } from "@/lib/api";
import { User, FileText, Download, TrendingUp, DollarSign, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CRMPage() {
    const [relationships, setRelationships] = useState<RelationshipProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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

        const headers = ["Handle", "Platform", "Status", "Total Spend", "Avg ROI", "Last Contact"];
        const csvContent = [
            headers.join(","),
            ...relationships.map(r => [
                r.handle,
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

    const filteredRelationships = relationships.filter(rel =>
        rel.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rel.platform.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 p-4">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">CRM & Relationships</h1>
                        <p className="text-slate-500">Manage influencer partnerships and track lifetime value.</p>
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
                        <h2 className="font-bold text-slate-900">Influencer Portfolio</h2>
                        <div className="flex gap-2">
                            <input
                                placeholder="Search handle..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                            <tr>
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
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading relationships...</td></tr>
                            ) : filteredRelationships.map((rel) => (
                                <tr key={rel.handle} className="hover:bg-slate-50 transition-colors">
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
                                        <button
                                            onClick={() => handleGenerateReport(rel.handle)}
                                            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1 justify-end"
                                            title="Generate X-Ray Report"
                                        >
                                            <FileText className="w-4 h-4" /> X-Ray
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
