"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ArrowLeft, Play, Clock, CheckCircle, AlertCircle, Terminal, FileJson, Settings, Layers, Plus } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useTabState } from "@/hooks/useTabState";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWorkflowById, fetchWorkflowHistory, runWorkflow, Workflow, WorkflowRun } from "@/lib/api";

interface PageProps {
    params: { id: string };
}

interface Step {
    id: number;
    type: string;
    name: string;
    config: Record<string, unknown>;
}

function WorkflowDetailContent({ params }: PageProps) {
    const router = useRouter();
    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [history, setHistory] = useState<WorkflowRun[]>([]);
    const [loading, setLoading] = useState(true);
    // @ts-ignore
    const [activeTab, setActiveTab] = useTabState("config");
    const [isRunning, setIsRunning] = useState(false);

    // State for the visual builder
    const [localSteps, setLocalSteps] = useState<Step[]>([]);
    const [triggerType, setTriggerType] = useState<string>("manual");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unwrapparams = async () => {
            const p = await params;
            setResolvedParams(p);
        };
        unwrapparams();
    }, [params]);

    useEffect(() => {
        if (resolvedParams?.id) {
            loadData(resolvedParams.id);
        }
    }, [resolvedParams]);

    // Initial load sync
    useEffect(() => {
        if (workflow?.steps_json) {
            try {
                const parsed = JSON.parse(workflow.steps_json) as Step[];
                setLocalSteps(parsed);
                // In a real app, trigger type would also be saved/loaded
            } catch {
                setLocalSteps([]);
            }
        }
    }, [workflow]);

    const loadData = async (id: string) => {
        try {
            const wfData = await fetchWorkflowById(parseInt(id));
            setWorkflow(wfData);
            const historyData = await fetchWorkflowHistory(parseInt(id));
            setHistory(historyData);
        } catch (error) {
            console.error("Failed to load workflow data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRun = async () => {
        if (!workflow) return;
        setIsRunning(true);
        try {
            const newRun = await runWorkflow(workflow.id);
            setHistory([newRun, ...history]);
            // Refresh workflow stats
            const updatedWf = await fetchWorkflowById(workflow.id);
            setWorkflow(updatedWf);
            // Switch to history tab to show the run result
            setActiveTab("history");
        } catch (error) {
            console.error("Failed to run workflow", error);
            alert("Failed to start workflow");
        } finally {
            setIsRunning(false);
        }
    };

    if (!resolvedParams || loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-slate-50/50 p-8 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!workflow) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-slate-50/50 p-8 flex flex-col items-center justify-center">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Workflow Not Found</h2>
                    <Link href="/workflow" className="text-indigo-600 font-bold hover:underline">Return to Library</Link>
                </div>
            </DashboardLayout>
        );
    }



    const handleSave = async () => {
        if (!workflow) return;
        setIsSaving(true);
        try {
            await import("@/lib/api").then(mod => mod.updateWorkflow(workflow.id, {
                name: workflow.name,
                description: workflow.description,
                steps_json: JSON.stringify(localSteps)
            }));

            // Reload to confirm sync
            const updated = await fetchWorkflowById(workflow.id);
            setWorkflow(updated);
            alert("Workflow saved successfully!");
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save workflow");
        } finally {
            setIsSaving(false);
        }
    };

    const addStep = () => {
        setLocalSteps([...localSteps, { id: Date.now(), type: "action", name: "New Action Step", config: {} }]);
    };

    const deleteStep = (index: number) => {
        const newSteps = [...localSteps];
        newSteps.splice(index, 1);
        setLocalSteps(newSteps);
    };

    const updateStep = (index: number, field: string, value: string) => {
        const newSteps = [...localSteps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setLocalSteps(newSteps);
    };

    const steps = JSON.parse(workflow?.steps_json || "[]");

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Breadcrumbs */}
                    <nav className="flex items-center text-sm text-slate-500 font-medium">
                        <Link href="/workflow" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                            <Layers className="w-4 h-4" />
                            Workflows
                        </Link>
                        <span className="mx-3 text-slate-300">/</span>
                        <span className="text-slate-900">{workflow?.name}</span>
                    </nav>

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${workflow?.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                <Layers className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 leading-tight">{workflow?.name}</h1>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                                    <span className={`px-2 py-0.5 rounded-full uppercase tracking-wider ${workflow?.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                                        }`}>
                                        {workflow?.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 group"
                            >
                                <CheckCircle className={`w-4 h-4 ${isSaving ? 'text-slate-400' : 'text-green-500'}`} />
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                onClick={handleRun}
                                disabled={isRunning}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                            >
                                {isRunning ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Running...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 fill-current" />
                                        Run Now
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center border-b border-slate-200/60 pb-1">
                        <div className="flex gap-8">
                            <button
                                onClick={() => setActiveTab("config")}
                                className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 px-4 ${activeTab === "config" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
                                    }`}
                            >
                                <Settings className="w-4 h-4" />
                                Config & Builder
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 px-4 ${activeTab === "history" ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
                                    }`}
                            >
                                <Clock className="w-4 h-4" />
                                Run History
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {activeTab === "config" ? (
                            <>
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Trigger Card */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                                        <div className="flex items-start justify-between mb-4 pl-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                    ⚡
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 border-b border-dashed border-slate-300 pb-0.5">Trigger</h3>
                                                    <p className="text-xs text-slate-500 mt-1">How this workflow starts</p>
                                                </div>
                                            </div>
                                            <select
                                                value={triggerType}
                                                onChange={(e) => setTriggerType(e.target.value)}
                                                className="text-sm border-slate-200 rounded-lg py-1.5 px-3 font-medium text-slate-700 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="manual">Manual Trigger</option>
                                                <option value="schedule">Scheduled (Cron)</option>
                                                <option value="webhook">Webhook Event</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex justify-center">
                                        <div className="w-0.5 h-6 bg-slate-300"></div>
                                    </div>

                                    {/* Steps List */}
                                    <div className="space-y-4">
                                        {localSteps.length === 0 && (
                                            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                                <p className="text-slate-400 text-sm mb-4">No steps added yet.</p>
                                                <button onClick={addStep} className="text-indigo-600 font-bold text-sm hover:underline">+ Add First Step</button>
                                            </div>
                                        )}

                                        {localSteps.map((step, idx) => (
                                            <div key={idx}>
                                                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative group hover:border-indigo-300 transition-all flex gap-4">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-200 group-hover:bg-indigo-400 transition-colors"></div>

                                                    {/* Index */}
                                                    <div className="flex flex-col items-center gap-2 pt-1 pl-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
                                                            {idx + 1}
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="text"
                                                                value={step.name}
                                                                onChange={(e) => updateStep(idx, 'name', e.target.value)}
                                                                className="font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-indigo-300 focus:outline-none px-1 py-0.5 w-full hover:border-slate-200 transition-colors placeholder:text-slate-300"
                                                                placeholder="Step Name"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex-1">
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Action Type</label>
                                                                <select
                                                                    value={step.type || "action"}
                                                                    onChange={(e) => updateStep(idx, 'type', e.target.value)}
                                                                    className="w-full text-sm border-slate-200 rounded-lg py-2 px-3 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500"
                                                                >
                                                                    <option value="ai_generate">AI Content Generation</option>
                                                                    <option value="social_post">Post to Social Media</option>
                                                                    <option value="send_email">Send Email</option>
                                                                    <option value="sms_send">Send SMS / WhatsApp</option>
                                                                    <option value="crm_update">Update CRM Contact</option>
                                                                    <option value="slack_msg">Slack Notification</option>
                                                                    <option value="http_request">HTTP Webhook / API Call</option>
                                                                    <option value="delay">Delay / Wait</option>
                                                                    <option value="condition">Conditional Logic</option>
                                                                    <option value="approval">Request Approval</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div>
                                                        <button
                                                            onClick={() => deleteStep(idx)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Step"
                                                        >
                                                            <AlertCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Connecting Line */}
                                                {idx < localSteps.length && (
                                                    <div className="flex justify-center h-6">
                                                        <div className="w-0.5 h-full bg-slate-300"></div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Add Step Button */}
                                        <button
                                            onClick={addStep}
                                            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Add Next Step
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-50">
                                            Workflow Settings
                                        </h3>
                                        <div className="space-y-4 text-sm">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 block mb-1">Description</label>
                                                <textarea
                                                    className="w-full text-sm border-slate-200 rounded-lg p-3 bg-slate-50 focus:ring-indigo-500 min-h-[100px]"
                                                    defaultValue={workflow?.description}
                                                    placeholder="Describe what this workflow does..."
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="lg:col-span-2 space-y-4">
                                {history.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 border-dashed">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Clock className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <h3 className="text-slate-900 font-bold">No runs yet</h3>
                                        <p className="text-sm text-slate-500">Run this workflow to see execution logs.</p>
                                    </div>
                                ) : (
                                    history.map((run) => (
                                        <div key={run.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    {run.status === 'completed' ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                                    )}
                                                    <span className="font-bold text-slate-900 text-sm">Execution #{run.id}</span>
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">{new Date(run.started_at).toLocaleString()}</span>
                                            </div>
                                            <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-x-auto">
                                                <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-slate-800 pb-2">
                                                    <Terminal className="w-3 h-3" />
                                                    Console Output
                                                </div>
                                                <pre className="whitespace-pre-wrap">{run.logs || "No logs available."}</pre>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-50">
                                        Run Statistics
                                    </h3>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Total Runs</span>
                                            <span className="font-bold text-slate-900">{workflow?.run_count}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Success Rate</span>
                                            <span className="font-bold text-green-600">100%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}

export default function WorkflowDetailPage({ params }: PageProps) {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading workflow...</div>}>
            <WorkflowDetailContent params={params} />
        </Suspense>
    );
}
