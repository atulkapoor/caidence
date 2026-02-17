"use client";

import { useState, useEffect, Suspense } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Bot, UploadCloud, ChevronRight, Wand2, Loader2, AlertCircle } from "lucide-react";
import { StrategyResult } from "@/components/ai-agent/StrategyResult";
import { StrategyHistory } from "@/components/ai-agent/StrategyHistory";
import { useTabState } from "@/hooks/useTabState";
import { toast } from "sonner";
import { usePreferences } from "@/context/PreferencesContext";
import { getAuthHeaders } from "@/lib/api";
import { PermissionGate } from "@/components/rbac/PermissionGate";
import { AccessDenied } from "@/components/rbac/AccessDenied";

const AGENT_PLACEHOLDERS: Record<string, { project: string; objective: string }> = {
    "Technology": { project: "e.g. SaaS Product Launch", objective: "Describe product capabilities, user pain points, and launch goals..." },
    "Real Estate": { project: "e.g. Luxury Apartment Launch", objective: "Describe property features, target demographic, and key selling points..." },
    "E-Commerce": { project: "e.g. Seasonal Sale Campaign", objective: "Describe discount strategy, target segments, and featured products..." },
    "Healthcare": { project: "e.g. New Clinic Opening", objective: "Describe patient services, facility highlights, and community outreach goals..." }
};

