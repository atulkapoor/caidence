"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { generateDesign, fetchDesignAssets, DesignAsset, enhanceDescription } from "@/lib/api";
import { useEffect, useState, Suspense } from "react";
import { useTabState } from "@/hooks/useTabState";
// import Link from "next/link"; // Unused
import { toast } from "sonner";
import { Palette, Wand2, Image as ImageIcon, Maximize2, Upload, Sparkles, Search, Download, Eye, MoreHorizontal, LayoutGrid, ListFilter, X, Calendar, ArrowRight } from "lucide-react";

function DesignStudioContent() {
    // @ts-ignore
    const [activeTab, setActiveTab] = useTabState("generate");

    // Generator State
    const [title, setTitle] = useState("New Visual");
    const [prompt, setPrompt] = useState("");
    const [selectedStyle, setSelectedStyle] = useState("Photorealistic");
    const [aspectRatio, setAspectRatio] = useState("16:9");
    const [brandColors, setBrandColors] = useState(""); // Text input
    const [referenceImage, setReferenceImage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [recentDesigns, setRecentDesigns] = useState<DesignAsset[]>([]);

    // Library State
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("All Types");
    const [previewDesign, setPreviewDesign] = useState<DesignAsset | null>(null);

    const filteredDesigns = recentDesigns.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.prompt.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "All Types" || d.style === typeFilter; // Assuming style maps roughly to type for now, or just filtering by style
        return matchesSearch && matchesType;
    });

    useEffect(() => {
        loadDesigns();
        // Check for edit mode
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        if (editId) loadForEdit(parseInt(editId));
    }, []);

    const loadForEdit = async (id: number) => {
        try {
            const { fetchDesignAssetById } = await import("@/lib/api");
            const asset = await fetchDesignAssetById(id);
            if (asset) {
                setPrompt(asset.prompt);
                setSelectedStyle(asset.style);
                setTitle(asset.title);
                setAspectRatio(asset.aspect_ratio || "16:9");
                setBrandColors(asset.brand_colors || "");
                setActiveTab("generate");
                window.history.replaceState({}, '', '/design-studio');
                toast.success("Design loaded for editing");
            }
        } catch (e) {
            console.error("Failed to load edit asset", e);
            toast.error("Failed to load design for editing");
        }
    };

    const loadDesigns = async () => {
        try {
            const data = await fetchDesignAssets();
            setRecentDesigns(data);
        } catch (error) {
            console.error("Failed to load designs", error);
            // toast.error("Failed to load design library"); // Optional: don't spam on load
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        setActiveTab("library"); // Switch immediately for better UX

        try {
            const newDesign = await generateDesign({
                title: title || "Untitled Design",
                style: selectedStyle,
                aspect_ratio: aspectRatio,
                prompt: prompt,
                brand_colors: brandColors,
                reference_image: referenceImage
            });
            setRecentDesigns((prev) => [newDesign, ...prev]);
            toast.success("Design generated successfully!");
        } catch (error) {
            console.error("Failed to generate design", error);
            toast.error("Failed to generate design. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const styles = ["Photorealistic", "3D Render", "Minimalist", "Cyberpunk", "Watercolor", "Sketch", "Abstract", "Corporate"];
    const ratios = ["16:9", "1:1", "9:16", "4:3"];


    const handleDownload = async (url: string, title: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-design.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
            // Fallback for same-origin or if fetch fails (though fetch failure means link likely won't work either)
            const link = document.createElement('a');
            link.href = url;
            link.target = "_blank";
            link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-design.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-48px)] flex flex-col bg-slate-100 relative">
                {/* Modal Overlay */}
                {previewDesign && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPreviewDesign(null)}>
                        <div className="bg-white rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            {/* Image Section */}
                            <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 relative">
                                <img
                                    src={previewDesign.image_url}
                                    alt={previewDesign.title}
                                    className="max-w-full max-h-[85vh] object-contain shadow-md rounded-lg"
                                />
                                <button
                                    onClick={() => setPreviewDesign(null)}
                                    className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Details Sidebar */}
                            <div className="w-80 bg-white border-l border-slate-100 p-6 flex flex-col gap-6 overflow-y-auto">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{previewDesign.title || "Untitled Design"}</h3>
                                    <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                                        <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(previewDesign.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200 flex items-center gap-1">
                                            <Maximize2 className="w-3 h-3" />
                                            {previewDesign.aspect_ratio || "16:9"}
                                        </span>
                                        <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200 uppercase">
                                            {previewDesign.style}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-2">Prompt</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        {previewDesign.prompt}
                                    </p>
                                </div>

                                {previewDesign.brand_colors && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 mb-2">Brand Colors</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: previewDesign.brand_colors }}></div>
                                            <span className="text-sm text-slate-600">{previewDesign.brand_colors}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            setPrompt(previewDesign.prompt);
                                            setSelectedStyle(previewDesign.style);
                                            setTitle(previewDesign.title);
                                            setAspectRatio(previewDesign.aspect_ratio || "16:9");
                                            setBrandColors(previewDesign.brand_colors || "");
                                            setActiveTab("generate");
                                            setPreviewDesign(null);
                                        }}
                                        className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Palette className="w-4 h-4" />
                                        Remix Design
                                    </button>
                                    <button
                                        onClick={() => handleDownload(previewDesign.image_url, previewDesign.title)}
                                        className="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download PNG
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
                            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
                                <Palette className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 leading-tight">Design Studio</h1>
                                <p className="text-xs text-slate-500 font-medium">Create stunning visuals in seconds</p>
                            </div>
                        </div>

                        {/* TAB SWITCHER */}
                        <div className="flex p-1 bg-slate-100 rounded-lg ml-6">
                            <button onClick={() => setActiveTab("generate")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "generate" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Generate Designs</button>
                            <button onClick={() => setActiveTab("library")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "library" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Design Library</button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">

                    {/* GENERATE TAB */}
                    {activeTab === "generate" && (
                        <div className="max-w-3xl mx-auto space-y-8 pb-20">

                            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
                                {/* Design Name */}
                                <div className="space-y-4">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">1</span>
                                        Project Details
                                    </h2>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Design Name</label>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:font-normal"
                                                placeholder="e.g. Summer Campaign Hero"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Campaign (Optional)</label>
                                            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-slate-500">
                                                <option>Select a campaign...</option>
                                                <option>Summer Launch 2024</option>
                                                <option>Q3 Brand Awareness</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-slate-100"></div>

                                {/* Configuration */}
                                <div className="space-y-4">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">2</span>
                                        Visual Settings
                                    </h2>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Design Type / Size</label>
                                            <select
                                                value={aspectRatio}
                                                onChange={(e) => setAspectRatio(e.target.value)}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                                            >
                                                {ratios.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Visual Style</label>
                                            <select
                                                value={selectedStyle}
                                                onChange={(e) => setSelectedStyle(e.target.value)}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                                            >
                                                {styles.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Brand Colors (Optional)</label>
                                            <input
                                                type="text"
                                                value={brandColors}
                                                onChange={(e) => setBrandColors(e.target.value)}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:font-normal"
                                                placeholder="e.g. #FF0000, Navy Blue"
                                            />
                                        </div>
                                        {/* Reference Image Placeholder */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Reference Image</label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setReferenceImage(reader.result as string);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    id="reference-image-upload"
                                                />
                                                <div className={`w-full p-3 border-2 border-dashed rounded-xl text-sm font-medium flex items-center justify-center transition-colors h-[50px] ${referenceImage ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}>
                                                    {referenceImage ? (
                                                        <div className="flex items-center gap-2">
                                                            <img src={referenceImage} alt="Reference" className="w-6 h-6 rounded object-cover" />
                                                            <span className="text-xs">Image uploaded</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setReferenceImage("");
                                                                }}
                                                                className="text-red-500 hover:text-red-700 ml-2"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Upload className="w-4 h-4" />
                                                            <span>Click or drop to upload</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-slate-100"></div>

                                {/* Prompt */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">3</span>
                                            Design Brief
                                        </h2>
                                        <button
                                            onClick={async () => {
                                                if (!prompt) return;
                                                setIsEnhancing(true);
                                                try {
                                                    const enhanced = await enhanceDescription(prompt);
                                                    setPrompt(enhanced);
                                                } catch (e) {
                                                    console.error("Enhance failed", e);
                                                }
                                                setIsEnhancing(false);
                                            }}
                                            disabled={isEnhancing || !prompt}
                                            className="text-xs font-bold text-rose-600 flex items-center gap-1 hover:text-rose-700 transition-colors disabled:opacity-50"
                                        >
                                            {isEnhancing ? (
                                                <><div className="w-3 h-3 border border-rose-600 border-t-transparent rounded-full animate-spin" /> Enhancing...</>
                                            ) : (
                                                <><Sparkles className="w-3 h-3" /> Enhance Prompt</>
                                            )}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium resize-none leading-relaxed placeholder:font-normal"
                                            placeholder="Describe your visual concept in detail..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center justify-end">
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !prompt}
                                    className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-200 transition-transform active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2 text-lg"
                                >
                                    {isGenerating ? (
                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Generating...</>
                                    ) : (
                                        <><Wand2 className="w-5 h-5" /> Generate AI Design</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* LIBRARY TAB */}
                    {activeTab === "library" && (
                        <div className="max-w-7xl mx-auto space-y-8">
                            {/* Header & Filters */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Design Library</h2>
                                    <p className="text-slate-500">Manage and organize your visual assets.</p>
                                </div>
                                <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search designs..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-4 py-2 w-64 text-sm font-medium bg-transparent focus:outline-none"
                                        />
                                    </div>
                                    <div className="w-px h-6 bg-slate-200"></div>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="px-3 py-2 text-sm font-bold text-slate-600 bg-transparent focus:outline-none cursor-pointer hover:text-slate-900"
                                    >
                                        <option>All Types</option>
                                        <option>Photorealistic</option>
                                        <option>3D Render</option>
                                        <option>Minimalist</option>
                                        <option>Cyberpunk</option>
                                        <option>Watercolor</option>
                                        <option>Sketch</option>
                                    </select>
                                </div>
                            </div>

                            {/* Grid Content */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {/* Skeleton Loading Card */}
                                {isGenerating && (
                                    <div className="group flex flex-col bg-white rounded-2xl border border-rose-200 shadow-xl overflow-hidden animate-pulse">
                                        <div className="aspect-[4/3] bg-rose-50 relative flex items-center justify-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
                                                <div className="text-sm font-bold text-rose-500 uppercase tracking-wider animate-pulse">
                                                    Developing {selectedStyle === 'Photorealistic' ? 'Photo' : selectedStyle}...
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 flex flex-col gap-3">
                                            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                            <div className="w-full h-px bg-slate-50 my-2"></div>
                                            <div className="flex justify-between">
                                                <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                                                <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {filteredDesigns.length > 0 ? (
                                    filteredDesigns.map((asset) => (
                                        <div key={asset.id} className="group flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                                            {/* Image Preview */}
                                            <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden cursor-pointer" onClick={() => setPreviewDesign(asset)}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={asset.image_url}
                                                    onError={(e) => {
                                                        // @ts-ignore - Hide broken image and show parent bg
                                                        e.target.style.display = "none";
                                                    }}
                                                    alt={asset.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>

                                                {/* Overlay Actions */}
                                                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreviewDesign(asset);
                                                        }}
                                                        className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                                                        title="Preview"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(asset.image_url, asset.title);
                                                        }}
                                                        className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Type Badge */}
                                                <div className="absolute top-3 left-3">
                                                    <span className="px-2.5 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                        {asset.style}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <div className="p-5 flex flex-col gap-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-rose-600 transition-colors cursor-pointer" onClick={() => setPreviewDesign(asset)}>{asset.title || "Untitled Design"}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                                {new Date(asset.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                                {asset.aspect_ratio || "16:9"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-full h-px bg-slate-100"></div>

                                                <div className="flex items-center justify-between">
                                                    <button
                                                        onClick={() => {
                                                            setPrompt(asset.prompt);
                                                            setSelectedStyle(asset.style);
                                                            setTitle(asset.title);
                                                            setAspectRatio(asset.aspect_ratio || "16:9");
                                                            setActiveTab("generate");
                                                        }}
                                                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                                                    >
                                                        <Wand2 className="w-3 h-3" /> Remix
                                                    </button>

                                                    {/* Pinned Action - View Details */}
                                                    <button
                                                        onClick={() => setPreviewDesign(asset)}
                                                        className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                                                    >
                                                        View <ArrowRight className="w-3 h-3" />
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm("Delete this design?")) {
                                                                setRecentDesigns(prev => prev.filter(p => p.id !== asset.id));
                                                                toast.success("Design deleted");
                                                            }
                                                        }}
                                                        className="text-slate-400 hover:text-red-500 transition-colors ml-4"
                                                        title="Delete"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ImageIcon className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">No designs found</h3>
                                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">Get started by generating your first AI visual in the Generate tab.</p>
                                        <button onClick={() => setActiveTab("generate")} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all">
                                            Start Creating
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}

export default function DesignStudioPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading studio...</div>}>
            <DesignStudioContent />
        </Suspense>
    );
}

