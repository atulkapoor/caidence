"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    Briefcase, FileText, DollarSign, Upload, Clock,
    CheckCircle, XCircle, TrendingUp, Download, User
} from "lucide-react";

interface Assignment {
    id: number;
    brand_name: string;
    campaign_name: string;
    deliverable: string;
    deadline: string;
    status: "pending" | "in_progress" | "submitted" | "approved" | "rejected";
    payment: number;
}

interface EarningsSummary {
    total_earnings: number;
    pending_payout: number;
    this_month: number;
    total_conversions: number;
}

export default function CreatorPortalPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data
        setAssignments([
            { id: 1, brand_name: "TechFlow", campaign_name: "Product Launch Q1", deliverable: "1 Reel + 2 Stories", deadline: "2026-01-25", status: "in_progress", payment: 500 },
            { id: 2, brand_name: "StyleHub", campaign_name: "Spring Collection", deliverable: "3 Static Posts", deadline: "2026-01-30", status: "pending", payment: 350 },
            { id: 3, brand_name: "FitLife Pro", campaign_name: "New Year Challenge", deliverable: "1 YouTube Video", deadline: "2026-01-15", status: "approved", payment: 1200 },
            { id: 4, brand_name: "EcoGreen", campaign_name: "Sustainability Drive", deliverable: "2 TikToks", deadline: "2026-01-20", status: "submitted", payment: 400 },
        ]);
        setEarnings({
            total_earnings: 8450,
            pending_payout: 1250,
            this_month: 2100,
            total_conversions: 347,
        });
        setLoading(false);
    }, []);

    const getStatusBadge = (status: Assignment["status"]) => {
        const styles = {
            pending: "bg-amber-100 text-amber-700",
            in_progress: "bg-blue-100 text-blue-700",
            submitted: "bg-purple-100 text-purple-700",
            approved: "bg-emerald-100 text-emerald-700",
            rejected: "bg-red-100 text-red-700",
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status]}`}>
                {status.replace("_", " ").toUpperCase()}
            </span>
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 p-4">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                            E
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">Welcome back, Emma!</h1>
                            <p className="text-slate-500">@emma_styles • Creator Portal</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                        <Download className="w-4 h-4" />
                        Download Media Kit
                    </button>
                </header>

                {/* Stats */}
                {loading ? (
                    <div className="text-center py-8 text-slate-400">Loading...</div>
                ) : (
                    <div className="grid grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm text-slate-500">Total Earnings</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">${earnings?.total_earnings.toLocaleString()}</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-5 h-5 text-amber-600" />
                                <span className="text-sm text-slate-500">Pending Payout</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">${earnings?.pending_payout.toLocaleString()}</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                <span className="text-sm text-slate-500">This Month</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">${earnings?.this_month.toLocaleString()}</div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <Briefcase className="w-5 h-5 text-purple-600" />
                                <span className="text-sm text-slate-500">Conversions</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">{earnings?.total_conversions}</div>
                        </div>
                    </div>
                )}

                {/* Assignments */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            My Assignments
                        </h2>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-bold">All</button>
                            <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-bold">Active</button>
                            <button className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-bold">Completed</button>
                        </div>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">Campaign</th>
                                <th className="px-6 py-4">Deliverable</th>
                                <th className="px-6 py-4">Deadline</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Payment</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {assignments.map((a) => (
                                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{a.campaign_name}</div>
                                        <div className="text-xs text-slate-500">{a.brand_name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{a.deliverable}</td>
                                    <td className="px-6 py-4 text-slate-600">{a.deadline}</td>
                                    <td className="px-6 py-4">{getStatusBadge(a.status)}</td>
                                    <td className="px-6 py-4 font-bold text-emerald-600">${a.payment}</td>
                                    <td className="px-6 py-4 text-right">
                                        {a.status === "pending" || a.status === "in_progress" ? (
                                            <button className="text-indigo-600 font-bold text-xs flex items-center gap-1 justify-end hover:underline">
                                                <Upload className="w-3 h-3" /> Submit
                                            </button>
                                        ) : a.status === "approved" ? (
                                            <span className="text-emerald-600 flex items-center gap-1 justify-end text-xs">
                                                <CheckCircle className="w-3 h-3" /> Paid
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-6">
                    <a href="/creator-portal/profile" className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-all cursor-pointer">
                        <User className="w-8 h-8 text-blue-600 mb-3" />
                        <div className="font-bold text-slate-900">Edit Profile</div>
                        <div className="text-sm text-slate-500">Update your bio and social links</div>
                    </a>
                    <a href="/creator-portal/earnings" className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-all cursor-pointer">
                        <DollarSign className="w-8 h-8 text-emerald-600 mb-3" />
                        <div className="font-bold text-slate-900">Request Payout</div>
                        <div className="text-sm text-slate-500">Withdraw your earnings</div>
                    </a>
                    <a href="/creator-portal/content" className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-all cursor-pointer">
                        <Upload className="w-8 h-8 text-purple-600 mb-3" />
                        <div className="font-bold text-slate-900">Content Library</div>
                        <div className="text-sm text-slate-500">View all your submissions</div>
                    </a>
                </div>
            </div>
        </DashboardLayout>
    );
}
