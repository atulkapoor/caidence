import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Check, X, Loader2 } from "lucide-react";
import { CampaignDraft, generateCampaignPlan, createCampaign } from "@/lib/api";
import { TypewriterEffect } from "@/components/ui/TypewriterEffect";
import { useModalScroll } from "@/hooks/useModalScroll";

interface AgentWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AgentWizard({ isOpen, onClose, onSuccess }: AgentWizardProps) {
    useModalScroll(isOpen);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Inputs
    const [goal, setGoal] = useState("");
    const [product, setProduct] = useState("");
    const [audience, setAudience] = useState("");

    // Result
    const [draft, setDraft] = useState<CampaignDraft | null>(null);

    const handleGenerate = async () => {
        if (!goal || !product || !audience) return;
        setLoading(true);
        try {
            // @ts-ignore
            const { generateCampaignPlan } = await import("@/lib/api");
            const plan = await generateCampaignPlan(goal, product, audience);
            setDraft(plan);
            setStep(2);
        } catch (error) {
            console.error("Agent failed", error);
            alert("Failed to generate plan. Ensure Backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!draft) return;
        setLoading(true);
        try {
            // @ts-ignore
            const { createCampaign } = await import("@/lib/api");
            await createCampaign({
                title: draft.title,
                description: draft.description,
                status: "draft"
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Creation failed", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                            <Sparkles className="w-6 h-6 text-yellow-300" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">AI Campaign Agent</h2>
                            <p className="text-violet-100 text-sm">Let me design a strategy for you.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {step === 1 ? (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">What is your main goal?</label>
                                <input
                                    autoFocus
                                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all outline-none font-medium placeholder:font-normal"
                                    placeholder="e.g. Drive traffic to website, Increase brand awareness..."
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">What are you promoting?</label>
                                <input
                                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all outline-none font-medium placeholder:font-normal"
                                    placeholder="e.g. New Organic Coffee Line, Holi Sale..."
                                    value={product}
                                    onChange={(e) => setProduct(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Who is your target audience?</label>
                                <input
                                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all outline-none font-medium placeholder:font-normal"
                                    placeholder="e.g. Young professionals in Mumbai, Fitness enthusiasts..."
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={!goal || !product || !audience || loading}
                                    className="flex-1 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" /> Analyzing Strategy...
                                        </>
                                    ) : (
                                        <>
                                            Generate Campaign Plan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 text-indigo-200">
                                    <Sparkles className="w-24 h-24 opacity-20" />
                                </div>
                                <h3 className="text-lg font-bold text-indigo-900 mb-4 relative z-10">Proposed Strategy</h3>

                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Campaign Title</div>
                                        <div className="text-xl font-bold text-indigo-950">{draft?.title}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Strategic Approach</div>
                                        <div className="text-sm font-medium text-indigo-800 leading-relaxed bg-white/50 p-3 rounded-lg border border-indigo-100/50">
                                            {draft?.description && <TypewriterEffect text={draft.description} />}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Est. Budget</div>
                                            <div className="font-bold text-indigo-900">{draft?.budget}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Channels</div>
                                            <div className="flex flex-wrap gap-1">
                                                {draft?.channels.map((c, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white rounded-md text-xs font-bold text-indigo-600 border border-indigo-100">{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Modify Inputs
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    Approve & Create
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
