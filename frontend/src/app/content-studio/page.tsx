"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Sparkles, Zap, History, Copy, Linkedin, Twitter, FileText, Mail, Facebook, Instagram, Search, Wand2, StickyNote, PenTool, Plus, X, Calendar, ArrowRight, Maximize2, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { generateContent, generateDesign, fetchContentGenerations, ContentGeneration, saveContent, deleteContent } from "@/lib/api";
import { getConnectionStatus, publishSocialPost, publishToLinkedIn, type PublishPostResponse } from "@/lib/api/social";
import { fetchCampaigns, Campaign } from "@/lib/api/campaigns";
import { useEffect, useState, Suspense } from "react";
import { useTabState } from "@/hooks/useTabState";
import { useModalScroll } from "@/hooks/useModalScroll";

import { PermissionGate } from "@/components/rbac/PermissionGate";
import { AccessDenied } from "@/components/rbac/AccessDenied";

function ContentStudioContent() {
    type GeneratedResponse = {
        contentId?: number | null,
        platform: string,
        result: string,
        imageUrl?: string | null,
        brandColors?: string | null,
        generateWithImage?: boolean,
        title: string,
        outputType: "text" | "image"
    };

    // Form State
    const [title, setTitle] = useState("");
    const [campaignId, setCampaignId] = useState<number | null>(null);
    const [pendingCampaignTitle, setPendingCampaignTitle] = useState<string | null>(null);
    const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
    const [contentType, setContentType] = useState("Blog Post");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["LinkedIn"]);
    const [keywords, setKeywords] = useState("");
    const [prompt, setPrompt] = useState(""); // Content Brief
    const [writingExpert, setWritingExpert] = useState("General Marketing");
    const [length, setLength] = useState("Medium");
    const [webSearch, setWebSearch] = useState(false);
    const [selectedModel, setSelectedModel] = useState("Gemini")
    const [generateWithImage, setGenerateWithImage] = useState(false);
    const [brandColors, setBrandColors] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const [isEditMode, setIsEditMode] = useState(false);
    const [isEditId, setIsEditId] = useState<number | null>(null);

    const [recentCreations, setRecentCreations] = useState<ContentGeneration[]>([]);
    const [currentResponses, setCurrentResponses] = useState<GeneratedResponse[]>([]);
    const [postingPreview, setPostingPreview] = useState(false);
    const [postingIndex, setPostingIndex] = useState<number | null>(null);
    const [postedPreviewByContentId, setPostedPreviewByContentId] = useState<Record<number, string>>({});
    const [postedIndices, setPostedIndices] = useState<Record<number, string>>({});
    const [postedContentIds, setPostedContentIds] = useState<Set<number>>(new Set());

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
    const knownPlatforms = ["LinkedIn", "Twitter", "Blog", "Email", "Facebook", "Instagram"];

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const stripPlatformSuffixes = (rawTitle: string) => {
        let normalized = (rawTitle || "").trim();
        let changed = true;

        while (changed) {
            changed = false;
            for (const platform of knownPlatforms) {
                const suffixRegex = new RegExp(`\\s*\\(${escapeRegExp(platform)}\\)\\s*$`, "i");
                if (suffixRegex.test(normalized)) {
                    normalized = normalized.replace(suffixRegex, "").trim();
                    changed = true;
                }
            }
        }

        return normalized;
    };

    const withPlatformSuffix = (rawTitle: string, platform: string) => {
        const baseTitle = stripPlatformSuffixes(rawTitle);
        return `${baseTitle} (${platform})`;
    };

    const parseSavedPrompt = (rawPrompt: string) => {
        const source = (rawPrompt || "").trim();
        if (!source) {
            return {
                parsed: false,
                contentType: "",
                campaignTitle: null as string | null,
                keywords: "",
                writingStyle: "",
                webSearch: false,
                brief: "",
            };
        }

        const contextMatch = source.match(/^Context:\s*Creating\s+(.+)$/im);
        const campaignMatch = source.match(/^Campaign:\s*(.+)$/im);
        const keywordsMatch = source.match(/^Keywords:\s*(.+)$/im);
        const writingStyleMatch = source.match(/^Writing Style:\s*(.+)$/im);
        const webSearchMatch = source.match(/^Web Search:\s*(.+)$/im);
        const briefMatch = source.match(/Content Brief:\s*([\s\S]*)$/im);

        const parsedContentType = (contextMatch?.[1] || "").replace(/\s+for\s+.+$/i, "").trim();
        const parsedCampaignTitleRaw = (campaignMatch?.[1] || "").trim();
        const parsedCampaignTitle = parsedCampaignTitleRaw && parsedCampaignTitleRaw.toLowerCase() !== "none"
            ? parsedCampaignTitleRaw
            : null;
        const parsedKeywordsRaw = (keywordsMatch?.[1] || "").trim();
        const parsedKeywords = parsedKeywordsRaw.toLowerCase() === "none" ? "" : parsedKeywordsRaw;
        const parsedWritingStyle = (writingStyleMatch?.[1] || "").trim();
        const parsedWebSearch = ((webSearchMatch?.[1] || "").trim().toLowerCase() === "enabled");
        const parsedBrief = (briefMatch?.[1] || "").trim();

        const parsed =
            Boolean(contextMatch) ||
            Boolean(campaignMatch) ||
            Boolean(keywordsMatch) ||
            Boolean(writingStyleMatch) ||
            Boolean(webSearchMatch) ||
            Boolean(briefMatch);

        return {
            parsed,
            contentType: parsedContentType,
            campaignTitle: parsedCampaignTitle,
            keywords: parsedKeywords,
            writingStyle: parsedWritingStyle,
            webSearch: parsedWebSearch,
            brief: parsedBrief,
        };
    };


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

    useEffect(() => {
        if (!pendingCampaignTitle || campaignId !== null || availableCampaigns.length === 0) {
            return;
        }
        const matchedCampaign = availableCampaigns.find(
            (campaign) => campaign.title.trim().toLowerCase() === pendingCampaignTitle.trim().toLowerCase()
        );
        if (matchedCampaign) {
            setCampaignId(matchedCampaign.id);
        }
        setPendingCampaignTitle(null);
    }, [availableCampaigns, pendingCampaignTitle, campaignId]);

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
            const persistedPostedIds = data.filter((item) => item.is_posted).map((item) => item.id);
            setPostedContentIds(new Set(persistedPostedIds));
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/agent/enhance_description`, {
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
        setPostedPreviewByContentId({});
        setPostedIndices({});

        try {
            const isImageMode = selectedModel.toLowerCase().includes("nano");
            const selectedCampaign = availableCampaigns.find(c => c.id === campaignId);
            const baseRichPrompt = `