const API_Base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function AIAgentContent() {
    const { industry } = usePreferences();
    const [step, setStep] = useState(1);
    const [dragging, setDragging] = useState(false);

    // Form State
    const [role, setRole] = useState("Marketing Manager");
    const [projectType, setProjectType] = useState("");
    const [objective, setObjective] = useState("");

    // Sync defaults with Industry
    useEffect(() => {
        if (!industry) return;

        switch (industry) {
            case "Real Estate":
                setRole("Real Estate Agent");
                setProjectType("Luxury Apartment Launch");
                break;
            case "Technology":
                setRole("Product Marketing Manager");
                setProjectType("SaaS Product Launch");
                break;
            case "E-Commerce":
                setRole("E-Commerce Manager");
                setProjectType("Seasonal Sale Campaign");
                break;
            case "Healthcare":
                setRole("Medical Practice Manager");
                setProjectType("New Clinic Opening");
                break;
        }
    }, [industry]);

    // Submitting State
    const [loading, setLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Asset State
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    const handleGenerate = async () => {
        if (!projectType || !objective) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const headers = await getAuthHeaders();

            // Read file contents to inject as context (since backend might ignore raw file assets)
            let contextFromFiles = "";
            for (const file of uploadedFiles) {
                if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
                    try {
                        const text = await file.text();
                        contextFromFiles += `\n\n[File: ${file.name}]\n${text.substring(0, 5000)}`;
                    } catch (e) {
                        console.warn("Failed to read file", file.name);
                    }
                }
            }

            const enhancedObjective = objective + (contextFromFiles ? `\n\nAdditional Context:${contextFromFiles}` : "");

            // Use relative path to leverage next.config.mjs rewrite
            const res = await fetch(`/api/v1/agent/generate`, {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({
                    role,
                    project_type: projectType,
                    objective: enhancedObjective,
                    assets: uploadedFiles.map(f => f.name) // Pass file names as metadata
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Failed to generate strategy: ${res.status} ${errText}`);
            }

            const data = await res.json();
            setResult(data);
            toast.success("Strategy generated!");

        } catch (error: any) {
            console.error("Strategy Generation Error:", error);
            const errorMessage = error.message || "Unknown error";

            toast.message("Backend Error. Using Demo Mode.", {
                description: `Failed: ${errorMessage.substring(0, 50)}. using cached strategy.`,
            });
            // Fallback for demo if backend fails or auth missing
            setResult({
                project_id: Math.floor(Math.random() * 1000) + 100, // Random ID for realism
                strategy: {
                    target_audience: [
                        { name: "Urban Professionals", description: "Age 25-40, Tech-savvy, High disposable income." },
                        { name: "Early Adopters", description: "Interested in the latest trends and innovations." }
                    ],
                    key_channels: ["LinkedIn", "Instagram", "Email Newsletter"],
                    content_ideas: [
                        { title: "Behind the Scenes", format: "Video Series", description: "Showcase the development process and team." },
                        { title: "User Success Stories", format: "Case Studies", description: "Highlight beneficial impact on early users." },
                        { title: "Feature Spotlight", format: "Carousel", description: "Deep dive into specific unique features." }
                    ],
                    strategic_recommendations: [
                        "Launch a referral program to leverage early adopters.",
                        "Collaborate with micro-influencers in the niche.",
                        "Focus on community building via LinkedIn groups."
                    ]
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);
            setUploadedFiles(prev => [...prev, ...newFiles]);
            toast.success(`Uploaded ${newFiles.length} files`);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setUploadedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const [activeTab, setActiveTab] = useTabState("new");
    const [selectedStrategy, setSelectedStrategy] = useState<any>(null);

    // If viewing a specific strategy (either just generated or selected from history)
    if (result || selectedStrategy) {
        return (
            <DashboardLayout>
                <div className="max-w-5xl mx-auto space-y-6">
                    <button
                        onClick={() => {
                            setResult(null);
                            setSelectedStrategy(null);
                            setActiveTab("history"); // Go back to history context usually
                        }}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm mb-4 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Agent
                    </button>
                    <StrategyResult
                        strategy={result ? result.strategy : selectedStrategy.strategy}
                        projectId={result ? result.project_id : selectedStrategy.id}
                    />
                </div>
            </DashboardLayout>
        );
    }



    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2">AI Marketing Agent</h1>
                        <p className="text-slate-500">Autonomous strategy generation and execution.</p>
                    </div>
                    <div className="flex p-1 bg-slate-100 rounded-lg">
                        <button
                            onClick={() => setActiveTab("new")}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "new"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"}`}
                        >
                            New Strategy
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "history"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"}`}
                        >
                            History
                        </button>
                    </div>
                </div>

                {activeTab === "history" ? (
                    <StrategyHistory onSelect={setSelectedStrategy} />
                ) : (
                    /* Wizard Card */
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-1"></div>

                        <div className="p-8">
                            {/* Loading State Overlay */}
                            {loading && (
                                <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center animate-in fade-in duration-300 backdrop-blur-sm">
                                    <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                                    <h3 className="text-2xl font-bold text-slate-900 animate-pulse">AI Agent is Thinking...</h3>
                                    <p className="text-slate-500 mt-2">Analyzing market data & formulating strategy</p>
                                </div>
                            )}

                            {/* Progress Steps */}
                            <div className="flex justify-between items-center mb-10 max-w-lg mx-auto">
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className="flex items-center">
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                                            ${step >= s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}
                                        `}>
                                            {s}
                                        </div>
                                        {s < 3 && (
                                            <div className={`h-1 w-20 mx-2 rounded-full ${step > s ? "bg-indigo-600" : "bg-slate-100"}`}></div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Your Professional Role</label>
                                        <select
                                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                        >
                                            <option>Real Estate Agent</option>
                                            <option>Marketing Manager</option>
                                            <option>Property Developer</option>
                                            <option>Agency Owner</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Project Type</label>
                                        <input
                                            type="text"
                                            placeholder={AGENT_PLACEHOLDERS[industry]?.project || "e.g. Luxury Apartment Launch"}
                                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-400"
                                            value={projectType}
                                            onChange={(e) => setProjectType(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex justify-between items-center">
                                        Marketing Objective
                                        <button
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                if (!objective.trim()) return;
                                                setIsEnhancing(true);
                                                try {
                                                    const { enhanceDescription } = await import("@/lib/api");
                                                    const enhanced = await enhanceDescription(objective);
                                                    setObjective(enhanced);
                                                    toast.success("Objective enhanced!");
                                                } catch (err) {
                                                    console.error("Enhance failed", err);
                                                }
                                                setIsEnhancing(false);
                                            }}
                                            disabled={isEnhancing || !objective.trim()}
                                            className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            {isEnhancing ? (
                                                <><div className="w-3 h-3 border border-indigo-600 border-t-transparent rounded-full animate-spin" /> Enhancing...</>
                                            ) : (
                                                <><Wand2 className="w-3 h-3" /> Enhance with AI</>
                                            )}
                                        </button>
                                    </label>
                                    <textarea
                                        className="w-full h-32 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none font-medium placeholder:text-slate-400"
                                        placeholder={AGENT_PLACEHOLDERS[industry]?.objective || "Describe your campaign goals, target audience, and key selling points..."}
                                        value={objective}
                                        onChange={(e) => setObjective(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Project Assets</label>
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => document.getElementById('asset-upload')?.click()}
                                        className={`
                                            border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative
                                            ${dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"}
                                        `}
                                    >
                                        <input
                                            type="file"
                                            id="asset-upload"
                                            multiple
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <UploadCloud className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-1">Upload Campaign Assets</h3>
                                        <p className="text-sm text-slate-500 mb-4">Drag & drop files or click to browse</p>
                                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Supports PDF, JPG, PNG, DOCX</div>

                                        {uploadedFiles.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                                {uploadedFiles.map((f, i) => (
                                                    <span key={i} className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-lg">
                                                        {f.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 flex justify-end">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    <Bot className="w-5 h-5" />
                                    {loading ? "Generating..." : "Generate Marketing Strategy"}
                                    {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default function AIAgentPage() {
    return (
        <PermissionGate require="ai_agent:read" fallback={<DashboardLayout><AccessDenied /></DashboardLayout>}>
            <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading AI Agent...</div>}>
                <AIAgentContent />
            </Suspense>
        </PermissionGate>
    );
}
