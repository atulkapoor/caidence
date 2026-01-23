"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Wrench } from "lucide-react";

export default function PlaceholderPage({ params }: { params: { slug?: string } }) {
    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="p-4 bg-secondary rounded-full mb-6">
                    <Wrench className="h-12 w-12 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Under Construction</h1>
                <p className="text-muted-foreground max-w-md">
                    This module is part of the full C(AI)DENCE suite. We are currently finalizing the UI for this section.
                </p>
            </div>
        </DashboardLayout>
    );
}