Context: Creating ${contentType} for Social Media.
Campaign: ${selectedCampaign?.title || "None"}
Keywords: ${keywords || "None"}
Writing Style: ${writingExpert}
Web Search: ${webSearch ? "Enabled" : "Disabled"}

Content Brief:
${prompt}
            `.trim();

            if (!isImageMode && selectedPlatforms.length > 1) {
                const baseTitle = stripPlatformSuffixes(title);
                const baseResult = await generateContent({
                    title: baseTitle,
                    platform: "General",
                    content_type: contentType,
                    prompt: baseRichPrompt,
                    model: selectedModel,
                    generate_with_image: generateWithImage,
                    brand_colors: generateWithImage ? brandColors : undefined,
                });

                const sharedImageUrl = baseResult.image_url || null;
                for (const platform of selectedPlatforms) {
                    const platformTitle = withPlatformSuffix(title, platform);
                    const adapted = await generateContent({
                        title: platformTitle,
                        platform,
                        content_type: contentType,
                        prompt: baseRichPrompt,
                        model: selectedModel,
                        adapt_from_base: true,
                        base_result: baseResult.result || "",
                        image_url: sharedImageUrl || undefined,
                        generate_with_image: false,
                        brand_colors: generateWithImage ? brandColors : undefined,
                    });

                    setCurrentResponses(prev => [...prev, {
                        contentId: null,
                        platform,
                        result: adapted.result || baseResult.result || "",
                        imageUrl: sharedImageUrl,
                        brandColors: adapted.brand_colors || baseResult.brand_colors || null,
                        generateWithImage: generateWithImage,
                        title: withPlatformSuffix(adapted.title || platformTitle, platform),
                        outputType: "text",
                    }]);
                }
            } else {
                for (const platform of selectedPlatforms) {
                    const platformTitle = withPlatformSuffix(title, platform);
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
                            title: platformTitle,
                            style: "Minimalist",
                            aspect_ratio: "1:1",
                            prompt: richPrompt,
                            model: selectedModel,
                        });

                        setCurrentResponses(prev => [...prev, {
                            contentId: null,
                            platform: platform,
                            result: result.image_url || "",
                            title: withPlatformSuffix(result.title || platformTitle, platform),
                            outputType: "image",
                        }]);
                    } else {
                        const result = await generateContent({
                            title: platformTitle,
                            platform: platform,
                            content_type: contentType,
                            prompt: richPrompt,
                            model: selectedModel,
                            generate_with_image: generateWithImage,
                            brand_colors: generateWithImage ? brandColors : undefined,
                        });

                        setCurrentResponses(prev => [...prev, {
                            contentId: null,
                            platform: platform,
                            result: result.result || "",
                            imageUrl: result.image_url || null,
                            brandColors: result.brand_colors || null,
                            generateWithImage: Boolean(result.generate_with_image),
                            title: withPlatformSuffix(result.title || platformTitle, platform),
                            outputType: "text",
                        }]);
                    }
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

    const buildRichPrompt = () => {
        const selectedCampaign = availableCampaigns.find(
            c => c.id === campaignId
        );

        return `
