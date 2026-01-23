import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { User } from "lucide-react";
import Link from "next/link";
import { InfluencerSearch } from "@/components/discovery/InfluencerSearch";

export default function DiscoveryPage() {
    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 p-4">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Influencer Discovery</h1>
                        <p className="text-slate-500">AI-powered search across 250M+ creator profiles.</p>
                    </div>
                </header>

                <InfluencerSearch />
            </div>
        </DashboardLayout>
    );
}
