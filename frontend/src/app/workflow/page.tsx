"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Plus, Search, Layers, Play, Clock, MoreVertical, Trash2, ArrowRight } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useModalScroll } from "@/hooks/useModalScroll";
import Link from "next/link";
import { fetchWorkflows, createWorkflow, Workflow } from "@/lib/api";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/rbac/PermissionGate";
import { AccessDenied } from "@/components/rbac/AccessDenied";

function WorkflowList() {
    const router = useRouter();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [newWorkflowName, setNewWorkflowName] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        try {
            setLoading(true);
            const data = await fetchWorkflows();
            setWorkflows(data);
        } catch (error) {
            console.error("Failed to fetch workflows", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWrapper = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorkflowName.trim()) return;

        setIsCreating(true);
        try {
            const newWf = await createWorkflow({
                name: newWorkflowName,
                description: "New automation workflow",
                steps_json: "[]"
            });
            setWorkflows([newWf, ...workflows]);
            setShowCreateModal(false);
            setNewWorkflowName("");
            router.push(`/workflow/${newWf.id}`);
        } catch (error) {
            console.error("Failed to create workflow", error);
            alert("Failed to create workflow");
        } finally {
            setIsCreating(false);
        }
    };

    const filteredWorkflows = workflows.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Workflow Automation</h1>
                        <p className="text-sm text-slate-500 mt-1">Design and manage your automated marketing flows.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Create Workflow
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 max-w-md">
                    <Search className="w-5 h-5 text-slate-400 ml-2" />
                    <input
                        type="text"
                        placeholder="Search workflows..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 placeholder:text-slate-400"
                    />
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredWorkflows.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Layers className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No workflows found</h3>
                        <p className="text-slate-500 mb-6">Get started by creating your first automation.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="text-indigo-600 font-bold hover:underline"
                        >
                            Create New Workflow
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredWorkflows.map((workflow) => (
                            <Link key={workflow.id} href={`/workflow/${workflow.id}`} className="group">
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all h-full flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-indigo-500 transition-colors"></div>

                                    <div className="flex justify-between items-start mb-4 pl-2">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${workflow.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                                            }`}>
                                            {workflow.status}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-slate-900 text-lg mb-2 pl-2 group-hover:text-indigo-600 transition-colors">{workflow.name}</h3>
                                    <p className="text-sm text-slate-500 mb-6 pl-2 line-clamp-2 flex-1">{workflow.description}</p>

                                    <div className="pl-2 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-medium text-slate-400">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Play className="w-3 h-3" />
                                                {workflow.run_count} runs
                                            </span>
                                            {workflow.last_run && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(workflow.last_run).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Workflow</h2>
                            <form onSubmit={handleCreateWrapper}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Workflow Name</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newWorkflowName}
                                            onChange={(e) => setNewWorkflowName(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                            placeholder="e.g., Weekly Newsletter Automation"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!newWorkflowName.trim() || isCreating}
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isCreating ? 'Creating...' : 'Create Workflow'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function WorkflowPage() {
    return (
        <Suspense fallback={
            <DashboardLayout>
                <div className="p-8 flex items-center justify-center min-h-[50vh]">
                    <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                </div>
            </DashboardLayout>
        }>
            <DashboardLayout>
                <PermissionGate require="workflow:read" fallback={<AccessDenied />}>
                    <WorkflowList />
                </PermissionGate>
            </DashboardLayout>
        </Suspense>
    );
}
