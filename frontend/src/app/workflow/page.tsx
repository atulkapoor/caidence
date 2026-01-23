
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Workflow, Plus, Play, Activity } from "lucide-react";

import { fetchWorkflows, createWorkflow, Workflow as WorkflowType } from "@/lib/api";
import Link from "next/link";

export default function WorkflowPage() {
    const [activeTab, setActiveTab] = useState("my-workflows");
    const [workflows, setWorkflows] = useState<WorkflowType[]>([]);

    useEffect(() => {
        const loadWorkflows = async () => {
            try {
                const data = await fetchWorkflows();
                setWorkflows(data);
            } catch (error) {
                console.error(error);
            }
        };
        loadWorkflows();
    }, []);

    const router = useRouter();

    const handleCreate = async () => {
        try {
            const newWorkflow = await createWorkflow({
                name: "New AI Workflow",
                description: "Draft workflow",
                steps_json: "[]"
            });
            // Redirect to the new workflow configuration
            router.push(`/workflow/${newWorkflow.id}`);
        } catch (error) {
            console.error("Failed to create workflow", error);
            alert("Failed to create workflow. Check console for details.");
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Workflow Automation</h1>
                        <p className="text-slate-500 text-sm">Automate your marketing tasks with AI agents</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Create Workflow
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-10">
                    <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 inline-flex">
                        {["my-workflows", "templates"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                {tab.replace("-", " ")}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === "my-workflows" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {workflows.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Workflow className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No workflows yet</h3>
                                <p className="text-slate-500 mb-6">Create your first automated workflow to get started.</p>
                                <button onClick={handleCreate} className="text-indigo-600 font-bold hover:underline">
                                    Create New Workflow &rarr;
                                </button>
                            </div>
                        )}
                        {workflows.map((workflow) => {
                            let steps: Record<string, unknown>[] = [];
                            try {
                                steps = JSON.parse(workflow.steps_json) as Record<string, unknown>[];
                            } catch {
                                steps = [];
                            }

                            return (
                                <Link href={`/workflow/${workflow.id}`} key={workflow.id} className="block group">
                                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden">

                                        {/* Status Badge */}
                                        <div className="absolute top-4 right-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${workflow.status === 'active' ? 'bg-green-100/50 text-green-700 border border-green-100' : 'bg-slate-100 text-slate-500 border border-slate-100'
                                                }`}>
                                                {workflow.status}
                                            </span>
                                        </div>

                                        {/* Header */}
                                        <div className="flex items-start gap-4 mb-6 mt-1">
                                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                                <Workflow className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{workflow.name}</h3>
                                                <p className="text-xs text-slate-500 line-clamp-2">{workflow.description}</p>
                                            </div>
                                        </div>

                                        {/* Step Preview */}
                                        <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100/50">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Automation Preview</span>
                                                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{steps.length} Steps</span>
                                            </div>
                                            <div className="space-y-2.5">
                                                {steps.length > 0 ? (
                                                    steps.slice(0, 3).map((step, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 text-sm text-slate-600">
                                                            <div className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm">{idx + 1}</div>
                                                            <span className="truncate flex-1 font-medium">{(step.name as string) || "Untitled Step"}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-2 text-xs text-slate-400 italic">No steps configured</div>
                                                )}
                                                {steps.length > 3 && (
                                                    <div className="pl-8 text-xs text-indigo-500 font-semibold">+ {steps.length - 3} more steps</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-medium text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Activity className="w-3.5 h-3.5" />
                                                {workflow.run_count} Executions
                                            </div>
                                            <button className="text-indigo-600 font-bold group-hover:underline">
                                                Configure &rarr;
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {["Lead Generation", "Content Distribution", "Customer Onboarding", "Event Promotion", "Review Request", "Re-engagement"].map((template, i) => (
                            <div key={i} className="bg-white p-7 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer group flex flex-col h-full">
                                <div className="w-14 h-14 bg-gradient-to-br from-pink-50 to-rose-50 text-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                    <Play className="w-7 h-7" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 mb-2">{template}</h3>
                                <p className="text-slate-500 text-sm mb-6 flex-1">
                                    Automated sequence to handle {template.toLowerCase()} across multiple channels efficiently.
                                </p>
                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">8 Steps</span>
                                    <button className="text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 rounded-lg shadow-md shadow-pink-500/20 group-hover:shadow-pink-500/40 hover:-translate-y-0.5 transition-all">
                                        Use Template
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
