"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Sparkles, Zap, History, Copy, Linkedin, Twitter, FileText, Mail, Facebook, Instagram, Search, Wand2, StickyNote, PenTool, Plus, X, Calendar, ArrowRight, Maximize2, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { generateContent, generateDesign, fetchContentGenerations, ContentGeneration, saveContent, deleteContent } from "@/lib/api";
import { fetchCampaigns, Campaign } from "@/lib/api/campaigns";
import { useEffect, useState, Suspense } from "react";
import { useTabState } from "@/hooks/useTabState";
import { useModalScroll } from "@/hooks/useModalScroll";

// Implementation of Typewriter effect component
import { TypewriterEffect } from "@/components/ui/TypewriterEffect";
import { PermissionGate } from "@/components/rbac/PermissionGate";
import { AccessDenied } from "@/components/rbac/AccessDenied";

function ContentStudioContent() {
    // Form State
    const [title, setTitle] = useState("");
    const [campaignId, setCampaignId] = useState<number | null>(null);
    const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
    const [contentType, setContentType] = useState("Blog Post");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["LinkedIn"]);
    const [keywords, setKeywords] = useState("");
    const [prompt, setPrompt] = useState(""); // Content Brief
    const [writingExpert, setWritingExpert] = useState("General Marketing");
    const [length, setLength] = useState("Medium");
    const [webSearch, setWebSearch] = useState(false);
    const [selectedModel, setSelectedModel] = useState("Gemini")
    const [isGenerating, setIsGenerating] = useState(false);

    const [isEditMode, setIsEditMode] = useState(false);
    const [isEditId, setIsEditId] = useState<number | null>(null);

    const [recentCreations, setRecentCreations] = useState<ContentGeneration[]>([]);
    const [currentResponses, setCurrentResponses] = useState<{ platform: string, result: string, title: string, outputType: "text" | "image" }[]>([]);

    // Library State
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPlatform, setFilterPlatform] = useState("All Platforms");
    const [previewContent, setPreviewContent] = useState<ContentGeneration | null>(null);
    useModalScroll(!!previewContent);

    // Lists
    const platforms = [
        { id: "LinkedIn", icon: Linkedin, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
        { id: "Twitter", icon: Twitter, color: "text-sky-500", bg: "bg-sky-50", border: "border-sky-200" },
        { id: "Blog", icon: FileText, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
        { id: "Email", icon: Mail, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" },
        { id: "Facebook", icon: Facebook, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
        { id: "Instagram", icon: Instagram, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
    ];

    const contentTypes = ["Post", "Article", "Thread", "Caption", "Newsletter", "Ad Copy"];
    const experts = ["General Marketing", "SEO Specialist", "Copywriter", "Technical Writer", "Creative Storyteller", "Viral Tweeter"];


    // Load history and campaigns on mount
    useEffect(() => {
        loadHistory();
        loadCampaigns();

        // Check for edit mode
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        if (editId) {
            loadForEdit(parseInt(editId));
        }
    }, []);

    const loadForEdit = async (id: number) => {
        try {
            // We can fetch from API or find in history. Fetching is safer.
            // But we need to import fetchContentGenerationById which is not exported usually or available here.
            // Oh wait, I didn't import passing ID function here. Let's just find in history if possible or rely on loadHistory.
            // Better: use the new API function. I need to update imports first. 
            // Since I can't easily change imports in this block, I will rely on finding it in the loaded history for now or fetch it.
            // Let's use the API directly since I modified api.ts
            const { fetchContentGenerationById } = await import("@/lib/api");
            const item = await fetchContentGenerationById(id);
            if (item) {
                loadFromHistory(item);
                setIsEditMode(true);
                // Clear URL param
                window.history.replaceState({}, '', '/content-studio');
            }
        } catch (e) {
            console.error("Failed to load edit item", e);
        }
    };

    const loadHistory = async () => {
        try {
            const data = await fetchContentGenerations();
            setRecentCreations(data);
        } catch (error) {
            console.error("Failed to load history", error);
        }
    };

    const loadCampaigns = async () => {
        try {
            const data = await fetchCampaigns();
            setAvailableCampaigns(data);
        } catch (error) {
            console.error("Failed to load campaigns", error);
        }
    };

    const togglePlatform = (id: string) => {
        if (selectedPlatforms.includes(id)) {
            if (selectedPlatforms.length > 1) { // Prevent empty selection
                setSelectedPlatforms(selectedPlatforms.filter(p => p !== id));
            }
        } else {
            setSelectedPlatforms([...selectedPlatforms, id]);
        }
    };

    const handleEnhance = async () => {
        if (!prompt) return;
        const toastId = toast.loading("Enhancing brief...");
        try {
            const { getAuthHeaders } = await import("@/lib/api");
            // We can reuse the agent endpoint or a new one. Agent endpoint exists: /api/v1/agent/enhance_description
            const headers = await getAuthHeaders();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/agent/enhance_description`, {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({ text: prompt })
            });

            if (!res.ok) throw new Error("Enhancement failed");

            const data = await res.json();
            setPrompt(data.enhanced_text);
            toast.success("Brief enhanced!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to enhance text", { id: toastId });
        }
    };

    const handleGenerate = async () => {
        if (!prompt || !title) {
            toast.error("Please provide a Title and Content Brief");
            return;
        }
        setIsGenerating(true);
        setCurrentResponses([]);

        try {
            const isImageMode = selectedModel.toLowerCase().includes("nano");
            for (const platform of selectedPlatforms) {
                // Construct customized prompt for each platform
                const selectedCampaign = availableCampaigns.find(c => c.id === campaignId);
                const richPrompt = `
Context: Creating ${contentType} for ${platform}.
Campaign: ${selectedCampaign?.title || "None"}
Keywords: ${keywords || "None"}
Writing Style: ${writingExpert}
Web Search: ${webSearch ? "Enabled" : "Disabled"}

Content Brief:
${prompt}
                `.trim();

                if (isImageMode) {
                    const result = await generateDesign({
                        title: `${title} (${platform})`,
                        style: "Minimalist",
                        aspect_ratio: "1:1",
                        prompt: richPrompt,
                        model: selectedModel,
                    });

                    setCurrentResponses(prev => [...prev, {
                        platform: platform,
                        result: result.image_url || "",
                        title: result.title,
                        outputType: "image",
                    }]);
                } else {
                    const result = await generateContent({
                        title: `${title} (${platform})`,
                        platform: platform,
                        content_type: contentType,
                        prompt: richPrompt,
                        model: selectedModel,
                    });

                    setCurrentResponses(prev => [...prev, {
                        platform: platform,
                        result: result.result || "",
                        title: result.title,
                        outputType: "text",
                    }]);
                }
            }

            await loadHistory();
            toast.success(isImageMode ? "Image generated successfully!" : "Content generated successfully!");
        } catch (error: any) {
            console.error("Generation failed", error);
            toast.error(`Generation failed: ${error.message || "Unknown error"}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!title || currentResponses.length === 0) {
            toast.error("Nothing to save");
            return;
        }

        if (currentResponses.some((r) => r.outputType === "image")) {
            toast.error("Image output can't be saved in Content Library. Save it from Design Studio.");
            return;
        }

        const toastId = toast.loading(isEditMode ? "Updating content..." : "Saving content...");

        try {
            const selectedCampaign = availableCampaigns.find(
                c => c.id === campaignId
            );

            const richPrompt = `
Context: Creating ${contentType}
Campaign: ${selectedCampaign?.title || "None"}
Keywords: ${keywords || "None"}
Writing Style: ${writingExpert}
Web Search: ${webSearch ? "Enabled" : "Disabled"}

Content Brief:
${prompt}
        `.trim();

            const response = currentResponses[0]; // 🔥 SINGLE SOURCE OF TRUTH

            const saved = await saveContent({
                id: isEditMode ? isEditId : null, // 👈 THIS IS CRITICAL
                title: response.title,
                platform: response.platform,
                content_type: contentType,
                prompt: richPrompt,
                result: response.result,
            });

            if (!isEditMode && saved?.id) {
                setIsEditMode(true);
                setIsEditId(saved.id);
            }

            await loadHistory();
            toast.success(isEditMode ? "Content updated!" : "Content saved!", { id: toastId });

        } catch (err: any) {
            console.error(err);
            toast.error("Failed to save content", { id: toastId });
        }
    };

    const loadFromHistory = (item: ContentGeneration) => {
        setIsEditMode(true);
        setIsEditId(item.id);

        setTitle(item.title);
        setPrompt(item.prompt || "");
        setContentType(item.content_type);
        setSelectedPlatforms([item.platform]);

        setCurrentResponses([
            {
                platform: item.platform,
                result: item.result || "",
                title: item.title,
                outputType: "text",
            },
        ]);
    };

    const startNew = () => {
        setIsEditMode(false);
        setIsEditId(null);

        setTitle("");
        setPrompt("");
        setCurrentResponses([]);
        setSelectedPlatforms(["LinkedIn"]);
    };

    // @ts-ignore
    const [activeTab, setActiveTab] = useTabState("generator");

    // Filtered Creations
    const filteredCreations = recentCreations.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.result?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterPlatform === "All Platforms" || item.platform === filterPlatform;
        return matchesSearch && matchesFilter;
    });

    const models = [
        { id: "NanoBanana", label: "Nano Banana (Image)" },
        { id: "Gemini", label: "Gemini (Content)" },
    ];

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-48px)] flex flex-col bg-slate-100 relative">
                {/* Modal Overlay */}
                {previewContent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPreviewContent(null)}>
                        <div className="bg-white rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            {/* Content Section (Scrollable) */}
                            <div className="flex-1 bg-slate-50 p-8 overflow-y-auto custom-scrollbar relative">
                                <button
                                    onClick={() => setPreviewContent(null)}
                                    className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-full p-2 transition-colors border border-slate-200 shadow-sm z-10"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 min-h-full">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-6">{previewContent.title}</h2>
                                    <div className="prose prose-slate max-w-none whitespace-pre-wrap leading-relaxed text-slate-700">
                                        {previewContent.result}
                                    </div>
                                </div>
                            </div>

                            {/* Details Sidebar */}
                            <div className="w-80 bg-white border-l border-slate-100 p-6 flex flex-col gap-6 overflow-y-auto">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Details</h3>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Platform</span>
                                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                                {previewContent.platform === "LinkedIn" && <Linkedin className="w-3 h-3 text-blue-600" />}
                                                {previewContent.platform === "Twitter" && <Twitter className="w-3 h-3 text-sky-500" />}
                                                {previewContent.platform}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Created</span>
                                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(previewContent.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Type</span>
                                            <span className="text-xs font-bold text-slate-900">
                                                {previewContent.content_type}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-2">Original Context</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-40 overflow-y-auto custom-scrollbar">
                                        {previewContent.prompt}
                                    </p>
                                </div>

                                <div className="mt-auto flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            loadFromHistory(previewContent);
                                            setActiveTab("generator");
                                            setPreviewContent(null);
                                        }}
                                        className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <PenTool className="w-4 h-4" />
                                        Edit / Remix
                                    </button>
                                    <button
                                        onClick={() => {
                                            toast.success("Posted Functionally Pending!");
                                        }}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        Post
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(previewContent.result || "");
                                            // Optional: Show toast or feedback? For now just copy.
                                            alert("Content copied to clipboard!");
                                        }}
                                        className="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy Text
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex-none px-8 py-5 border-b border-slate-200 bg-white flex justify-between items-center z-10 sticky top-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                                <PenTool className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 leading-tight">Content Studio</h1>
                                <p className="text-xs text-slate-500 font-medium">Create viral content in seconds</p>
                            </div>
                        </div>

                        {/* TAB SWITCHER */}
                        <div className="flex p-1 bg-slate-100 rounded-lg ml-6">
                            <button
                                onClick={() => setActiveTab("generator")}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "generator"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"}`}
                            >
                                Generator
                            </button>
                            <button
                                onClick={() => setActiveTab("library")}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "library"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"}`}
                            >
                                Content Library
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="text-xs font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-violet-500 outline-none"
                        >
                            {models.map((model) => (
                                <option key={model.id} value={model.id}>
                                    {model.label}
                                </option>
                            ))}
                        </select>

                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden relative">

                    {/* GENERATOR TAB */}
                    {activeTab === "generator" && (
                        <div className="h-full grid grid-cols-1 lg:grid-cols-12">
                            {/* LEFT PANEL: Inputs */}
                            <div className="lg:col-span-5 h-full overflow-y-auto border-r border-slate-200 bg-white p-6 custom-scrollbar">
                                <div className="max-w-xl mx-auto space-y-8">
                                    {/* ... Input Sections (Platforms, Details, Brief) ... */}
                                    {/* REUSING EXISTING INPUT SECTIONS HERE WOULD BE DUPLICATED CODE IF NOT CAREFUL. 
                                        Since I am replacing the whole return block, I must ensure the input sections are preserved relative to my Replace call.
                                        However, replace_file_content is replacing a BLOCK. I need to be careful not to delete the inputs logic I just added.
                                        
                                        Wait, I am replacing from line 170 (Layout start) to the end.
                                        I need to recreate the WHOLE render structure.
                                    */}

                                    {/* 1. Platform Selection */}
                                    <section className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">1</div>
                                                Choose Platform(s)
                                            </h2>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">Multi-select enabled</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {platforms.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => togglePlatform(p.id)}
                                                    className={`relative p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 group ${selectedPlatforms.includes(p.id)
                                                        ? `bg-white ${p.border} ring-2 ring-violet-500 ring-offset-1 shadow-md`
                                                        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}
                                                >
                                                    <div className={`p-2 rounded-lg ${p.bg} ${p.color} transition-transform group-hover:scale-110`}>
                                                        <p.icon className="w-5 h-5" />
                                                    </div>
                                                    <span className={`text-xs font-bold ${selectedPlatforms.includes(p.id) ? 'text-slate-800' : 'text-slate-500'}`}>{p.id}</span>
                                                    {selectedPlatforms.includes(p.id) && (
                                                        <div className="absolute top-2 right-2 w-2 h-2 bg-violet-600 rounded-full"></div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    {/* 2. Content Details (Enhanced) */}
                                    <section className="space-y-4">
                                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">2</div>
                                            Define Content
                                        </h2>
                                        <div className="space-y-4">
                                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your content a title..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 font-bold text-slate-800" />

                                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                                {contentTypes.map((type) => (
                                                    <button key={type} onClick={() => setContentType(type)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${contentType === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{type}</button>
                                                ))}
                                            </div>

                                            <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Keywords (e.g. AI, automation)..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none" />

                                            <div className="grid grid-cols-2 gap-4">
                                                <select
                                                    value={campaignId || ""}
                                                    onChange={(e) => setCampaignId(e.target.value ? Number(e.target.value) : null)}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                                                >
                                                    <option value="">No Campaign</option>
                                                    {availableCampaigns.map(c => (
                                                        <option key={c.id} value={c.id}>{c.title}</option>
                                                    ))}
                                                </select>
                                                <select value={writingExpert} onChange={(e) => setWritingExpert(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"><option value="General Marketing">General Marketing</option>{experts.map(e => <option key={e} value={e}>{e}</option>)}</select>
                                            </div>

                                            {/* Length */}
                                            <div className="grid grid-cols-3 gap-2">
                                                {["Short", "Medium", "Long"].map((len) => (
                                                    <button key={len} onClick={() => setLength(len)} className={`py-2 rounded-lg text-xs font-bold border transition-colors ${length === len ? 'bg-violet-50 text-violet-600 border-violet-200' : 'bg-white text-slate-500 border-slate-200'}`}>{len}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    {/* 3. The Brief */}
                                    <section className="space-y-4">
                                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">3</div>
                                            The Brief
                                        </h2>
                                        <div className="relative group">
                                            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe what you want to create..." className="w-full h-40 p-4 pb-12 bg-white border-2 border-slate-200 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none resize-none font-medium"></textarea>
                                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg cursor-pointer" onClick={() => setWebSearch(!webSearch)}>
                                                    <div className={`w-2 h-2 rounded-full ${webSearch ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                    <span className="text-xs font-bold text-slate-600">Web Search {webSearch ? 'ON' : 'OFF'}</span>
                                                </div>
                                                <button onClick={handleEnhance} disabled={!prompt} className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 text-violet-600 text-xs font-bold rounded-lg hover:bg-violet-100 disabled:opacity-50"><Wand2 className="w-3 h-3" /> Enhance</button>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Generate Button */}
                                    <div className="pt-4 sticky bottom-0 bg-white/95 backdrop-blur-sm pb-2">
                                        <button onClick={handleGenerate} disabled={isGenerating || !prompt || !title || selectedPlatforms.length === 0} className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-violet-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70">
                                            {isGenerating ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Generating...</> : <><Zap className="w-5 h-5 fill-white" />Generate Content</>}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT PANEL: Live Canvas */}
                            <div className="lg:col-span-7 h-full bg-slate-100 p-6 sm:p-8 overflow-y-auto">
                                {(currentResponses.length > 0) ? (
                                    <div className="max-w-3xl mx-auto space-y-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <button onClick={startNew} className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:bg-white px-3 py-1.5 rounded-lg transition-all"><Plus className="w-4 h-4" /> New Project</button>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSave}
                                                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-50 shadow-sm flex items-center gap-2"
                                                >
                                                    <Sparkles className="w-3 h-3 text-amber-400" /> Save All
                                                </button>
                                            </div>
                                        </div>
                                        {currentResponses.map((response, idx) => (
                                            <div key={idx} className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                                                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500">
                                                            {isGenerating ? (
                                                                <Sparkles className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <FileText className="w-4 h-4" />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <h3 className="text-sm font-bold text-slate-900">
                                                                {isGenerating ? "Writing..." : response.title}
                                                            </h3>
                                                            <p className="text-xs text-slate-500">{response.platform}</p>
                                                        </div>
                                                    </div>

                                                    {/* ✅ BUTTON GROUP */}
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => navigator.clipboard.writeText(response.result)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-violet-600 border border-slate-200 rounded-lg bg-white">
                                                            <Copy className="w-3 h-3" />
                                                            Copy
                                                        </button>

                                                        <button onClick={async () => await handleSave()} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md shadow-indigo-200 transition-all">
                                                            <Save className="w-3 h-3" />
                                                            {isEditMode ? "Update" : "Save"}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-8 prose prose-slate max-w-none">
                                                    {isGenerating ? (
                                                        <div className="space-y-4 animate-pulse">
                                                            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                                            <div className="h-4 bg-slate-100 rounded"></div>
                                                        </div>
                                                    ) : response.outputType === "image" ? (
                                                        <img
                                                            src={response.result}
                                                            alt={response.title}
                                                            className="w-full rounded-xl border border-slate-200"
                                                        />
                                                    ) : (
                                                        <TypewriterEffect text={response.result} className="text-slate-700" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    /* Empty State for Generator */
                                    <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                        <div className="w-20 h-20 bg-violet-50 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                                            <Sparkles className="w-10 h-10 text-violet-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Create?</h3>
                                        <p className="text-slate-500 max-w-md">Configure your content on the left, and watch the magic happen here. I can write for LinkedIn, Twitter, Blogs, and more!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* LIBRARY TAB */}
                    {activeTab === "library" && (
                        <div className="h-full overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                            <div className="mx-auto">
                                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Content Library</h2>
                                        <p className="text-slate-500">Your past generations and drafts.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search content..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none w-full md:w-64"
                                            />
                                        </div>
                                        <select
                                            value={filterPlatform}
                                            onChange={(e) => setFilterPlatform(e.target.value)}
                                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
                                        >
                                            <option value="All Platforms">All Platforms</option>
                                            {platforms.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredCreations.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setPreviewContent(item)}
                                            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/50 transition-all cursor-pointer group flex flex-col h-[280px] relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors border ${item.platform === 'LinkedIn' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    item.platform === 'Twitter' ? 'bg-sky-50 text-sky-500 border-sky-100' :
                                                        item.platform === 'Blog' ? 'bg-orange-50 text-orange-500 border-orange-100' :
                                                            'bg-slate-50 text-slate-500 border-slate-100'
                                                    }`}>
                                                    {item.platform}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-900 mb-3 line-clamp-2 leading-tight group-hover:text-violet-600 transition-colors">{item.title}</h3>
                                            <div className="flex-1 overflow-hidden relative mb-4">
                                                <p className="text-xs text-slate-500 leading-relaxed font-medium opacity-80 line-clamp-6">
                                                    {item.result}
                                                </p>
                                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-auto">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        loadFromHistory(item);
                                                        setActiveTab("generator");
                                                    }}
                                                    className="flex-1 text-xs font-bold text-slate-600 hover:text-violet-600 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <PenTool className="w-3 h-3" /> Edit
                                                </button>
                                                <div className="w-px h-4 bg-slate-200"></div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewContent(item);
                                                    }}
                                                    className="flex-1 text-xs font-bold text-slate-600 hover:text-violet-600 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    View <ArrowRight className="w-3 h-3" />
                                                </button>
                                                <div className="w-px h-4 bg-slate-200"></div>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();

                                                        if (!confirm("Are you sure you want to delete this content?")) return;

                                                        const toastId = toast.loading("Deleting...");

                                                        try {
                                                            await deleteContent(item.id);
                                                            await loadHistory();
                                                            toast.success("Content deleted successfully", { id: toastId });
                                                        } catch (error) {
                                                            console.error(error);
                                                            toast.error("Failed to delete content", { id: toastId });
                                                        }
                                                    }}
                                                    className="px-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                                                    title="Delete"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredCreations.length === 0 && (
                                        <div className="col-span-full py-20 text-center">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <History className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 font-medium">No content found matching your search.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function ContentStudioPage() {
    return (
        <PermissionGate require="content:read" fallback={<DashboardLayout><AccessDenied /></DashboardLayout>}>
            <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading studio...</div>}>
                <ContentStudioContent />
            </Suspense>
        </PermissionGate>
    );
}
