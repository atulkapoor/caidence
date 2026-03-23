"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Sparkles, Zap, History, Copy, Linkedin, Twitter, FileText, Mail, Facebook, Instagram, Search, Wand2, StickyNote, PenTool, Plus, X, Calendar, ArrowRight, Maximize2, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { generateContent, fetchContentGenerations, fetchContentGenerationsPage, ContentGeneration, saveContent, deleteContent, enhanceDescription, fetchBrands, fetchWhatsAppContacts, type Brand, type WhatsAppContact } from "@/lib/api";
import { getConnectionStatus, publishSocialPost, publishToLinkedIn, publishToWhatsApp, scheduleSocialPost, type PublishPostResponse } from "@/lib/api/social";
import { fetchCampaigns, Campaign } from "@/lib/api/campaigns";
import { useEffect, useRef, useState, Suspense } from "react";
import { useTabState } from "@/hooks/useTabState";
import { useModalScroll } from "@/hooks/useModalScroll";
import { ScheduledPostsCalendar } from "@/components/social/ScheduledPostsCalendar";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

import { PermissionGate } from "@/components/rbac/PermissionGate";
import { AccessDenied } from "@/components/rbac/AccessDenied";
import { usePermissionContext } from "@/contexts/PermissionContext";

function ContentStudioContent() {
    const { hasPermission, data } = usePermissionContext();
    const granted = data?.permissions || [];
    const hasContentStudioModelPermissions = granted.some(
        (perm) => perm === "*:*" || perm.startsWith("content_studio:")
    );
    // Prefer "content_studio" for Content Studio module RBAC; fallback to legacy "content".
    const contentPermissionResource = hasContentStudioModelPermissions ? "content_studio" : "content";
    const canContentCreate = hasPermission(`${contentPermissionResource}:create`);
    const canContentWrite =
        hasPermission(`${contentPermissionResource}:write`) ||
        hasPermission(`${contentPermissionResource}:update`);
    const canContentDelete = hasPermission(`${contentPermissionResource}:delete`);
    const canUseGenerator = canContentCreate;
    const canEditExistingContent = canContentWrite;
    const isContentReadOnly = !canContentCreate && !canContentWrite;
    type GeneratedResponse = {
        contentId?: number | null,
        platform: string,
        result: string,
        imageUrl?: string | null,
        brandColors?: string | null,
        generateWithImage?: boolean,
        title: string,
        outputType: "text" | "image",
        brandId?: number | null
    };

    // @ts-ignore
    const [activeTab, setActiveTab] = useTabState("generator");

    // Form State
    const [title, setTitle] = useState("");
    const [campaignId, setCampaignId] = useState<number | null>(null);
    const [pendingCampaignTitle, setPendingCampaignTitle] = useState<string | null>(null);
    const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
    const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
    const [contentType, setContentType] = useState("Blog Post");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["LinkedIn"]);
    const [keywords, setKeywords] = useState("");
    const [prompt, setPrompt] = useState(""); // Content Brief
    const [writingExpert, setWritingExpert] = useState("General Marketing");
    const [length, setLength] = useState("Medium");
    const [webSearch, setWebSearch] = useState(false);
    const [selectedModel, setSelectedModel] = useState("qwen2.5:0.5b")
    const [generateWithImage, setGenerateWithImage] = useState(false);
    const [brandColors, setBrandColors] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const [isEditMode, setIsEditMode] = useState(false);
    const [isEditId, setIsEditId] = useState<number | null>(null);

    const [recentCreations, setRecentCreations] = useState<ContentGeneration[]>([]);
    const [deletedContentIds, setDeletedContentIds] = useState<Set<number>>(new Set());
    const [currentResponses, setCurrentResponses] = useState<GeneratedResponse[]>([]);
    const [postingPreview, setPostingPreview] = useState(false);
    const [postingIndex, setPostingIndex] = useState<number | null>(null);
    const [postedPreviewByContentId, setPostedPreviewByContentId] = useState<Record<number, string>>({});
    const [postedIndices, setPostedIndices] = useState<Record<number, string>>({});
    const [postedContentIds, setPostedContentIds] = useState<Set<number>>(new Set());
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [scheduleDateTime, setScheduleDateTime] = useState("");
    const [scheduling, setScheduling] = useState(false);
    const [scheduleDraft, setScheduleDraft] = useState<{
        title: string;
        platform: string;
        text: string;
        imageUrl?: string;
        contentId?: number | null;
        brandId?: number | null;
    } | null>(null);
    const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
    const [whatsAppRecipients, setWhatsAppRecipients] = useState("");
    const [isWhatsAppSending, setIsWhatsAppSending] = useState(false);
    const [whatsAppScheduleDateTime, setWhatsAppScheduleDateTime] = useState("");
    const [isWhatsAppScheduling, setIsWhatsAppScheduling] = useState(false);
    const [whatsAppDraft, setWhatsAppDraft] = useState<{
        title: string;
        text: string;
        contentId?: number | null;
        brandId?: number | null;
        imageUrl?: string;
        responseIndex?: number | null;
        mode?: "send" | "schedule";
    } | null>(null);
    const [whatsAppContacts, setWhatsAppContacts] = useState<WhatsAppContact[]>([]);
    const [selectedCrmNumbers, setSelectedCrmNumbers] = useState<string[]>([]);

    // Library State
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPlatform, setFilterPlatform] = useState("All Platforms");
    const [previewContent, setPreviewContent] = useState<ContentGeneration | null>(null);
    const [isLibraryLoading, setIsLibraryLoading] = useState(false);
    const [libraryPage, setLibraryPage] = useState(1);
    const [totalLibraryItems, setTotalLibraryItems] = useState(0);
    const scheduleInputRef = useRef<HTMLInputElement | null>(null);
    const whatsAppScheduleInputRef = useRef<HTMLInputElement | null>(null);
    useModalScroll(!!previewContent || isScheduleOpen || isWhatsAppOpen);
    const LIBRARY_PAGE_SIZE = 12;

    // Lists
    const platforms = [
        { id: "LinkedIn", icon: Linkedin, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
        { id: "Twitter", icon: Twitter, color: "text-sky-500", bg: "bg-sky-50", border: "border-sky-200" },
        { id: "Blog", icon: FileText, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
        { id: "Email", icon: Mail, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" },
        { id: "Facebook", icon: Facebook, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
        { id: "Instagram", icon: Instagram, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
        { id: "WhatsApp", icon: WhatsAppIcon, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    ];

    const contentTypes = ["Post", "Article", "Thread", "Caption", "Newsletter", "Ad Copy"];
    const experts = ["General Marketing", "SEO Specialist", "Copywriter", "Technical Writer", "Creative Storyteller", "Viral Tweeter"];
    const knownPlatforms = ["LinkedIn", "Twitter", "Blog", "Email", "Facebook", "Instagram", "WhatsApp"];
    const getBrandName = (brandId?: number | null) =>
        availableBrands.find((brand) => brand.id === brandId)?.name || null;

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
                brandName: null as string | null,
                keywords: "",
                writingStyle: "",
                webSearch: false,
                brief: "",
            };
        }

        const contextMatch = source.match(/^Context:\s*Creating\s+(.+)$/im);
        const campaignMatch = source.match(/^Campaign:\s*(.+)$/im);
        const brandMatch = source.match(/^Brand:\s*(.+)$/im);
        const keywordsMatch = source.match(/^Keywords:\s*(.+)$/im);
        const writingStyleMatch = source.match(/^Writing Style:\s*(.+)$/im);
        const webSearchMatch = source.match(/^Web Search:\s*(.+)$/im);
        const briefMatch = source.match(/Content Brief:\s*([\s\S]*)$/im);

        const parsedContentType = (contextMatch?.[1] || "").replace(/\s+for\s+.+$/i, "").trim();
        const parsedCampaignTitleRaw = (campaignMatch?.[1] || "").trim();
        const parsedCampaignTitle = parsedCampaignTitleRaw && parsedCampaignTitleRaw.toLowerCase() !== "none"
            ? parsedCampaignTitleRaw
            : null;
        const parsedBrandRaw = (brandMatch?.[1] || "").trim();
        const parsedBrandName = parsedBrandRaw && parsedBrandRaw.toLowerCase() !== "none"
            ? parsedBrandRaw
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
            brandName: parsedBrandName,
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
        loadBrands();
        loadWhatsAppContacts();

        // Check for edit mode
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        if (editId) {
            loadForEdit(parseInt(editId));
        }
    }, []);

    useEffect(() => {
        setLibraryPage(1);
    }, [searchQuery, filterPlatform]);

    useEffect(() => {
        if (activeTab === "library") {
            loadHistory(true);
        }
    }, [activeTab, libraryPage, searchQuery, filterPlatform]);

    useEffect(() => {
        if (activeTab === "generator" && !canUseGenerator) {
            setActiveTab("library");
        }
    }, [activeTab, canUseGenerator, setActiveTab]);

    useEffect(() => {
        if (isEditMode && !canEditExistingContent) {
            setIsEditMode(false);
            setIsEditId(null);
        }
    }, [isEditMode, canEditExistingContent]);

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

    const loadHistory = async (showLoader = activeTab === "library") => {
        if (showLoader) {
            setIsLibraryLoading(true);
        }
        try {
            if (activeTab === "library") {
                const { items, total } = await fetchContentGenerationsPage({
                    skip: (libraryPage - 1) * LIBRARY_PAGE_SIZE,
                    limit: LIBRARY_PAGE_SIZE,
                    q: searchQuery || undefined,
                    platform: filterPlatform,
                });
                setRecentCreations(items);
                setTotalLibraryItems(total);
                const persistedPostedIds = items.filter((item) => item.is_posted).map((item) => item.id);
                setPostedContentIds(new Set(persistedPostedIds));
                return;
            }

            const data = await fetchContentGenerations({ skip: 0, limit: 30 });
            setRecentCreations((prev) => {
                const incomingIds = new Set(data.map((item) => item.id));
                const preservedPosted = prev.filter(
                    (item) =>
                        item.is_posted &&
                        !incomingIds.has(item.id) &&
                        !deletedContentIds.has(item.id)
                );
                return [...data, ...preservedPosted];
            });
            const persistedPostedIds = data.filter((item) => item.is_posted).map((item) => item.id);
            setPostedContentIds(new Set(persistedPostedIds));
            setTotalLibraryItems(data.length);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            if (showLoader) {
                setIsLibraryLoading(false);
            }
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

    const loadBrands = async () => {
        try {
            const data = await fetchBrands();
            setAvailableBrands(data);
            if (selectedBrandId && !data.find((b) => b.id === selectedBrandId && b.is_active)) {
                setSelectedBrandId(null);
            }
        } catch (error) {
            console.error("Failed to load brands", error);
        }
    };

    const loadWhatsAppContacts = async () => {
        try {
            const data = await fetchWhatsAppContacts();
            setWhatsAppContacts(data);
        } catch {
            setWhatsAppContacts([]);
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
            const enhanced = await enhanceDescription(prompt, selectedModel);
            setPrompt(enhanced);
            toast.success("Brief enhanced!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to enhance text", { id: toastId });
        }
    };

    const handleGenerate = async () => {
        if (!canUseGenerator) {
            toast.error("You don't have create access for Content generator");
            return;
        }
        if (!prompt || !title) {
            toast.error("Please provide a Title and Content Brief");
            return;
        }
        setIsGenerating(true);
        setCurrentResponses([]);
        setPostedPreviewByContentId({});
        setPostedIndices({});

        try {
            const selectedCampaign = availableCampaigns.find(c => c.id === campaignId);
            const selectedBrandName = getBrandName(selectedBrandId);
            const baseRichPrompt = `
Context: Creating ${contentType} for Social Media.
Campaign: ${selectedCampaign?.title || "None"}
Brand: ${selectedBrandName || "None"}
Keywords: ${keywords || "None"}
Writing Style: ${writingExpert}
Web Search: ${webSearch ? "Enabled" : "Disabled"}

Content Brief:
${prompt}
            `.trim();

            if (selectedPlatforms.length > 1) {
                const baseTitle = stripPlatformSuffixes(title);
                const baseResult = await generateContent({
                    title: baseTitle,
                    platform: "General",
                    content_type: contentType,
                    prompt: baseRichPrompt,
                    model: selectedModel,
                    generate_with_image: generateWithImage,
                    brand_colors: generateWithImage ? toHexColorOrNull(brandColors) ?? undefined : undefined,
                    brand_id: selectedBrandId ?? undefined,
                });

                const sharedImageUrl = baseResult.image_url || null;
                const adaptedResponses = await Promise.all(selectedPlatforms.map(async (platform) => {
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
                        brand_colors: generateWithImage ? toHexColorOrNull(brandColors) ?? undefined : undefined,
                        brand_id: selectedBrandId ?? undefined,
                    });

                    return {
                        contentId: null,
                        platform,
                        result: adapted.result || baseResult.result || "",
                        imageUrl: sharedImageUrl,
                        brandColors: adapted.brand_colors || baseResult.brand_colors || null,
                        generateWithImage: generateWithImage,
                        title: withPlatformSuffix(adapted.title || platformTitle, platform),
                        outputType: "text",
                        brandId: selectedBrandId ?? null,
                    } as GeneratedResponse;
                }));
                setCurrentResponses(adaptedResponses);
            } else {
                const generatedResponses = await Promise.all(selectedPlatforms.map(async (platform) => {
                    const platformTitle = withPlatformSuffix(title, platform);
                    const richPrompt = `
Context: Creating ${contentType} for ${platform}.
Campaign: ${selectedCampaign?.title || "None"}
Brand: ${selectedBrandName || "None"}
Keywords: ${keywords || "None"}
Writing Style: ${writingExpert}
Web Search: ${webSearch ? "Enabled" : "Disabled"}

Content Brief:
${prompt}
                    `.trim();

                    const result = await generateContent({
                        title: platformTitle,
                        platform: platform,
                        content_type: contentType,
                        prompt: richPrompt,
                        model: selectedModel,
                        generate_with_image: generateWithImage,
                        brand_colors: generateWithImage ? toHexColorOrNull(brandColors) ?? undefined : undefined,
                        brand_id: selectedBrandId ?? undefined,
                    });

                    return {
                        contentId: null,
                        platform: platform,
                        result: result.result || "",
                        imageUrl: result.image_url || null,
                        brandColors: result.brand_colors || null,
                        generateWithImage: Boolean(result.generate_with_image),
                        title: withPlatformSuffix(result.title || platformTitle, platform),
                        outputType: "text",
                        brandId: selectedBrandId ?? null,
                    } as GeneratedResponse;
                }));
                setCurrentResponses(generatedResponses);
            }

            await loadHistory();
            toast.success("Content generated successfully!");
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
        const selectedBrandName = getBrandName(selectedBrandId);

        return `
Context: Creating ${contentType}
Campaign: ${selectedCampaign?.title || "None"}
Brand: ${selectedBrandName || "None"}
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
            brand_id: response.brandId ?? selectedBrandId ?? null,
        });
    };

    const isResponsePosted = (response: GeneratedResponse, idx: number) =>
        Boolean(postedIndices[idx] || (response.contentId ? postedContentIds.has(response.contentId) : false));
    const isContentPosted = (item?: Pick<ContentGeneration, "id" | "is_posted"> | null) =>
        Boolean(item?.is_posted || (item?.id && postedContentIds.has(item.id)));
    const isWhatsAppDraftPosted = Boolean(whatsAppDraft?.contentId && postedContentIds.has(whatsAppDraft.contentId));
    const previewContentIsPosted = Boolean(previewContent && isContentPosted(previewContent));

    const toHexColorOrNull = (value?: string | null) => {
        const cleaned = (value || "").trim().replace(/^#/, "");
        if (/^[0-9A-Fa-f]{3}$/.test(cleaned)) {
            return `#${cleaned.split("").map((c) => c + c).join("").toLowerCase()}`;
        }
        if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) {
            return `#${cleaned.toLowerCase()}`;
        }
        return null;
    };

    const isValidHexColor = (value?: string | null) =>
        toHexColorOrNull(value) !== null;

    const normalizeHexColor = (value?: string | null) =>
        toHexColorOrNull(value) || "#7c3aed";

    const toDateTimeLocalValue = (date: Date) => {
        const tzOffsetMs = date.getTimezoneOffset() * 60_000;
        return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
    };

    const openScheduleModal = (draft: {
        title: string;
        platform: string;
        text: string;
        imageUrl?: string;
        contentId?: number | null;
        brandId?: number | null;
    }) => {
        const defaultDate = new Date(Date.now() + 30 * 60 * 1000);
        setScheduleDraft(draft);
        setScheduleDateTime(toDateTimeLocalValue(defaultDate));
        setIsScheduleOpen(true);
    };

    const openWhatsAppModal = (draft: {
        title: string;
        text: string;
        contentId?: number | null;
        brandId?: number | null;
        imageUrl?: string;
        responseIndex?: number | null;
        mode?: "send" | "schedule";
    }) => {
        const defaultDate = new Date(Date.now() + 30 * 60 * 1000);
        setWhatsAppDraft(draft);
        setWhatsAppRecipients("");
        setSelectedCrmNumbers([]);
        setWhatsAppScheduleDateTime(toDateTimeLocalValue(defaultDate));
        setIsWhatsAppOpen(true);
    };

    const parseRecipients = (raw: string): string[] => {
        return raw
            .split(/[\n,;]+/g)
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
    };

    const appendRecipient = (value: string) => {
        if (!value) return;
        const current = parseRecipients(whatsAppRecipients);
        if (current.includes(value)) return;
        const next = [...current, value].join(", ");
        setWhatsAppRecipients(next);
    };

    const toggleCrmNumber = (value: string) => {
        if (!value) return;
        setSelectedCrmNumbers((prev) => (
            prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
        ));
    };

    const addSelectedRecipients = () => {
        if (selectedCrmNumbers.length === 0) return;
        const current = parseRecipients(whatsAppRecipients);
        const merged = Array.from(new Set([...current, ...selectedCrmNumbers]));
        setWhatsAppRecipients(merged.join(", "));
        setSelectedCrmNumbers([]);
    };

    const selectAllCrmNumbers = () => {
        const allNumbers = Array.from(
            new Set(
                whatsAppContacts.flatMap((contact) => contact.whatsapp_numbers || [])
            )
        );
        setSelectedCrmNumbers(allNumbers);
    };

    const clearAllCrmNumbers = () => {
        setSelectedCrmNumbers([]);
    };

    const allCrmNumbers = Array.from(
        new Set(whatsAppContacts.flatMap((contact) => contact.whatsapp_numbers || []))
    );
    const isAllCrmSelected = allCrmNumbers.length > 0 && selectedCrmNumbers.length === allCrmNumbers.length;

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
                        brandId: saved.brand_id ?? item.brandId ?? null,
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
        const updatingExisting = isEditMode || currentResponses.some((r) => Boolean(r.contentId));
        if (updatingExisting && !canEditExistingContent) {
            toast.error("You don't have update access");
            return;
        }
        if (!updatingExisting && !canContentCreate) {
            toast.error("You don't have create access");
            return;
        }
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
                        brandId: saved.brand_id ?? updatedResponses[idx].brandId ?? null,
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
        brandId?: number | null,
    ): Promise<PublishPostResponse | null> => {
        if (isContentReadOnly) {
            toast.error("Read-only access: posting is disabled");
            return null;
        }
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

        const status = await getConnectionStatus(platformKey, brandId ?? undefined);
        if (!status.connected) {
            const brandName = brandId ? getBrandName(brandId) : null;
            toast.error(
                brandName
                    ? `Connect ${platform} for ${brandName} before posting`
                    : `Connect ${platform} in Onboarding or Settings before posting`
            );
            return null;
        }

        const toastId = toast.loading(`Posting to ${platform}...`);
        try {
            const result = platformKey === "linkedin" && imageUrl?.startsWith("data:")
                ? await publishToLinkedIn({
                    text,
                    image_data_url: imageUrl,
                    content_id: contentId ?? undefined,
                    brand_id: brandId ?? undefined,
                })
                : await publishSocialPost(platformKey, text, imageUrl, contentId ?? undefined, undefined, brandId ?? undefined);
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

    const handleWhatsAppSend = async () => {
        if (!whatsAppDraft) return;
        if (isContentReadOnly) {
            toast.error("Read-only access: sending is disabled");
            return;
        }
        if (isWhatsAppDraftPosted) {
            toast.info("This content is already posted and is view-only.");
            return;
        }

        const recipients = parseRecipients(whatsAppRecipients);
        if (recipients.length === 0) {
            toast.error("Add at least one WhatsApp number");
            return;
        }

        let contentIdForSend = whatsAppDraft.contentId ?? null;
        if (!contentIdForSend && typeof whatsAppDraft.responseIndex === "number") {
            const response = currentResponses[whatsAppDraft.responseIndex];
            if (response && response.outputType !== "image") {
                try {
                    contentIdForSend = await ensureContentIdForPosting(response, whatsAppDraft.responseIndex);
                } catch (error: any) {
                    toast.error(error?.message || "Failed to save content before WhatsApp send");
                    return;
                }
            }
        }

        const status = await getConnectionStatus("whatsapp", whatsAppDraft.brandId ?? undefined);
        if (!status.connected) {
            const brandName = whatsAppDraft.brandId ? getBrandName(whatsAppDraft.brandId) : null;
            toast.error(
                brandName
                    ? `Connect WhatsApp for ${brandName} before sending`
                    : "Connect WhatsApp in Onboarding or Settings before sending"
            );
            return;
        }

        setIsWhatsAppSending(true);
        const toastId = toast.loading(`Sending WhatsApp message to ${recipients.length} recipient(s)...`);
        try {
            const isDataUrl = typeof whatsAppDraft.imageUrl === "string" && whatsAppDraft.imageUrl.startsWith("data:");
            const imageUrl = whatsAppDraft.imageUrl && /^https?:\/\//i.test(whatsAppDraft.imageUrl)
                ? whatsAppDraft.imageUrl
                : undefined;
            const imageDataUrl = isDataUrl ? whatsAppDraft.imageUrl : undefined;

            const result = await publishToWhatsApp({
                to_numbers: recipients,
                message: whatsAppDraft.text,
                content_id: contentIdForSend ?? undefined,
                brand_id: whatsAppDraft.brandId ?? undefined,
                image_url: imageUrl,
                image_data_url: imageDataUrl,
            });

            const successes = result.results.filter((item) => item.status === "sent").length;
            const failures = result.results.length - successes;
            if (failures > 0) {
                toast.error(`Sent ${successes}/${result.results.length}. Some numbers failed.`, { id: toastId });
            } else {
                toast.success(`WhatsApp sent to ${successes} recipient(s).`, { id: toastId });
            }

            const targetName = result.verified_name || result.display_phone_number || "WhatsApp";
            if (typeof whatsAppDraft.responseIndex === "number") {
                setPostedIndices((prev) => ({
                    ...prev,
                    [whatsAppDraft.responseIndex as number]: targetName,
                }));
            }
            if (contentIdForSend) {
                markContentPostedLocally(contentIdForSend, targetName);
                await loadHistory();
            }
            setIsWhatsAppOpen(false);
            setWhatsAppDraft(null);
        } catch (error: any) {
            toast.error(error?.message || "Failed to send WhatsApp message", { id: toastId });
        } finally {
            setIsWhatsAppSending(false);
        }
    };

    const handleWhatsAppSchedule = async () => {
        if (!whatsAppDraft) return;
        if (isContentReadOnly) {
            toast.error("Read-only access: scheduling is disabled");
            return;
        }
        if (isWhatsAppDraftPosted) {
            toast.info("This content is already posted and is view-only.");
            return;
        }

        const recipients = parseRecipients(whatsAppRecipients);
        if (recipients.length === 0) {
            toast.error("Add at least one WhatsApp number");
            return;
        }
        if (!whatsAppScheduleDateTime) {
            toast.error("Select date and time");
            return;
        }

        const scheduleDate = new Date(whatsAppScheduleDateTime);
        if (Number.isNaN(scheduleDate.getTime())) {
            toast.error("Invalid date and time");
            return;
        }

        const status = await getConnectionStatus("whatsapp", whatsAppDraft.brandId ?? undefined);
        if (!status.connected) {
            const brandName = whatsAppDraft.brandId ? getBrandName(whatsAppDraft.brandId) : null;
            toast.error(
                brandName
                    ? `Connect WhatsApp for ${brandName} before scheduling`
                    : "Connect WhatsApp in Onboarding or Settings before scheduling"
            );
            return;
        }

        setIsWhatsAppScheduling(true);
        const toastId = toast.loading(`Scheduling WhatsApp message to ${recipients.length} recipient(s)...`);
        try {
            await scheduleSocialPost({
                title: whatsAppDraft.title,
                platform: "whatsapp",
                message: whatsAppDraft.text || "",
                image_url: whatsAppDraft.imageUrl,
                to_numbers: recipients,
                content_id: whatsAppDraft.contentId ?? undefined,
                brand_id: whatsAppDraft.brandId ?? undefined,
                scheduled_at: scheduleDate.toISOString(),
            });
            toast.success("WhatsApp scheduled", { id: toastId });
            setIsWhatsAppOpen(false);
            setWhatsAppDraft(null);
        } catch (error: any) {
            toast.error(error?.message || "Failed to schedule WhatsApp message", { id: toastId });
        } finally {
            setIsWhatsAppScheduling(false);
        }
    };

    const handleScheduleSubmit = async () => {
        if (isContentReadOnly) {
            toast.error("Read-only access: scheduling is disabled");
            return;
        }
        if (!scheduleDraft) return;
        if (!scheduleDateTime) {
            toast.error("Select date and time");
            return;
        }

        const scheduleDate = new Date(scheduleDateTime);
        if (Number.isNaN(scheduleDate.getTime())) {
            toast.error("Invalid date and time");
            return;
        }

        const platformKey = scheduleDraft.platform.toLowerCase();
        if (!["linkedin", "facebook", "instagram"].includes(platformKey)) {
            toast.error(`Scheduling currently supports LinkedIn, Facebook, and Instagram only. "${scheduleDraft.platform}" is not supported yet.`);
            return;
        }
        if (platformKey === "instagram" && !scheduleDraft.imageUrl) {
            toast.error("Instagram scheduling requires an image URL");
            return;
        }
        if (platformKey === "instagram" && scheduleDraft.imageUrl && !/^https?:\/\//i.test(scheduleDraft.imageUrl)) {
            toast.error("Instagram needs a public image URL for scheduled posts.");
            return;
        }

        const status = await getConnectionStatus(platformKey, scheduleDraft.brandId ?? undefined);
        if (!status.connected) {
            const brandName = scheduleDraft.brandId ? getBrandName(scheduleDraft.brandId) : null;
            toast.error(
                brandName
                    ? `Connect ${scheduleDraft.platform} for ${brandName} before scheduling`
                    : `Connect ${scheduleDraft.platform} in Onboarding or Settings before scheduling`
            );
            return;
        }

        setScheduling(true);
        const toastId = toast.loading(`Scheduling ${scheduleDraft.platform} post...`);
        try {
            await scheduleSocialPost({
                title: scheduleDraft.title,
                platform: platformKey,
                message: scheduleDraft.text,
                image_url: scheduleDraft.imageUrl || undefined,
                content_id: scheduleDraft.contentId ?? undefined,
                brand_id: scheduleDraft.brandId ?? undefined,
                scheduled_at: scheduleDate.toISOString(),
            });
            toast.success(`Post scheduled for ${scheduleDate.toLocaleString()}`, { id: toastId });
            setIsScheduleOpen(false);
            setScheduleDraft(null);
        } catch (error: any) {
            toast.error(error?.message || "Failed to schedule post", { id: toastId });
        } finally {
            setScheduling(false);
        }
    };

    const handleSaveSingle = async (response: GeneratedResponse, idx: number) => {
        const updatingExisting = isEditMode || Boolean(response.contentId);
        if (updatingExisting && !canEditExistingContent) {
            toast.error("You don't have update access");
            return;
        }
        if (!updatingExisting && !canContentCreate) {
            toast.error("You don't have create access");
            return;
        }
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
                            brandId: saved.brand_id ?? item.brandId ?? null,
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
        if (!canEditExistingContent) {
            toast.error("You don't have update access");
            return;
        }
        if (isContentPosted(item)) {
            toast.info("Posted content is view-only.");
            return;
        }
        const parsedPrompt = parseSavedPrompt(item.prompt || "");
        const matchedCampaign = parsedPrompt.campaignTitle
            ? availableCampaigns.find((campaign) => campaign.title.trim().toLowerCase() === parsedPrompt.campaignTitle!.trim().toLowerCase())
            : null;
        const matchedBrand = parsedPrompt.brandName
            ? availableBrands.find((brand) => brand.name.trim().toLowerCase() === parsedPrompt.brandName!.trim().toLowerCase())
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
        setSelectedBrandId(item.brand_id ?? matchedBrand?.id ?? null);
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
                brandId: item.brand_id ?? matchedBrand?.id ?? null,
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
        setSelectedBrandId(null);
        setPendingCampaignTitle(null);
        setPostedPreviewByContentId({});
        setPostedIndices({});
    };

    const totalLibraryPages = Math.max(1, Math.ceil(totalLibraryItems / LIBRARY_PAGE_SIZE));

    useEffect(() => {
        if (libraryPage > totalLibraryPages) {
            setLibraryPage(totalLibraryPages);
        }
    }, [libraryPage, totalLibraryPages]);

    const models = [
        { id: "Gemini", label: "Gemini (Content)" },
        { id: "qwen2.5:0.5b", label: "Qwen 2.5 (Content)" },
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
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Brand</span>
                                            <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]" title={getBrandName(previewContent.brand_id) || "None"}>
                                                {getBrandName(previewContent.brand_id) || "None"}
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
                                    {canEditExistingContent && (
                                        <button
                                            onClick={() => {
                                                if (previewContentIsPosted) {
                                                    toast.info("Posted content is view-only.");
                                                    return;
                                                }
                                                loadFromHistory(previewContent);
                                                setActiveTab("generator");
                                                setPreviewContent(null);
                                            }}
                                            disabled={previewContentIsPosted}
                                            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <PenTool className="w-4 h-4" />
                                            {previewContentIsPosted ? "View" : "Edit / Remix"}
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            try {
                                                if ((previewContent.platform || "").toLowerCase() === "whatsapp") {
                                                    openWhatsAppModal({
                                                        title: previewContent.title,
                                                        text: previewContent.result || "",
                                                        contentId: previewContent.id,
                                                        brandId: previewContent.brand_id ?? null,
                                                        imageUrl: previewContent.image_url || undefined,
                                                        mode: "send",
                                                    });
                                                    return;
                                                }
                                                setPostingPreview(true);
                                                const publishResult = await handlePost(
                                                    previewContent.platform,
                                                    previewContent.result || "",
                                                    previewContent.image_url || undefined,
                                                    previewContent.id,
                                                    previewContent.brand_id ?? null,
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
                                        disabled={isContentReadOnly || postingPreview || previewContentIsPosted}
                                        className="w-full py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 disabled:opacity-60"
                                    >
                                        <Send className="w-4 h-4" />
                                        {postingPreview
                                            ? "Posting..."
                                            : previewContentIsPosted || postedPreviewByContentId[previewContent.id]
                                                ? `Posted to ${previewContent.platform}`
                                                : `Post to ${previewContent.platform}`}
                                    </button>
                                    <button
                                        onClick={() =>
                                            {
                                                if ((previewContent.platform || "").toLowerCase() === "whatsapp") {
                                                    openWhatsAppModal({
                                                        title: previewContent.title,
                                                        text: previewContent.result || "",
                                                        contentId: previewContent.id,
                                                        brandId: previewContent.brand_id ?? null,
                                                        imageUrl: previewContent.image_url || undefined,
                                                        mode: "schedule",
                                                    });
                                                    return;
                                                }
                                                openScheduleModal({
                                                    title: previewContent.title,
                                                    platform: previewContent.platform,
                                                    text: previewContent.result || "",
                                                    imageUrl: previewContent.image_url || undefined,
                                                    contentId: previewContent.id,
                                                    brandId: previewContent.brand_id ?? null,
                                                });
                                            }
                                        }
                                        disabled={isContentReadOnly || previewContentIsPosted}
                                        className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-60"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Schedule {previewContent.platform}
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

                {isScheduleOpen && scheduleDraft && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                        onClick={() => {
                            if (!scheduling) {
                                setIsScheduleOpen(false);
                                setScheduleDraft(null);
                            }
                        }}
                    >
                        <div
                            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Schedule Post</h3>
                            <p className="text-sm text-slate-500 mb-5">
                                {new RegExp(`\\(${scheduleDraft.platform}\\)\\s*$`, "i").test(scheduleDraft.title)
                                    ? scheduleDraft.title
                                    : `${scheduleDraft.title} (${scheduleDraft.platform})`}
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Date and Time</label>
                                    <div
                                        className="w-full"
                                        onClick={() => {
                                            scheduleInputRef.current?.focus();
                                            (scheduleInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null)?.showPicker?.();
                                        }}
                                    >
                                        <input
                                            ref={scheduleInputRef}
                                            type="datetime-local"
                                            value={scheduleDateTime}
                                            onChange={(e) => setScheduleDateTime(e.target.value)}
                                            min={toDateTimeLocalValue(new Date())}
                                            className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setIsScheduleOpen(false);
                                        setScheduleDraft(null);
                                    }}
                                    disabled={scheduling}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleScheduleSubmit}
                                    disabled={scheduling}
                                    className="px-4 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-60"
                                >
                                    {scheduling ? "Scheduling..." : "Schedule Post"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isWhatsAppOpen && whatsAppDraft && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                        onClick={() => {
                            if (!isWhatsAppSending && !isWhatsAppScheduling) {
                                setIsWhatsAppOpen(false);
                                setWhatsAppDraft(null);
                            }
                        }}
                    >
                        <div
                            className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Send WhatsApp Message</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                {new RegExp(`\\(WhatsApp\\)\\s*$`, "i").test(whatsAppDraft.title)
                                    ? whatsAppDraft.title
                                    : `${whatsAppDraft.title} (WhatsApp)`}
                            </p>

                                <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase">
                                            Recipients (E.164)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={isAllCrmSelected ? clearAllCrmNumbers : selectAllCrmNumbers}
                                            disabled={whatsAppContacts.length === 0}
                                            className="px-2.5 py-1 text-[11px] font-bold border border-slate-200 text-slate-600 rounded-lg disabled:opacity-50"
                                        >
                                            {isAllCrmSelected ? "Deselect All" : "Select All"}
                                        </button>
                                    </div>
                                    <div className="border border-slate-200 rounded-xl p-2 max-h-40 overflow-y-auto bg-slate-50 mb-2">
                                        {whatsAppContacts.length === 0 ? (
                                            <p className="text-xs text-slate-500 p-2">No WhatsApp numbers in CRM yet.</p>
                                        ) : (
                                            whatsAppContacts.flatMap((contact) =>
                                                (contact.whatsapp_numbers || []).map((number) => {
                                                    const id = `${contact.id}:${number}`;
                                                    const checked = selectedCrmNumbers.includes(number);
                                                    return (
                                                        <label key={id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleCrmNumber(number)}
                                                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                            />
                                                            <span className="text-xs font-medium text-slate-700">
                                                                {contact.handle} - {number}
                                                            </span>
                                                        </label>
                                                    );
                                                })
                                            )
                                        )}
                                    </div>
                                    <div className="flex justify-end items-center">
                                        <button
                                            type="button"
                                            onClick={addSelectedRecipients}
                                            disabled={selectedCrmNumbers.length === 0}
                                            className="px-3 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                                        >
                                            Add Selected
                                        </button>
                                    </div>
                                    <textarea
                                        value={whatsAppRecipients}
                                        onChange={(e) => setWhatsAppRecipients(e.target.value)}
                                        placeholder="+919876543210, +919812345678"
                                        className="w-full min-h-[90px] p-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        Use commas or new lines. In Meta Dev mode, only approved test numbers will receive messages.
                                    </p>
                                </div>
                                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg p-3">
                                    Free-form text is delivered only within the 24-hour customer care window.
                                    Use approved templates for outbound campaigns.
                                </div>
                                {whatsAppDraft.mode === "schedule" && (
                                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Schedule Send</label>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="flex-1"
                                                onClick={() => {
                                                    whatsAppScheduleInputRef.current?.focus();
                                                    (whatsAppScheduleInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null)?.showPicker?.();
                                                }}
                                            >
                                                <input
                                                    ref={whatsAppScheduleInputRef}
                                                    type="datetime-local"
                                                    value={whatsAppScheduleDateTime}
                                                    onChange={(e) => setWhatsAppScheduleDateTime(e.target.value)}
                                                    min={toDateTimeLocalValue(new Date())}
                                                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer bg-white"
                                                />
                                            </div>
                                            <button
                                                onClick={handleWhatsAppSchedule}
                                                disabled={isWhatsAppScheduling || isWhatsAppDraftPosted}
                                                className="px-3 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg disabled:opacity-60"
                                            >
                                                {isWhatsAppDraftPosted ? "Posted" : isWhatsAppScheduling ? "Scheduling..." : "Schedule WhatsApp"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setIsWhatsAppOpen(false);
                                        setWhatsAppDraft(null);
                                    }}
                                    disabled={isWhatsAppSending || isWhatsAppScheduling}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                {whatsAppDraft.mode !== "schedule" && (
                                    <button
                                        onClick={handleWhatsAppSend}
                                        disabled={isWhatsAppSending || isWhatsAppScheduling || isWhatsAppDraftPosted}
                                        className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-60"
                                    >
                                        {isWhatsAppDraftPosted ? "Posted" : isWhatsAppSending ? "Sending..." : "Send WhatsApp"}
                                    </button>
                                )}
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
                                    if (!canUseGenerator) return;
                                    if (activeTab !== "generator") {
                                        startNew();
                                    }
                                    setActiveTab("generator");
                                }}
                                disabled={!canUseGenerator}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "generator"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"} ${!canUseGenerator ? "opacity-50 cursor-not-allowed" : ""}`}
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
                            <button
                                onClick={() => setActiveTab("calendar")}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "calendar"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"}`}
                            >
                                Calendar
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
                                    {/* Input Sections (Platforms, Details, Brief) */}

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
                                            <input type="text" value={title} disabled={!canUseGenerator} onChange={(e) => setTitle(e.target.value)} placeholder="Give your content a title..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 font-bold text-slate-800 disabled:opacity-60" />

                                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                                {contentTypes.map((type) => (
                                                    <button key={type} disabled={!canUseGenerator} onClick={() => setContentType(type)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border disabled:opacity-50 ${contentType === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{type}</button>
                                                ))}
                                            </div>

                                            <input type="text" value={keywords} disabled={!canUseGenerator} onChange={(e) => setKeywords(e.target.value)} placeholder="Keywords (e.g. AI, automation)..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none disabled:opacity-60" />

                                            <div className="grid grid-cols-3 gap-4">
                                                <select
                                                    value={selectedBrandId || ""}
                                                    disabled={!canUseGenerator}
                                                    onChange={(e) => setSelectedBrandId(e.target.value ? Number(e.target.value) : null)}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                                                >
                                                    <option value="">No Brand</option>
                                                    {availableBrands
                                                        .filter((brand) => brand.is_active)
                                                        .map((brand) => (
                                                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                                                        ))}
                                                </select>
                                                <select
                                                    value={campaignId || ""}
                                                    disabled={!canUseGenerator}
                                                    onChange={(e) => setCampaignId(e.target.value ? Number(e.target.value) : null)}
                                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                                                >
                                                    <option value="">No Campaign</option>
                                                    {availableCampaigns.map(c => (
                                                        <option key={c.id} value={c.id}>{c.title}</option>
                                                    ))}
                                                </select>
                                                <select value={writingExpert} disabled={!canUseGenerator} onChange={(e) => setWritingExpert(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-60"><option value="General Marketing">General Marketing</option>{experts.map(e => <option key={e} value={e}>{e}</option>)}</select>
                                            </div>

                                            {/* Length */}
                                            <div className="grid grid-cols-3 gap-2">
                                                {["Short", "Medium", "Long"].map((len) => (
                                                    <button key={len} disabled={!canUseGenerator} onClick={() => setLength(len)} className={`py-2 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50 ${length === len ? 'bg-violet-50 text-violet-600 border-violet-200' : 'bg-white text-slate-500 border-slate-200'}`}>{len}</button>
                                                ))}
                                            </div>

                                            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={generateWithImage}
                                                        disabled={!canUseGenerator}
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
                                                            disabled={!canUseGenerator}
                                                            onChange={(e) => setBrandColors(e.target.value)}
                                                            className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                                                            title="Pick brand color"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={brandColors}
                                                            disabled={!canUseGenerator}
                                                            onChange={(e) => setBrandColors(e.target.value)}
                                                            onBlur={() => {
                                                                const normalized = toHexColorOrNull(brandColors);
                                                                if (normalized) setBrandColors(normalized);
                                                            }}
                                                            placeholder="#7c3aed or 7c3aed"
                                                            className={`w-full p-3 bg-white border rounded-xl text-sm font-medium focus:ring-2 outline-none ${brandColors && !isValidHexColor(brandColors)
                                                                ? "border-rose-300 focus:ring-rose-400"
                                                                : "border-slate-200 focus:ring-violet-500"
                                                                }`}
                                                        />
                                                    </div>
                                                )}
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
                                            <textarea value={prompt} disabled={!canUseGenerator} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe what you want to create..." className="w-full h-40 p-4 pb-12 bg-white border-2 border-slate-200 rounded-2xl focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none resize-none font-medium disabled:opacity-60"></textarea>
                                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg cursor-pointer" onClick={() => setWebSearch(!webSearch)}>
                                                    <div className={`w-2 h-2 rounded-full ${webSearch ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                    <span className="text-xs font-bold text-slate-600">Web Search {webSearch ? 'ON' : 'OFF'}</span>
                                                </div>
                                                <button onClick={handleEnhance} disabled={!prompt || !canUseGenerator} className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 text-violet-600 text-xs font-bold rounded-lg hover:bg-violet-100 disabled:opacity-50"><Wand2 className="w-3 h-3" /> Enhance</button>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Generate Button */}
                                    <div className="pt-4 sticky bottom-0 bg-white/95 backdrop-blur-sm pb-2">
                                        <button onClick={handleGenerate} disabled={!canUseGenerator || isGenerating || !prompt || !title || selectedPlatforms.length === 0} className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-violet-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70">
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
                                                    disabled={
                                                        currentResponses.some((response, idx) => isResponsePosted(response, idx)) ||
                                                        (isEditMode && !canEditExistingContent) ||
                                                        (!isEditMode && !canContentCreate)
                                                    }
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
                                                                if ((response.platform || "").toLowerCase() === "whatsapp") {
                                                                    let contentIdForWhatsApp = response.contentId ?? null;
                                                                    if (!contentIdForWhatsApp && response.outputType !== "image") {
                                                                        contentIdForWhatsApp = await ensureContentIdForPosting(response, idx);
                                                                    }
                                                                    openWhatsAppModal({
                                                                        title: response.title,
                                                                        text: response.result,
                                                                        contentId: contentIdForWhatsApp,
                                                                        brandId: response.brandId ?? selectedBrandId ?? null,
                                                                        imageUrl: response.outputType === "image"
                                                                            ? response.result
                                                                            : response.imageUrl || undefined,
                                                                        responseIndex: idx,
                                                                        mode: "schedule",
                                                                    });
                                                                    return;
                                                                }
                                                                try {
                                                                    let contentIdForSchedule = response.contentId ?? null;
                                                                    if (!contentIdForSchedule && response.outputType !== "image") {
                                                                        contentIdForSchedule = await ensureContentIdForPosting(response, idx);
                                                                    }
                                                                    openScheduleModal({
                                                                        title: response.title,
                                                                        platform: response.platform,
                                                                        text: response.result,
                                                                        imageUrl: response.outputType === "image"
                                                                            ? response.result
                                                                            : response.imageUrl || undefined,
                                                                        contentId: contentIdForSchedule,
                                                                        brandId: response.brandId ?? selectedBrandId ?? null,
                                                                    });
                                                                } catch (error: any) {
                                                                    toast.error(error?.message || "Failed to prepare scheduled post");
                                                                }
                                                            }}
                                                            disabled={isContentReadOnly || isResponsePosted(response, idx)}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-md shadow-amber-200 transition-all disabled:opacity-50"
                                                        >
                                                            <Calendar className="w-3 h-3" />
                                                            Schedule
                                                        </button>

                                                        <button
                                                            onClick={async () => {
                                                                if (isResponsePosted(response, idx)) {
                                                                    toast.info("This content is already posted and is view-only.");
                                                                    return;
                                                                }
                                                                try {
                                                                    let contentIdForPost = response.contentId ?? null;
                                                                    if (!contentIdForPost && response.outputType !== "image") {
                                                                        contentIdForPost = await ensureContentIdForPosting(response, idx);
                                                                    }
                                                                    if ((response.platform || "").toLowerCase() === "whatsapp") {
                                                                        openWhatsAppModal({
                                                                            title: response.title,
                                                                            text: response.result,
                                                                            contentId: contentIdForPost,
                                                                            brandId: response.brandId ?? selectedBrandId ?? null,
                                                                            imageUrl: response.outputType === "image"
                                                                                ? response.result
                                                                                : response.imageUrl || undefined,
                                                                            responseIndex: idx,
                                                                            mode: "send",
                                                                        });
                                                                        return;
                                                                    }
                                                                    setPostingIndex(idx);
                                                                    const publishResult = await handlePost(
                                                                        response.platform,
                                                                        response.result,
                                                                        response.outputType === "image"
                                                                            ? response.result
                                                                            : response.imageUrl || undefined,
                                                                        contentIdForPost,
                                                                        response.brandId ?? selectedBrandId ?? null,
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
                                                            disabled={isContentReadOnly || postingIndex === idx || isResponsePosted(response, idx)}
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
                                                            disabled={
                                                                isResponsePosted(response, idx) ||
                                                                ((isEditMode || Boolean(response.contentId)) && !canEditExistingContent) ||
                                                                (!(isEditMode || Boolean(response.contentId)) && !canContentCreate)
                                                            }
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
                                                        >
                                                            <Save className="w-3 h-3" />
                                                            {(isEditMode && canEditExistingContent) ? "Update" : "Save"}
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
                                                                disabled={isResponsePosted(response, idx) || ((isEditMode || Boolean(response.contentId)) && !canEditExistingContent)}
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
                                    {isLibraryLoading && (
                                        <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                                            <div className="w-10 h-10 mx-auto border-4 border-slate-200 border-t-violet-500 rounded-full animate-spin mb-4"></div>
                                            <p className="text-slate-500 font-medium">Loading content...</p>
                                        </div>
                                    )}
                                    {!isLibraryLoading && recentCreations.map((item) => {
                                        const itemPosted = isContentPosted(item);
                                        return (
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
                                            <h3 className="font-bold text-slate-900 mb-1 line-clamp-2 leading-tight group-hover:text-violet-600 transition-colors">{item.title}</h3>
                                            <p className="text-[11px] font-semibold text-slate-500 mb-2">
                                                Brand: {getBrandName(item.brand_id) || "None"}
                                            </p>
                                            <div className="flex-1 overflow-hidden relative mb-4">
                                                <p className="text-xs text-slate-500 leading-relaxed font-medium opacity-80 line-clamp-6">
                                                    {item.result}
                                                </p>
                                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-auto">
                                                {!itemPosted && canEditExistingContent && (
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
                                                {itemPosted && (
                                                    <>
                                                        <div className="w-px h-4 bg-slate-200"></div>
                                                        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Posted
                                                        </span>
                                                    </>
                                                )}
                                                {canContentDelete && (
                                                    <>
                                                        <div className="w-px h-4 bg-slate-200"></div>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();

                                                                if (!confirm("Are you sure you want to delete this content?")) return;

                                                                const toastId = toast.loading("Deleting...");

                                                                try {
                                                                    await deleteContent(item.id);
                                                                    setDeletedContentIds((prev) => {
                                                                        const next = new Set(prev);
                                                                        next.add(item.id);
                                                                        return next;
                                                                    });
                                                                    setRecentCreations((prev) => prev.filter((entry) => entry.id !== item.id));
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
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })}
                                    {!isLibraryLoading && recentCreations.length === 0 && (
                                        <div className="col-span-full py-20 text-center">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <History className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 font-medium">No content found matching your search.</p>
                                        </div>
                                    )}
                                </div>
                                {!isLibraryLoading && totalLibraryItems > 0 && (
                                    <div className="mt-6 flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
                                        <p className="text-sm text-slate-500">
                                            Showing {(libraryPage - 1) * LIBRARY_PAGE_SIZE + 1}-{Math.min((libraryPage - 1) * LIBRARY_PAGE_SIZE + recentCreations.length, totalLibraryItems)} of {totalLibraryItems}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setLibraryPage((prev) => Math.max(1, prev - 1))}
                                                disabled={libraryPage === 1}
                                                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-xs font-bold text-slate-600">
                                                Page {libraryPage} / {totalLibraryPages}
                                            </span>
                                            <button
                                                onClick={() => setLibraryPage((prev) => Math.min(totalLibraryPages, prev + 1))}
                                                disabled={libraryPage === totalLibraryPages}
                                                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "calendar" && (
                        <div className="h-full p-6 sm:p-8">
                            <ScheduledPostsCalendar
                                scope="content"
                                title="Content Calendar"
                                subtitle="Shows only scheduled posts from Content Studio, including upcoming and already posted items."
                            />
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function ContentStudioPage() {
    return (
        <PermissionGate requireAny={["content_studio:read", "content:read"]} fallback={<DashboardLayout><AccessDenied /></DashboardLayout>}>
            <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading studio...</div>}>
                <ContentStudioContent />
            </Suspense>
        </PermissionGate>
    );
}
