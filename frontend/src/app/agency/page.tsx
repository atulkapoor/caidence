"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Building2, Users, Briefcase, DollarSign, Plus, Settings, MoreHorizontal } from "lucide-react";

interface Brand {
    id: number;
    name: string;
    logo_url?: string;
    industry?: string;
    is_active: boolean;
}

export default function AgencyPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data for now
        setBrands([
            { id: 1, name: "TechFlow", logo_url: undefined, industry: "Technology", is_active: true },
            { id: 2, name: "StyleHub", logo_url: undefined, industry: "Fashion", is_active: true },
            { id: 3, name: "FitLife Pro", logo_url: undefined, industry: "Fitness", is_active: true },
            { id: 4, name: "EcoGreen", logo_url: undefined, industry: "Sustainability", is_active: true },
            { id: 5, name: "FoodieBox", logo_url: undefined, industry: "Food & Beverage", is_active: false },
        ]);
        setLoading(false);
    }, []);

    const stats = [
        { title: "Total Brands", value: brands.length.toString(), icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Active Campaigns", value: "23", icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Total Creators", value: "156", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
        { title: "Monthly Revenue", value: "$45.2k", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
    ];

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 p-4">
                {/* Header */}
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Agency Dashboard</h1>
                        <p className="text-slate-500">Manage all your brands and campaigns from one place.</p>
                    </div>
                    <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                        <Plus className="w-4 h-4" />
                        Add Brand
                    </button>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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
                            <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                <option>All Industries</option>
                                <option>Technology</option>
                                <option>Fashion</option>
                                <option>Fitness</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400">Loading brands...</div>
                    ) : (
                        <div className="grid grid-cols-3 gap-6">
                            {brands.map((brand) => (
                                <div
                                    key={brand.id}
                                    className={`bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer group ${brand.is_active ? "border-slate-200" : "border-slate-100 opacity-60"
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                            {brand.name.charAt(0)}
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-100 rounded-lg transition-all">
                                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg mb-1">{brand.name}</h3>
                                    <p className="text-sm text-slate-500 mb-4">{brand.industry}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">8 Creators</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${brand.is_active
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-slate-100 text-slate-500"
                                            }`}>
                                            {brand.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Add New Brand Card */}
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-500 cursor-pointer transition-all min-h-[200px]">
                                <Plus className="w-8 h-8 mb-2" />
                                <span className="font-bold">Add New Brand</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
