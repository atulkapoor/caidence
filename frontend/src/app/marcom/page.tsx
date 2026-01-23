"use client";

import { ToolCard } from "@/components/marcom/ToolCard";
import { Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TOOLS } from "@/lib/marcom-tools";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarcomPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTools = TOOLS.filter(tool =>
        tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50/50 p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Marcom Hub</h1>
                            <p className="text-slate-500 mt-2 text-lg">Your AI-powered marketing & communication toolkit</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-base"
                            placeholder="Search for a tool..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Tools Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredTools.map((tool) => (
                            <ToolCard
                                key={tool.id}
                                title={tool.title}
                                description={tool.description}
                                icon={tool.icon}
                                category={tool.category}
                                color={tool.color}
                                onClick={() => router.push(`/marcom/tool/${tool.id}`)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