Context: Creating ${contentType}
Campaign: ${selectedCampaign?.title || "None"}
Keywords: ${keywords || "None"}
Writing Style: ${writingExpert}
Web Search: ${webSearch ? "Enabled" : "Disabled"}
Generate With Image: ${generateWithImage ? "Yes" : "No"}
Brand Colors: ${generateWithImage ? (brandColors || "Not specified") : "N/A"}

Content Brief:
${prompt}
        `.trim();
    };

    const handleSaveResponse = async (response: GeneratedResponse) => {
        if (response.outputType === "image") {
            throw new Error("Image output can't be saved in Content Library. Save it from Design Studio.");
        }

        return await saveContent({
            id: response.contentId ?? (isEditMode && currentResponses.length === 1 ? isEditId : null),
            title: withPlatformSuffix(response.title, response.platform),
            platform: response.platform,
            content_type: contentType,
            prompt: buildRichPrompt(),
            result: response.result,
            image_url: response.imageUrl || null,
            brand_colors: response.brandColors || null,
            generate_with_image: Boolean(response.generateWithImage),
        });
    };

    const isResponsePosted = (response: GeneratedResponse, idx: number) =>
        Boolean(postedIndices[idx] || (response.contentId ? postedContentIds.has(response.contentId) : false));

    const normalizeHexColor = (value?: string | null) =>
        /^#[0-9A-Fa-f]{6}$/.test((value || "").trim()) ? (value as string) : "#7c3aed";

    const markContentPostedLocally = (contentId: number | null | undefined, targetName?: string) => {
        if (!contentId) return;
        setPostedContentIds((prev) => {
            const next = new Set(prev);
            next.add(contentId);
            return next;
        });
        setRecentCreations((prev) =>
            prev.map((item) =>
                item.id === contentId
                    ? {
                        ...item,
                        is_posted: true,
                        posted_at: new Date().toISOString(),
                        posted_target_name: targetName || item.posted_target_name || item.platform,
                    }
                    : item
            )
        );
        setPreviewContent((prev) =>
            prev && prev.id === contentId
                ? {
                    ...prev,
                    is_posted: true,
                    posted_at: new Date().toISOString(),
                    posted_target_name: targetName || prev.posted_target_name || prev.platform,
                }
                : prev
        );
    };

    const ensureContentIdForPosting = async (
        response: GeneratedResponse,
        idx: number,
    ): Promise<number | null> => {
        if (response.contentId) {
            return response.contentId;
        }
        if (response.outputType === "image") {
            return null;
        }

        const saved = await handleSaveResponse(response);
        const savedId = saved?.id ?? null;
        setCurrentResponses((prev) =>
            prev.map((item, itemIdx) =>
                itemIdx === idx
                    ? {
                        ...item,
                        contentId: saved.id,
                        title: saved.title,
                        platform: saved.platform,
                        result: saved.result || item.result,
                        imageUrl: saved.image_url || item.imageUrl || null,
                        brandColors: saved.brand_colors || item.brandColors || null,
                        generateWithImage: Boolean(saved.generate_with_image),
                    }
                    : item
            )
        );
        if (savedId && currentResponses.length === 1) {
            setIsEditMode(true);
            setIsEditId(savedId);
        }
        await loadHistory();
        return savedId;
    };

    const handleSave = async () => {
        if (!title || currentResponses.length === 0) {
            toast.error("Nothing to save");
            return;
        }
        if (currentResponses.some((response, idx) => isResponsePosted(response, idx))) {
            toast.error("Posted content is read-only. Create new content to make changes.");
            return;
        }

        if (currentResponses.some((r) => r.outputType === "image")) {
            toast.error("Image output can't be saved in Content Library. Save it from Design Studio.");
            return;
        }

        const toastId = toast.loading(isEditMode ? "Updating content..." : "Saving content...");
        try {
            const updatedResponses = [...currentResponses];
            let savedCount = 0;
            let firstError: string | null = null;
            const newlyPostedContentIds: number[] = [];

            for (let idx = 0; idx < currentResponses.length; idx++) {
                try {
                    const saved = await handleSaveResponse(currentResponses[idx]);
                    updatedResponses[idx] = {
                        ...updatedResponses[idx],
                        contentId: saved.id,
                        title: saved.title,
                        platform: saved.platform,
                        result: saved.result || updatedResponses[idx].result,
                        imageUrl: saved.image_url || updatedResponses[idx].imageUrl || null,
                        brandColors: saved.brand_colors || updatedResponses[idx].brandColors || null,
                        generateWithImage: Boolean(saved.generate_with_image),
                    };
                    if (postedIndices[idx] && saved?.id) {
                        newlyPostedContentIds.push(saved.id);
                    }
                    savedCount += 1;
                } catch (err: any) {
                    if (!firstError) {
                        firstError = err?.message || "Failed to save one of the responses.";
                    }
                }
            }

            if (savedCount === 0) {
                throw new Error(firstError || "Failed to save content");
            }

            setCurrentResponses(updatedResponses);
            if (updatedResponses.length === 1 && updatedResponses[0].contentId) {
                setIsEditMode(true);
                setIsEditId(updatedResponses[0].contentId ?? null);
            }
            if (newlyPostedContentIds.length > 0) {
                setPostedContentIds((prev) => {
                    const next = new Set(prev);
                    newlyPostedContentIds.forEach((id) => next.add(id));
                    return next;
                });
            }

            await loadHistory();
            if (savedCount === currentResponses.length) {
                toast.success(isEditMode ? "Content updated!" : "Content saved for selected platforms!", { id: toastId });
            } else {
                toast.error(`Saved ${savedCount}/${currentResponses.length}. ${firstError || ""}`.trim(), { id: toastId });
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || "Failed to save content", { id: toastId });
        }
    };

    const handlePost = async (
        platform: string,
        text: string,
        imageUrl?: string,
        contentId?: number | null,
    ): Promise<PublishPostResponse | null> => {
        if (!text?.trim()) {
            toast.error("Nothing to post");
            return null;
        }

        const platformKey = platform.toLowerCase();
        if (!["linkedin", "facebook", "instagram"].includes(platformKey)) {
            toast.error(`Direct publishing currently supports LinkedIn, Facebook, and Instagram only. "${platform}" is not supported yet.`);
            return null;
        }
        if (platformKey === "instagram" && !imageUrl) {
            toast.error("Instagram posting requires an image output (public URL)");
            return null;
        }
        if (platformKey === "instagram" && imageUrl && !/^https?:\/\//i.test(imageUrl)) {
            toast.error("Instagram needs a public image URL. Save image to a public URL first.");
            return null;
        }

        const status = await getConnectionStatus(platformKey);
        if (!status.connected) {
            toast.error(`Connect ${platform} in Onboarding or Settings before posting`);
            return null;
        }

        const toastId = toast.loading(`Posting to ${platform}...`);
        try {
            const result = platformKey === "linkedin" && imageUrl?.startsWith("data:")
                ? await publishToLinkedIn({
                    text,
                    image_data_url: imageUrl,
                    content_id: contentId ?? undefined,
                })
                : await publishSocialPost(platformKey, text, imageUrl, contentId ?? undefined);
            if (!result.published) {
                throw new Error(`Unexpected ${platform} publish response`);
            }
            if (contentId) {
                markContentPostedLocally(contentId, result.target_name || platform);
                await loadHistory();
            }
            toast.success(`Posted to ${result.target_name || platform}`, { id: toastId });
            return result;
        } catch (error: any) {
            toast.error(error?.message || `Failed to post to ${platform}`, { id: toastId });
            return null;
        }
    };

    const handleSaveSingle = async (response: GeneratedResponse, idx: number) => {
        if (isResponsePosted(response, idx)) {
            toast.error("Posted content is read-only. Create new content to make changes.");
            return;
        }
        const toastId = toast.loading(isEditMode ? "Updating content..." : "Saving content...");
        try {
            const saved = await handleSaveResponse(response);
            setCurrentResponses((prev) =>
                prev.map((item, itemIdx) =>
                    itemIdx === idx
                        ? {
                            ...item,
                            contentId: saved.id,
                            title: saved.title,
                            platform: saved.platform,
                            result: saved.result || item.result,
                            imageUrl: saved.image_url || item.imageUrl || null,
                            brandColors: saved.brand_colors || item.brandColors || null,
                            generateWithImage: Boolean(saved.generate_with_image),
                        }
                        : item
                )
            );
            if (saved?.id && currentResponses.length === 1) {
                setIsEditMode(true);
                setIsEditId(saved.id);
            }
            if (postedIndices[idx] && saved?.id) {
                setPostedContentIds((prev) => {
                    const next = new Set(prev);
                    next.add(saved.id);
                    return next;
                });
            }
            await loadHistory();
            toast.success(isEditMode ? "Content updated!" : "Content saved!", { id: toastId });
        } catch (err: any) {
            toast.error(err?.message || "Failed to save content", { id: toastId });
        }
    };

    const loadFromHistory = (item: ContentGeneration) => {
        const parsedPrompt = parseSavedPrompt(item.prompt || "");
        const matchedCampaign = parsedPrompt.campaignTitle
            ? availableCampaigns.find((campaign) => campaign.title.trim().toLowerCase() === parsedPrompt.campaignTitle!.trim().toLowerCase())
            : null;

        setIsEditMode(true);
        setIsEditId(item.id);

        setTitle(stripPlatformSuffixes(item.title));
        setPrompt(parsedPrompt.parsed ? (parsedPrompt.brief || "") : (item.prompt || ""));
        setContentType(parsedPrompt.contentType || item.content_type || "Post");
        setKeywords(parsedPrompt.parsed ? parsedPrompt.keywords : "");
        setWritingExpert(parsedPrompt.parsed ? (parsedPrompt.writingStyle || "General Marketing") : "General Marketing");
        setWebSearch(parsedPrompt.parsed ? parsedPrompt.webSearch : false);
        setCampaignId(matchedCampaign?.id ?? null);
        setPendingCampaignTitle(matchedCampaign ? null : parsedPrompt.campaignTitle);
        setSelectedPlatforms([item.platform]);
        setGenerateWithImage(Boolean(item.generate_with_image));
        setBrandColors(item.brand_colors || "");

        setCurrentResponses([
            {
                contentId: item.id,
                platform: item.platform,
                result: item.result || "",
                imageUrl: item.image_url || null,
                brandColors: item.brand_colors || null,
                generateWithImage: Boolean(item.generate_with_image),
                title: withPlatformSuffix(item.title, item.platform),
                outputType: "text",
            },
        ]);
        if (item.is_posted) {
            setPostedContentIds((prev) => {
                const next = new Set(prev);
                next.add(item.id);
                return next;
            });
        }
        setPostedPreviewByContentId({});
        setPostedIndices({});
    };

    const startNew = () => {
        setIsEditMode(false);
        setIsEditId(null);

        setTitle("");
        setPrompt("");
        setCurrentResponses([]);
        setSelectedPlatforms(["LinkedIn"]);
        setGenerateWithImage(false);
        setBrandColors("");
        setPendingCampaignTitle(null);
        setPostedPreviewByContentId({});
        setPostedIndices({});
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
                                    {previewContent.image_url && (
                                        <img
                                            src={previewContent.image_url}
                                            alt={previewContent.title}
                                            className="w-full rounded-xl border border-slate-200 mb-6"
                                        />
                                    )}
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
                                            if (previewContent.is_posted) {
                                                toast.info("Posted content is view-only.");
                                                return;
                                            }
                                            loadFromHistory(previewContent);
                                            setActiveTab("generator");
                                            setPreviewContent(null);
                                        }}
                                        disabled={previewContent.is_posted}
                                        className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <PenTool className="w-4 h-4" />
                                        {previewContent.is_posted ? "View Only (Posted)" : "Edit / Remix"}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                setPostingPreview(true);
                                                const publishResult = await handlePost(
                                                    previewContent.platform,
                                                    previewContent.result || "",
                                                    previewContent.image_url || undefined,
                                                    previewContent.id,
                                                );
                                                if (publishResult?.published) {
                                                    setPostedPreviewByContentId((prev) => ({
                                                        ...prev,
                                                        [previewContent.id]: publishResult.target_name || previewContent.platform,
                                                    }));
                                                    markContentPostedLocally(
                                                        previewContent.id,
                                                        publishResult.target_name || previewContent.platform,
                                                    );
                                                }
                                            } catch (error: any) {
                                                toast.error(error?.message || `Failed to post to ${previewContent.platform}`);
                                            } finally {
                                                setPostingPreview(false);
                                            }
                                        }}
                                        disabled={postingPreview || previewContent.is_posted}
                                        className="w-full py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 disabled:opacity-60"
                                    >
                                        <Send className="w-4 h-4" />
                                        {postingPreview
                                            ? "Posting..."
                                            : previewContent.is_posted || postedContentIds.has(previewContent.id) || postedPreviewByContentId[previewContent.id]
                                                ? `Posted to ${previewContent.platform}`
                                                : `Post to ${previewContent.platform}`}
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
                                onClick={() => {
                                    if (activeTab !== "generator") {
                                        startNew();
                                    }
                                    setActiveTab("generator");
                                }}
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

                                            {!selectedModel.toLowerCase().includes("nano") && (
                                                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={generateWithImage}
                                                            onChange={(e) => setGenerateWithImage(e.target.checked)}
                                                            className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                                        />
                                                        Generate with image
                                                    </label>
                                                    {generateWithImage && (
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="color"
                                                                value={normalizeHexColor(brandColors)}
                                                                onChange={(e) => setBrandColors(e.target.value)}
                                                                className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                                                                title="Pick brand color"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={normalizeHexColor(brandColors)}
                                                                onChange={(e) => setBrandColors(e.target.value)}
                                                                placeholder="#7c3aed"
                                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
                                                    disabled={currentResponses.some((response, idx) => isResponsePosted(response, idx))}
                                                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-50 shadow-sm flex items-center gap-2 disabled:opacity-50"
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

                                                        <button
                                                            onClick={async () => {
                                                                if (isResponsePosted(response, idx)) {
                                                                    toast.info("This content is already posted and is view-only.");
                                                                    return;
                                                                }
                                                                try {
                                                                    setPostingIndex(idx);
                                                                    let contentIdForPost = response.contentId ?? null;
                                                                    if (!contentIdForPost && response.outputType !== "image") {
                                                                        contentIdForPost = await ensureContentIdForPosting(response, idx);
                                                                    }
                                                                    const publishResult = await handlePost(
                                                                        response.platform,
                                                                        response.result,
                                                                        response.outputType === "image"
                                                                            ? response.result
                                                                            : response.imageUrl || undefined,
                                                                        contentIdForPost,
                                                                    );
                                                                    if (publishResult?.published) {
                                                                        setPostedIndices((prev) => ({
                                                                            ...prev,
                                                                            [idx]: publishResult.target_name || response.platform,
                                                                        }));
                                                                        markContentPostedLocally(
                                                                            contentIdForPost,
                                                                            publishResult.target_name || response.platform,
                                                                        );
                                                                    }
                                                                } catch (error: any) {
                                                                    toast.error(error?.message || `Failed to post to ${response.platform}`);
                                                                } finally {
                                                                    setPostingIndex(null);
                                                                }
                                                            }}
                                                            disabled={postingIndex === idx || isResponsePosted(response, idx)}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md shadow-emerald-200 transition-all disabled:opacity-50"
                                                        >
                                                            <Send className="w-3 h-3" />
                                                            {postingIndex === idx
                                                                ? "Posting..."
                                                                : isResponsePosted(response, idx)
                                                                    ? `Posted to ${response.platform}`
                                                                    : "Post"}
                                                        </button>

                                                        <button
                                                            onClick={async () => await handleSaveSingle(response, idx)}
                                                            disabled={isResponsePosted(response, idx)}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
                                                        >
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
                                                        <div className="space-y-2">
                                                            {response.imageUrl && (
                                                                <img
                                                                    src={response.imageUrl}
                                                                    alt={response.title}
                                                                    className="w-full rounded-xl border border-slate-200 mb-3"
                                                                />
                                                            )}
                                                            {!isResponsePosted(response, idx) && (
                                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                    Edit before posting
                                                                </p>
                                                            )}
                                                            <textarea
                                                                value={response.result}
                                                                onChange={(e) =>
                                                                    setCurrentResponses((prev) =>
                                                                        prev.map((item, itemIdx) =>
                                                                            itemIdx === idx ? { ...item, result: e.target.value } : item
                                                                        )
                                                                    )
                                                                }
                                                                disabled={isResponsePosted(response, idx)}
                                                                className="w-full min-h-[240px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed resize-y outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-slate-100 disabled:text-slate-500"
                                                            />
                                                        </div>
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
                                                {!item.is_posted && (
                                                    <>
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
                                                    </>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewContent(item);
                                                    }}
                                                    className="flex-1 text-xs font-bold text-slate-600 hover:text-violet-600 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    View <ArrowRight className="w-3 h-3" />
                                                </button>
                                                {item.is_posted && (
                                                    <>
                                                        <div className="w-px h-4 bg-slate-200"></div>
                                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Posted
                                                        </span>
                                                    </>
                                                )}
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
