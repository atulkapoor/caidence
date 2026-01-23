"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TOOLS, MarcomTool } from "@/lib/marcom-tools";
import { ArrowLeft, Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_Base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ToolRunnerPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const tool = TOOLS.find((t) => t.id === slug);

    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string>("");
    const [copied, setCopied] = useState(false);

    if (!tool) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Tool Not Found</h1>
                    <button onClick={() => router.push("/marcom")} className="text-blue-600 hover:underline mt-4">
                        Back to Hub
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    const handleInputChange = (name: string, value: string) => {
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleGenerate = async () => {
        // Simple validation
        const missing = tool.inputs.find((i) => !formValues[i.name]);
        if (missing) {
            toast.error(`Please fill in ${missing.label}`);
            return;
        }

        setLoading(true);
        setResult("");

        try {
            const token = localStorage.getItem("token");
            const headers: any = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch(`${API_Base}/api/v1/marcom/generate`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    tool_id: tool.id,
                    inputs: formValues
                })
            });

            if (!res.ok) throw new Error("Failed to generate content");

            const data = await res.json();
            setResult(data.content);
            toast.success("Content generated successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Failed to generate content. Using mock fallback.");
            // Mock Fallback
            setTimeout(() => {
                setResult("1. " + tool.promptTemplate.replace("{product_name}", formValues["product_name"] || "Product") + " - Amazing Quality!\n2. Transform your life with " + (formValues["product_name"] || "this product") + ".\n3. The best choice for " + (formValues["audience"] || "you") + ".");
                toast.success("Content generated (Mock)!");
            }, 1000);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-6">
                <button
                    onClick={() => router.push("/marcom")}
                    className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Tools
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Input Form */}
                    <div className="col-span-1 lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-lg mb-4`}>
                                <tool.icon className="w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">{tool.title}</h1>
                            <p className="text-slate-500 text-sm mb-8">{tool.description}</p>

                            <div className="space-y-4">
                                {tool.inputs.map((input) => (
                                    <div key={input.name} className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">{input.label}</label>
                                        {input.type === "textarea" ? (
                                            <textarea
                                                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm min-h-[100px] resize-y"
                                                placeholder={input.placeholder}
                                                onChange={(e) => handleInputChange(input.name, e.target.value)}
                                            />
                                        ) : input.type === "select" ? (
                                            <select
                                                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                                onChange={(e) => handleInputChange(input.name, e.target.value)}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Select {input.label}</option>
                                                {input.options?.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                                placeholder={input.placeholder}
                                                onChange={(e) => handleInputChange(input.name, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ))}

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className={`w-full py-3 mt-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                                        bg-gradient-to-r ${tool.color} hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed
                                    `}
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    {loading ? "Generating..." : "Generate Content"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Output */}
                    <div className="col-span-1 lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden min-h-[500px]">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">Generated Result</h3>
                                {result && (
                                    <button
                                        onClick={copyToClipboard}
                                        className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? "Copied" : "Copy Text"}
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 p-8 bg-white overflow-y-auto">
                                {!result && !loading && (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                        <Sparkles className="w-16 h-16 mb-4 opacity-50" />
                                        <p className="font-medium">Fill the form and click generate</p>
                                    </div>
                                )}
                                {loading && (
                                    <div className="h-full flex flex-col items-center justify-center text-blue-600">
                                        <Loader2 className="w-12 h-12 animate-spin mb-4" />
                                        <p className="font-bold animate-pulse">AI is writing...</p>
                                    </div>
                                )}
                                {result && (
                                    <div className="prose prose-slate max-w-none whitespace-pre-wrap font-medium text-slate-700 leading-relaxed">
                                        {result}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
