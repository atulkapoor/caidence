"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PermissionGate } from "@/components/rbac/PermissionGate";
import { AccessDenied } from "@/components/rbac/AccessDenied";
import { generateDesign, fetchDesignAssetsPage, DesignAsset, enhanceDescription, fetchBrands, type Brand } from "@/lib/api";
import { saveDesign } from "@/lib/api/design";
import { getConnectionStatus, publishSocialPost, publishToLinkedIn, scheduleSocialPost } from "@/lib/api/social";
import { useEffect, useRef, useState, Suspense } from "react";
import { useTabState } from "@/hooks/useTabState";
import { useModalScroll } from "@/hooks/useModalScroll";
import { ScheduledPostsCalendar } from "@/components/social/ScheduledPostsCalendar";
import { usePermissionContext } from "@/contexts/PermissionContext";
// import Link from "next/link"; // Unused
import { toast } from "sonner";
import { Palette, Wand2, Image as ImageIcon, Maximize2, Upload, Sparkles, Search, Download, Eye, MoreHorizontal, LayoutGrid, ListFilter, X, Calendar, ArrowRight, Send, Save, Plus, Linkedin, Twitter, FileText, Mail, Facebook, Instagram } from "lucide-react";

function DesignStudioContent() {
    const { hasPermission } = usePermissionContext();
    const canDesignCreate = hasPermission("design_studio:create");
    const canDesignWrite = hasPermission("design_studio:write") || hasPermission("design_studio:update");
    const canDesignDelete = hasPermission("design_studio:delete");
    const canUseDesignGenerator = canDesignCreate;
    const canEditExistingDesign = canDesignWrite;
    const isDesignReadOnly = !canDesignCreate && !canDesignWrite;

    type GeneratedDesignPreview = {
        title: string;
        style: string;
        aspect_ratio: string;
        prompt: string;
        image_url: string;
        brand_colors?: string;
        reference_image?: string;
        brand_id?: number | null;
    };

    // @ts-ignore
    const [activeTab, setActiveTab] = useTabState("generate");

    // Generator State
    const [title, setTitle] = useState("New Visual");
    const [prompt, setPrompt] = useState("");
    const [selectedStyle, setSelectedStyle] = useState("Photorealistic");
    const [aspectRatio, setAspectRatio] = useState("16:9");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["LinkedIn"]);
    const [selectedModel, setSelectedModel] = useState("NanoBanana");
    const [brandColors, setBrandColors] = useState(""); // Text input
    const [referenceImage, setReferenceImage] = useState("");
    const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [recentDesigns, setRecentDesigns] = useState<DesignAsset[]>([]);
    const [generatedContent, setGeneratedContent] = useState("");
    const [generatedDesignPreview, setGeneratedDesignPreview] = useState<GeneratedDesignPreview | null>(null);
    const [generatedPlatforms, setGeneratedPlatforms] = useState<string[]>([]);
    const [savingDesignPlatform, setSavingDesignPlatform] = useState<string | null>(null);
    const [designAssetIdByPlatform, setDesignAssetIdByPlatform] = useState<Record<string, number>>({});
    const [editingDesignId, setEditingDesignId] = useState<number | null>(null);
    const [postingPreviewPlatform, setPostingPreviewPlatform] = useState<string | null>(null);
    const [postingDesignPlatform, setPostingDesignPlatform] = useState<string | null>(null);
    const [postingGeneratedText, setPostingGeneratedText] = useState(false);
    const [generatedTextPostedPlatforms, setGeneratedTextPostedPlatforms] = useState<Set<string>>(new Set());
    const [postedDesignIds, setPostedDesignIds] = useState<Set<number>>(new Set());
    const [postedDesignPlatformKeys, setPostedDesignPlatformKeys] = useState<Set<string>>(new Set());
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [scheduleDateTime, setScheduleDateTime] = useState("");
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDraft, setScheduleDraft] = useState<{
        title: string;
        platform: string;
        imageUrl: string;
        designAssetId?: number;
        brandId?: number | null;
    } | null>(null);

    // Library State
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("All Types");
    const [previewDesign, setPreviewDesign] = useState<DesignAsset | null>(null);
    const [isLibraryLoading, setIsLibraryLoading] = useState(false);
    const [libraryPage, setLibraryPage] = useState(1);
    const [totalLibraryItems, setTotalLibraryItems] = useState(0);
    const scheduleInputRef = useRef<HTMLInputElement | null>(null);
    useModalScroll(!!previewDesign || isScheduleOpen);
    const LIBRARY_PAGE_SIZE = 12;

    const totalLibraryPages = Math.max(1, Math.ceil(totalLibraryItems / LIBRARY_PAGE_SIZE));
    const platforms = [
        { id: "LinkedIn", icon: Linkedin, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
        { id: "Twitter", icon: Twitter, color: "text-sky-500", bg: "bg-sky-50", border: "border-sky-200" },
        { id: "Blog", icon: FileText, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
        { id: "Email", icon: Mail, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" },
        { id: "Facebook", icon: Facebook, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
        { id: "Instagram", icon: Instagram, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
    ];
    const supportedPublishPlatforms = new Set(["linkedin", "facebook", "instagram"]);
    const primarySelectedPlatform = selectedPlatforms[0] || "LinkedIn";
    const previewPlatforms =
        (isGenerating || Boolean(generatedDesignPreview)) && generatedPlatforms.length > 0
            ? generatedPlatforms
            : [primarySelectedPlatform];
    const knownPlatforms = ["LinkedIn", "Twitter", "Blog", "Email", "Facebook", "Instagram"];
    const getBrandName = (brandId?: number | null) =>
        availableBrands.find((brand) => brand.id === brandId)?.name || null;

    const togglePlatform = (id: string) => {
        setSelectedPlatforms((prev) =>
            prev.includes(id)
                ? prev.length > 1
                    ? prev.filter((item) => item !== id)
                    : prev
                : [...prev, id]
        );
    };

    const makeDesignPlatformKey = (designAssetId: number | undefined, platform: string) =>
        `${designAssetId || 0}:${platform.toLowerCase()}`;

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
    const detectPlatformFromTitle = (rawTitle: string): string | null => {
        const titleValue = (rawTitle || "").trim();
        for (const platform of knownPlatforms) {
            const suffixRegex = new RegExp(`\\s*\\(${escapeRegExp(platform)}\\)\\s*$`, "i");
            if (suffixRegex.test(titleValue)) return platform;
        }
        return null;
    };

    const resetGeneratorState = () => {
        setTitle("New Visual");
        setPrompt("");
        setSelectedStyle("Photorealistic");
        setAspectRatio("16:9");
        setSelectedPlatforms(["LinkedIn"]);
        setBrandColors("");
        setReferenceImage("");
        setSelectedBrandId(null);
        setGeneratedContent("");
        setGeneratedDesignPreview(null);
        setGeneratedPlatforms([]);
        setDesignAssetIdByPlatform({});
        setEditingDesignId(null);
        setGeneratedTextPostedPlatforms(new Set());
        setPostingPreviewPlatform(null);
        setPostingDesignPlatform(null);
    };
    const resolveAssetPlatform = (asset?: Pick<DesignAsset, "title"> | null): string =>
        detectPlatformFromTitle(asset?.title || "") || primarySelectedPlatform;

    useEffect(() => {
        // Check for edit mode
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        if (editId) loadForEdit(parseInt(editId));
    }, []);

    useEffect(() => {
        loadBrands();
    }, []);

    useEffect(() => {
        setLibraryPage(1);
    }, [searchQuery, typeFilter]);

    useEffect(() => {
        if (activeTab === "library") {
            loadDesigns();
        }
    }, [activeTab, libraryPage, searchQuery, typeFilter]);

    useEffect(() => {
        if (activeTab === "generate" && !canUseDesignGenerator) {
            setActiveTab("library");
        }
    }, [activeTab, canUseDesignGenerator, setActiveTab]);

    useEffect(() => {
        if (activeTab !== "library") return;
        const intervalId = setInterval(() => {
            loadDesigns();
        }, 30_000);
        return () => clearInterval(intervalId);
    }, [activeTab, libraryPage, searchQuery, typeFilter]);

    useEffect(() => {
        if (libraryPage > totalLibraryPages) {
            setLibraryPage(totalLibraryPages);
        }
    }, [libraryPage, totalLibraryPages]);

    const isDesignLocked = (asset?: Pick<DesignAsset, "id" | "is_posted"> | null) => {
        const id = asset?.id;
        if (!id) return false;
        return Boolean(asset?.is_posted) || postedDesignIds.has(id);
    };

    const loadDesignIntoGenerator = (asset: DesignAsset) => {
        if (!canEditExistingDesign) {
            toast.error("You don't have update access");
            return;
        }
        if (isDesignLocked(asset)) {
            toast.info("Posted designs are read-only and cannot be edited.");
            return;
        }
        const detectedPlatform = detectPlatformFromTitle(asset.title || "");
        setPrompt(asset.prompt);
        setSelectedStyle(asset.style);
        setTitle(stripPlatformSuffixes(asset.title || ""));
        setAspectRatio(asset.aspect_ratio || "16:9");
        setBrandColors(asset.brand_colors || "");
        setReferenceImage(asset.reference_image || "");
        setSelectedBrandId(asset.brand_id ?? null);
        if (detectedPlatform) {
            setSelectedPlatforms([detectedPlatform]);
            setDesignAssetIdByPlatform({ [detectedPlatform.toLowerCase()]: asset.id });
        } else {
            setDesignAssetIdByPlatform({});
        }
        setEditingDesignId(asset.id);
        setGeneratedDesignPreview({
            title: stripPlatformSuffixes(asset.title || "Untitled Design"),
            style: asset.style || "Minimalist",
            aspect_ratio: asset.aspect_ratio || "16:9",
            prompt: asset.prompt || "",
            image_url: asset.image_url || "",
            brand_colors: asset.brand_colors || undefined,
            reference_image: asset.reference_image || undefined,
            brand_id: asset.brand_id ?? null,
        });
        setGeneratedContent("");
        setActiveTab("generate");
    };

    const loadForEdit = async (id: number) => {
        try {
            const { fetchDesignAssetById } = await import("@/lib/api");
            const asset = await fetchDesignAssetById(id);
            if (asset) {
                if (isDesignLocked(asset)) {
                    toast.info("Posted designs are read-only and cannot be edited.");
                    return;
                }
                loadDesignIntoGenerator(asset);
                window.history.replaceState({}, '', '/design-studio');
                toast.success("Design loaded for editing");
            }
        } catch (e) {
            console.error("Failed to load edit asset", e);
            toast.error("Failed to load design for editing");
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

    const loadDesigns = async () => {
        setIsLibraryLoading(true);
        try {
            const paged = await fetchDesignAssetsPage({
                skip: (libraryPage - 1) * LIBRARY_PAGE_SIZE,
                limit: LIBRARY_PAGE_SIZE,
                q: searchQuery || undefined,
                style: typeFilter,
            });
            const data = paged.items;
            setRecentDesigns(data);
            setTotalLibraryItems(paged.total);
            const persistedPostedIds = data.filter((item) => item.is_posted).map((item) => item.id);
            setPostedDesignIds(new Set(persistedPostedIds));
        } catch (error: any) {
            console.error("Failed to load designs", error);
            toast.error(error?.message || "Failed to load design library");
        } finally {
            setIsLibraryLoading(false);
        }
    };

    const toDateTimeLocalValue = (date: Date) => {
        const tzOffsetMs = date.getTimezoneOffset() * 60_000;
        return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
    };

    const openDesignScheduleModal = (draft: { title: string; platform: string; imageUrl: string; designAssetId?: number; brandId?: number | null }) => {
        setScheduleDraft(draft);
        setScheduleDateTime(toDateTimeLocalValue(new Date(Date.now() + 30 * 60 * 1000)));
        setIsScheduleOpen(true);
    };

    const handleScheduleDesign = async () => {
        if (isDesignReadOnly) {
            toast.error("Read-only access: scheduling is disabled");
            return;
        }
        if (!scheduleDraft) return;
        if (!scheduleDraft.designAssetId) {
            toast.error("Save design to library before scheduling");
            return;
        }
        if (!scheduleDateTime) {
            toast.error("Select date and time");
            return;
        }

        const platformKey = scheduleDraft.platform.toLowerCase();
        if (!supportedPublishPlatforms.has(platformKey)) {
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
                    : `Connect ${scheduleDraft.platform} in Onboarding/Settings before scheduling`
            );
            return;
        }

        setIsScheduling(true);
        const toastId = toast.loading(`Scheduling ${scheduleDraft.platform} post...`);
        try {
            await scheduleSocialPost({
                title: stripPlatformSuffixes(scheduleDraft.title || "New design"),
                platform: platformKey,
                message: stripPlatformSuffixes(scheduleDraft.title || "New design"),
                image_url: scheduleDraft.imageUrl,
                design_asset_id: scheduleDraft.designAssetId,
                brand_id: scheduleDraft.brandId ?? undefined,
                scheduled_at: new Date(scheduleDateTime).toISOString(),
            });
            toast.success(`Scheduled to ${scheduleDraft.platform}`, { id: toastId });
            setIsScheduleOpen(false);
            setScheduleDraft(null);
        } catch (error: any) {
            toast.error(error?.message || "Failed to schedule design post", { id: toastId });
        } finally {
            setIsScheduling(false);
        }
    };

    const handleGenerate = async () => {
        if (!canUseDesignGenerator) {
            toast.error("You don't have create access for Design generator");
            return;
        }
        if (!prompt) return;
        setGeneratedPlatforms(selectedPlatforms.length > 0 ? [...selectedPlatforms] : [primarySelectedPlatform]);
        setIsGenerating(true);

        try {
            const selectedBrandName = getBrandName(selectedBrandId);
            const promptForGeneration = selectedBrandName
                ? `Brand: ${selectedBrandName}\n${prompt}`
                : prompt;
            const generated = await generateDesign({
                title: title || "Untitled Design",
                style: selectedStyle,
                aspect_ratio: aspectRatio,
                prompt: promptForGeneration,
                model: selectedModel,
                brand_colors: brandColors,
                reference_image: referenceImage,
                brand_id: selectedBrandId ?? undefined,
            });
            setGeneratedDesignPreview({
                title: generated.title || title || "Untitled Design",
                style: generated.style || selectedStyle,
                aspect_ratio: generated.aspect_ratio || aspectRatio,
                prompt: generated.prompt || promptForGeneration,
                image_url: generated.image_url,
                brand_colors: generated.brand_colors || brandColors || undefined,
                reference_image: generated.reference_image || referenceImage || undefined,
                brand_id: generated.brand_id ?? selectedBrandId ?? null,
            });
            setGeneratedContent("");
            if (editingDesignId && selectedPlatforms.length === 1) {
                setDesignAssetIdByPlatform({ [selectedPlatforms[0].toLowerCase()]: editingDesignId });
            } else {
                setDesignAssetIdByPlatform({});
            }
            setActiveTab("generate");
            toast.success(
                editingDesignId
                    ? "Design regenerated."
                    : "Design generated.",
            );
        } catch (error) {
            console.error("Failed to generate design", error);
            toast.error("Generation failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveGeneratedDesign = async (platform: string) => {
        const platformKey = platform.toLowerCase();
        const existingId = designAssetIdByPlatform[platformKey]
            ?? (selectedPlatforms.length === 1 ? editingDesignId ?? undefined : undefined);
        const isUpdate = Boolean(existingId);
        if (isUpdate && !canEditExistingDesign) {
            toast.error("You don't have update access");
            return;
        }
        if (!isUpdate && !canDesignCreate) {
            toast.error("You don't have create access");
            return;
        }
        if (!generatedDesignPreview?.image_url) {
            toast.error("Generate a design preview before saving.");
            return;
        }

        const wasEditing = Boolean(existingId);
        setSavingDesignPlatform(platformKey);
        try {
            const saved = await saveDesign({
                id: existingId,
                title: withPlatformSuffix(generatedDesignPreview.title || title || "Untitled Design", platform),
                style: generatedDesignPreview.style || selectedStyle,
                aspect_ratio: generatedDesignPreview.aspect_ratio || aspectRatio,
                prompt: generatedDesignPreview.prompt || prompt,
                image_url: generatedDesignPreview.image_url,
                model: selectedModel,
                brand_colors: generatedDesignPreview.brand_colors || brandColors || undefined,
                reference_image: generatedDesignPreview.reference_image || referenceImage || undefined,
                brand_id: selectedBrandId ?? undefined,
            });

            setRecentDesigns((prev) => {
                const existingIndex = prev.findIndex((item) => item.id === saved.id);
                if (existingIndex >= 0) {
                    return prev.map((item) => (item.id === saved.id ? saved : item));
                }
                return [saved, ...prev];
            });

            setDesignAssetIdByPlatform((prev) => ({
                ...prev,
                [platformKey]: saved.id,
            }));
            if (selectedPlatforms.length === 1) {
                setEditingDesignId(saved.id);
            }
            setGeneratedDesignPreview({
                title: stripPlatformSuffixes(saved.title || generatedDesignPreview.title),
                style: saved.style || generatedDesignPreview.style,
                aspect_ratio: saved.aspect_ratio || generatedDesignPreview.aspect_ratio,
                prompt: saved.prompt || generatedDesignPreview.prompt,
                image_url: saved.image_url || generatedDesignPreview.image_url,
                brand_colors: saved.brand_colors || generatedDesignPreview.brand_colors,
                reference_image: saved.reference_image || generatedDesignPreview.reference_image,
                brand_id: saved.brand_id ?? generatedDesignPreview.brand_id ?? selectedBrandId ?? null,
            });

            toast.success(wasEditing ? `${platform} design updated in library.` : `${platform} design saved to library.`);
        } catch (error) {
            console.error("Failed to save design", error);
            toast.error("Failed to save design. Please try again.");
        } finally {
            setSavingDesignPlatform(null);
        }
    };

    const handleSaveAllGeneratedDesigns = async () => {
        if (!generatedDesignPreview?.image_url) {
            toast.error("Generate a design preview before saving.");
            return;
        }
        for (const platform of previewPlatforms) {
            // eslint-disable-next-line no-await-in-loop
            await handleSaveGeneratedDesign(platform);
        }
    };

    const ensureDesignAssetIdForPublishOrSchedule = async (platform: string, existingId?: number) => {
        if (isDesignReadOnly) {
            toast.error("Read-only access: posting/scheduling is disabled");
            return null;
        }
        const platformKey = platform.toLowerCase();
        const resolvedExistingId = existingId
            ?? designAssetIdByPlatform[platformKey]
            ?? (selectedPlatforms.length === 1 ? editingDesignId ?? undefined : undefined);
        if (resolvedExistingId) return resolvedExistingId;
        if (!generatedDesignPreview?.image_url) {
            toast.error("Generate a design preview before posting or scheduling.");
            return null;
        }

        try {
            const saved = await saveDesign({
                title: withPlatformSuffix(generatedDesignPreview.title || title || "Untitled Design", platform),
                style: generatedDesignPreview.style || selectedStyle,
                aspect_ratio: generatedDesignPreview.aspect_ratio || aspectRatio,
                prompt: generatedDesignPreview.prompt || prompt,
                image_url: generatedDesignPreview.image_url,
                model: selectedModel,
                brand_colors: generatedDesignPreview.brand_colors || brandColors || undefined,
                reference_image: generatedDesignPreview.reference_image || referenceImage || undefined,
                brand_id: selectedBrandId ?? undefined,
            });

            setRecentDesigns((prev) => {
                const existingIndex = prev.findIndex((item) => item.id === saved.id);
                if (existingIndex >= 0) {
                    return prev.map((item) => (item.id === saved.id ? saved : item));
                }
                return [saved, ...prev];
            });
            setDesignAssetIdByPlatform((prev) => ({
                ...prev,
                [platformKey]: saved.id,
            }));
            if (selectedPlatforms.length === 1) {
                setEditingDesignId(saved.id);
            }
            setGeneratedDesignPreview((prev) => (
                prev
                    ? {
                        ...prev,
                        title: stripPlatformSuffixes(saved.title || prev.title),
                        style: saved.style || prev.style,
                        aspect_ratio: saved.aspect_ratio || prev.aspect_ratio,
                        prompt: saved.prompt || prev.prompt,
                        image_url: saved.image_url || prev.image_url,
                        brand_colors: saved.brand_colors || prev.brand_colors,
                        reference_image: saved.reference_image || prev.reference_image,
                        brand_id: saved.brand_id ?? prev.brand_id ?? selectedBrandId ?? null,
                    }
                    : prev
            ));
            return saved.id;
        } catch (error) {
            console.error("Failed to auto-save design", error);
            toast.error("Failed to auto-save design before posting/scheduling.");
            return null;
        }
    };

    const styles = ["Photorealistic", "3D Render", "Minimalist", "Cyberpunk", "Watercolor", "Sketch", "Abstract", "Corporate"];
    const ratios = ["16:9", "1:1", "9:16", "4:3"];
    const models = [
        { id: "NanoBanana", label: "Nano Banana" },
        { id: "IDKiro/sdxs-512-0.9", label: "DIffusion" },
    ];


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

    const handleDesignPost = async ({
        platform,
        text,
        imageUrl,
        designAssetId,
        brandId,
    }: {
        platform: string;
        text: string;
        imageUrl?: string;
        designAssetId?: number;
        brandId?: number | null;
    }) => {
        if (isDesignReadOnly) {
            toast.error("Read-only access: posting is disabled");
            return;
        }
        const normalizedText = stripPlatformSuffixes((text || "").trim());
        if (!normalizedText) {
            toast.error("Nothing to post");
            return;
        }

        const platformKey = platform.toLowerCase();
        if (!supportedPublishPlatforms.has(platformKey)) {
            toast.error(`Direct publishing currently supports LinkedIn, Facebook, and Instagram only. "${platform}" is not supported yet.`);
            return;
        }
        if (platformKey === "instagram" && !imageUrl) {
            toast.error("Instagram posting requires an image URL");
            return;
        }
        if (platformKey === "instagram" && imageUrl && !/^https?:\/\//i.test(imageUrl)) {
            toast.error("Instagram needs a public image URL. Save image to a public URL first.");
            return;
        }

        const status = await getConnectionStatus(platformKey, brandId ?? undefined);
        if (!status.connected) {
            const brandName = brandId ? getBrandName(brandId) : null;
            toast.error(
                brandName
                    ? `Connect ${platform} for ${brandName} before posting`
                    : `Connect ${platform} in Onboarding/Settings before posting`
            );
            return;
        }

        const toastId = toast.loading(`Posting to ${platform}...`);
        try {
            const publishResult = platformKey === "linkedin" && imageUrl?.startsWith("data:")
                ? await publishToLinkedIn({
                    text: normalizedText,
                    image_data_url: imageUrl,
                    design_asset_id: designAssetId,
                    brand_id: brandId ?? undefined,
                })
                : await publishSocialPost(platformKey, normalizedText, imageUrl, undefined, designAssetId, brandId ?? undefined);

            if (!publishResult.published) {
                throw new Error(`Unexpected ${platform} publish response`);
            }

            if (designAssetId) {
                setPostedDesignIds((prev) => {
                    const next = new Set(prev);
                    next.add(designAssetId);
                    return next;
                });
                setPostedDesignPlatformKeys((prev) => {
                    const next = new Set(prev);
                    next.add(makeDesignPlatformKey(designAssetId, platform));
                    return next;
                });
            }
            toast.success(`Posted to ${publishResult.target_name || platform}`, { id: toastId });
        } catch (error: any) {
            toast.error(error?.message || `Failed to post to ${platform}`, { id: toastId });
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
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{stripPlatformSuffixes(previewDesign.title || "Untitled Design")}</h3>
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
                                        <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200">
                                            Brand: {getBrandName(previewDesign.brand_id) || "None"}
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
                                            loadDesignIntoGenerator(previewDesign);
                                            setPreviewDesign(null);
                                        }}
                                        disabled={isDesignLocked(previewDesign) || !canEditExistingDesign}
                                        className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <Palette className="w-4 h-4" />
                                        {isDesignLocked(previewDesign) ? "Remix Disabled" : !canEditExistingDesign ? "Edit Disabled" : "Remix Design"}
                                    </button>
                                    <button
                                        onClick={() => handleDownload(previewDesign.image_url, previewDesign.title)}
                                        className="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download PNG
                                    </button>
                                    {[resolveAssetPlatform(previewDesign)].map((platform) => {
                                        const platformKey = platform.toLowerCase();
                                        const actionKey = makeDesignPlatformKey(previewDesign.id, platform);
                                        const isAssetPosted = Boolean(previewDesign.is_posted) || postedDesignIds.has(previewDesign.id || 0);
                                        const isPostedForPlatform = postedDesignPlatformKeys.has(actionKey);
                                        const unsupported = !supportedPublishPlatforms.has(platformKey);

                                        return (
                                            <div key={`${previewDesign.id || "preview"}:${platform}`} className="space-y-2">
                                                <button
                                                    onClick={async () => {
                                                        if (unsupported) {
                                                            toast.error(`Direct publishing is not supported for ${platform} yet.`);
                                                            return;
                                                        }
                                                        try {
                                                            setPostingDesignPlatform(actionKey);
                                                            await handleDesignPost({
                                                                platform,
                                                                text: previewDesign.title || "New design",
                                                                imageUrl: previewDesign.image_url,
                                                                designAssetId: previewDesign.id || undefined,
                                                                brandId: previewDesign.brand_id ?? null,
                                                            });
                                                        } finally {
                                                            setPostingDesignPlatform(null);
                                                        }
                                                    }}
                                                    disabled={isDesignReadOnly || unsupported || postingDesignPlatform === actionKey || isPostedForPlatform || isAssetPosted}
                                                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${(isPostedForPlatform || isAssetPosted)
                                                        ? "bg-emerald-100 text-emerald-700 cursor-default"
                                                        : "bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                                                        }`}
                                                >
                                                    <Send className="w-4 h-4" />
                                                    {(isPostedForPlatform || isAssetPosted)
                                                        ? `Posted to ${platform}`
                                                        : postingDesignPlatform === actionKey
                                                            ? "Posting..."
                                                            : `Post to ${platform}`}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        openDesignScheduleModal({
                                                            title: previewDesign.title || "New design",
                                                            platform,
                                                            imageUrl: previewDesign.image_url,
                                                            designAssetId: previewDesign.id || undefined,
                                                            brandId: previewDesign.brand_id ?? null,
                                                        })
                                                    }
                                                    disabled={isDesignReadOnly || unsupported || isPostedForPlatform || isAssetPosted}
                                                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                                                >
                                                    <Calendar className="w-4 h-4" />
                                                    {`Schedule ${platform}`}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isScheduleOpen && scheduleDraft && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                        onClick={() => {
                            if (!isScheduling) {
                                setIsScheduleOpen(false);
                                setScheduleDraft(null);
                            }
                        }}
                    >
                        <div
                            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Schedule Design Post</h3>
                            <p className="text-sm text-slate-500 mb-5">Platform: {scheduleDraft.platform}</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Date and Time</label>
                                    <input
                                        ref={scheduleInputRef}
                                        type="datetime-local"
                                        value={scheduleDateTime}
                                        onChange={(e) => setScheduleDateTime(e.target.value)}
                                        onClick={() => {
                                            scheduleInputRef.current?.focus();
                                            (scheduleInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null)?.showPicker?.();
                                        }}
                                        min={toDateTimeLocalValue(new Date())}
                                        className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setIsScheduleOpen(false);
                                        setScheduleDraft(null);
                                    }}
                                    disabled={isScheduling}
                                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleScheduleDesign}
                                    disabled={isScheduling}
                                    className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-60"
                                >
                                    {isScheduling ? "Scheduling..." : "Schedule Post"}
                                </button>
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
                            <button
                                onClick={() => {
                                    if (!canUseDesignGenerator) return;
                                    if (activeTab !== "generate") resetGeneratorState();
                                    setActiveTab("generate");
                                }}
                                disabled={!canUseDesignGenerator}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "generate" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"} ${!canUseDesignGenerator ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                Generate Design
                            </button>
                            <button onClick={() => setActiveTab("library")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "library" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Design Library</button>
                            <button onClick={() => setActiveTab("calendar")} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "calendar" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Calendar</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="text-xs font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-rose-500 outline-none"
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

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">

                    {/* GENERATE TAB */}
                    {activeTab === "generate" && (
                        <div className="h-full grid grid-cols-1 lg:grid-cols-12">
                            {/* LEFT PANEL: Inputs */}
                            <div className="lg:col-span-5 h-full overflow-y-auto border-r border-slate-200 bg-white p-6 custom-scrollbar">
                                <div className="max-w-xl mx-auto space-y-8">
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-8">
                                        {/* Platform Selection */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">1</span>
                                                    Choose Platform(s)
                                                </h2>
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">Multi-select enabled</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                {platforms.map((platform) => (
                                                    <button
                                                        key={platform.id}
                                                        onClick={() => canUseDesignGenerator && togglePlatform(platform.id)}
                                                        disabled={!canUseDesignGenerator}
                                                        className={`relative p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 group ${selectedPlatforms.includes(platform.id)
                                                            ? `bg-white ${platform.border} ring-2 ring-rose-500 ring-offset-1 shadow-md`
                                                            : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm"
                                                            }`}
                                                    >
                                                        <div className={`p-2 rounded-lg ${platform.bg} ${platform.color} transition-transform group-hover:scale-110`}>
                                                            <platform.icon className="w-5 h-5" />
                                                        </div>
                                                        <span className={`text-xs font-bold ${selectedPlatforms.includes(platform.id) ? "text-slate-800" : "text-slate-500"}`}>{platform.id}</span>
                                                        {selectedPlatforms.includes(platform.id) && (
                                                            <div className="absolute top-2 right-2 w-2 h-2 bg-rose-600 rounded-full"></div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Design Name */}
                                        <div className="space-y-4">
                                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">2</span>
                                                Project Details
                                            </h2>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Design Name</label>
                                                    <input
                                                        type="text"
                                                        value={title}
                                                        disabled={!canUseDesignGenerator}
                                                        onChange={(e) => setTitle(e.target.value)}
                                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:font-normal"
                                                        placeholder="e.g. Summer Campaign Hero"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Brand (Optional)</label>
                                                    <select
                                                        value={selectedBrandId || ""}
                                                        disabled={!canUseDesignGenerator}
                                                        onChange={(e) => setSelectedBrandId(e.target.value ? Number(e.target.value) : null)}
                                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-slate-500"
                                                    >
                                                        <option value="">No Brand</option>
                                                        {availableBrands
                                                            .filter((brand) => brand.is_active)
                                                            .map((brand) => (
                                                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                                                            ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full h-px bg-slate-100"></div>

                                        {/* Configuration */}
                                        <div className="space-y-4">
                                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">3</span>
                                                Visual Settings
                                            </h2>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Design Type / Size</label>
                                                    <select
                                                        value={aspectRatio}
                                                        disabled={!canUseDesignGenerator}
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
                                                        disabled={!canUseDesignGenerator}
                                                        onChange={(e) => setSelectedStyle(e.target.value)}
                                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                                                    >
                                                        {styles.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Brand Colors (Optional)</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={brandColors || "#000000"}
                                                            disabled={!canUseDesignGenerator}
                                                            onChange={(e) => setBrandColors(e.target.value)}
                                                            className="w-12 h-12 p-1 bg-white border border-slate-200 rounded-lg cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={brandColors}
                                                            disabled={!canUseDesignGenerator}
                                                            onChange={(e) => setBrandColors(e.target.value)}
                                                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:font-normal"
                                                            placeholder="Hex Code (e.g. #FF0000)"
                                                        />
                                                    </div>
                                                </div>
                                                {/* Reference Image Placeholder */}
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Reference Image</label>
                                                    <div className="relative h-[50px]">
                                                        {!referenceImage && (
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                disabled={!canUseDesignGenerator}
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
                                                        )}
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
                                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">4</span>
                                                    Design Brief
                                                </h2>
                                                <button
                                                    onClick={async () => {
                                                        if (!prompt) return;
                                                        setIsEnhancing(true);
                                                        try {
                                                            const enhanced = await enhanceDescription(prompt, selectedModel);
                                                            setPrompt(enhanced);
                                                        } catch (e) {
                                                            console.error("Enhance failed", e);
                                                        }
                                                        setIsEnhancing(false);
                                                    }}
                                                    disabled={!canUseDesignGenerator || isEnhancing || !prompt}
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
                                                    disabled={!canUseDesignGenerator}
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
                                            disabled={!canUseDesignGenerator || isGenerating || !prompt}
                                            className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-200 transition-transform active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2 text-lg"
                                        >
                                            {isGenerating ? (
                                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Generating...</>
                                            ) : (
                                                <><Wand2 className="w-5 h-5" /> {editingDesignId ? "Regenerate Design" : "Generate AI Design"}</>
                                            )}
                                        </button>
                                    </div>

                                    {generatedContent && (
                                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Generated Content</h3>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(generatedContent)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
                                                    >
                                                        Copy
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                if (!supportedPublishPlatforms.has(primarySelectedPlatform.toLowerCase())) {
                                                                    toast.error(`Direct publishing is not supported for ${primarySelectedPlatform} yet.`);
                                                                    return;
                                                                }
                                                                setPostingGeneratedText(true);
                                                                await handleDesignPost({
                                                                    platform: primarySelectedPlatform,
                                                                    text: generatedContent,
                                                                    brandId: selectedBrandId ?? null,
                                                                });
                                                                setGeneratedTextPostedPlatforms((prev) => {
                                                                    const next = new Set(prev);
                                                                    next.add(primarySelectedPlatform.toLowerCase());
                                                                    return next;
                                                                });
                                                            } catch (error: any) {
                                                                toast.error(error?.message || `Failed to post to ${primarySelectedPlatform}`);
                                                            } finally {
                                                                setPostingGeneratedText(false);
                                                            }
                                                        }}
                                                        disabled={postingGeneratedText || generatedTextPostedPlatforms.has(primarySelectedPlatform.toLowerCase())}
                                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${generatedTextPostedPlatforms.has(primarySelectedPlatform.toLowerCase())
                                                            ? "bg-emerald-100 text-emerald-700 cursor-default"
                                                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            }`}
                                                    >
                                                        {generatedTextPostedPlatforms.has(primarySelectedPlatform.toLowerCase()) ? `Posted on ${primarySelectedPlatform}` : postingGeneratedText ? "Posting..." : `Post to ${primarySelectedPlatform}`}
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{generatedContent}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT PANEL: Previews */}
                            <div className="lg:col-span-7 h-full bg-slate-100 p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                                <div className="max-w-3xl mx-auto space-y-6">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={resetGeneratorState}
                                            className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:bg-white px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            <Plus className="w-4 h-4" /> New Design
                                        </button>
                                        <button
                                            onClick={handleSaveAllGeneratedDesigns}
                                            disabled={!generatedDesignPreview?.image_url || !(canDesignCreate || canEditExistingDesign)}
                                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-50 shadow-sm flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <Sparkles className="w-3 h-3 text-amber-400" /> Save All
                                        </button>
                                    </div>
                                    {previewPlatforms.map((platform) => {
                                        const platformKey = platform.toLowerCase();
                                        const platformDesignId = designAssetIdByPlatform[platformKey]
                                            ?? (selectedPlatforms.length === 1 ? editingDesignId ?? undefined : undefined);
                                        const actionKey = makeDesignPlatformKey(platformDesignId, platform);
                                        const isPostedForPlatform = postedDesignPlatformKeys.has(actionKey);
                                        const unsupported = !supportedPublishPlatforms.has(platformKey);

                                        return (
                                            <div key={`generate-preview:${platform}`} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate">{generatedDesignPreview?.title || title || "Untitled Design"}</p>
                                                        <p className="text-xs text-slate-500 font-medium">{platform}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                if (!generatedDesignPreview?.image_url) return;
                                                                if (unsupported) {
                                                                    toast.error(`Direct publishing is not supported for ${platform} yet.`);
                                                                    return;
                                                                }
                                                                try {
                                                                    const designAssetId = await ensureDesignAssetIdForPublishOrSchedule(platform, platformDesignId);
                                                                    if (!designAssetId) return;
                                                                    setPostingPreviewPlatform(platformKey);
                                                                    await handleDesignPost({
                                                                        platform,
                                                                        text: generatedDesignPreview.title || title || "New design",
                                                                        imageUrl: generatedDesignPreview.image_url,
                                                                        designAssetId,
                                                                        brandId: generatedDesignPreview.brand_id ?? selectedBrandId ?? null,
                                                                    });
                                                                } finally {
                                                                    setPostingPreviewPlatform(null);
                                                                }
                                                            }}
                                                            disabled={isDesignReadOnly || unsupported || postingPreviewPlatform === platformKey || isPostedForPlatform || !generatedDesignPreview?.image_url}
                                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                        >
                                                            <span className="inline-flex items-center gap-1"><Send className="w-3.5 h-3.5" /> {postingPreviewPlatform === platformKey ? "Posting..." : isPostedForPlatform ? "Posted" : "Post"}</span>
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!generatedDesignPreview?.image_url) return;
                                                                const designAssetId = await ensureDesignAssetIdForPublishOrSchedule(platform, platformDesignId);
                                                                if (!designAssetId) return;
                                                                openDesignScheduleModal({
                                                                    title: generatedDesignPreview.title || title || "New design",
                                                                    platform,
                                                                    imageUrl: generatedDesignPreview.image_url,
                                                                    designAssetId,
                                                                    brandId: generatedDesignPreview.brand_id ?? selectedBrandId ?? null,
                                                                });
                                                            }}
                                                            disabled={isDesignReadOnly || unsupported || !generatedDesignPreview?.image_url}
                                                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                        >
                                                            <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Schedule</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveGeneratedDesign(platform)}
                                                            disabled={savingDesignPlatform === platformKey || isGenerating || !generatedDesignPreview?.image_url || (!canEditExistingDesign && platformDesignId !== undefined) || (!canDesignCreate && platformDesignId === undefined)}
                                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <span className="inline-flex items-center gap-1">
                                                                {savingDesignPlatform === platformKey ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                                {savingDesignPlatform === platformKey ? "Saving..." : platformDesignId ? "Update" : "Save"}
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="relative rounded-xl border border-slate-200 bg-slate-50 min-h-[420px] flex items-center justify-center overflow-hidden">
                                                    {isGenerating ? (
                                                        <div className="flex flex-col items-center gap-3 text-slate-500">
                                                            <div className="w-10 h-10 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin"></div>
                                                            <p className="text-xs font-semibold uppercase tracking-wider">Generating Preview...</p>
                                                        </div>
                                                    ) : generatedDesignPreview?.image_url ? (
                                                        <img
                                                            src={generatedDesignPreview.image_url}
                                                            alt={`${generatedDesignPreview.title || "Generated design preview"} - ${platform}`}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <div className="text-center p-6">
                                                            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                                            <p className="text-sm font-medium text-slate-500">
                                                                Generate a design to preview it here before saving.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
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
                                {isLibraryLoading ? (
                                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                                        <div className="w-10 h-10 mx-auto border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin mb-4"></div>
                                        <p className="text-slate-500 font-medium">Loading designs...</p>
                                    </div>
                                ) : recentDesigns.length > 0 ? (
                                    recentDesigns.map((asset) => {
                                        const isLocked = isDesignLocked(asset) || !canEditExistingDesign;
                                        const platform = resolveAssetPlatform(asset);
                                        const platformKey = platform.toLowerCase();
                                        const isAssetPosted = Boolean(asset.is_posted) || postedDesignIds.has(asset.id || 0);
                                        const actionKey = makeDesignPlatformKey(asset.id, platform);
                                        const isPostedForPlatform = postedDesignPlatformKeys.has(actionKey);

                                        return (
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
                                            <div className="p-5 flex flex-col gap-3 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 line-clamp-1 group-hover:text-rose-600 transition-colors cursor-pointer" onClick={() => setPreviewDesign(asset)}>{stripPlatformSuffixes(asset.title || "Untitled Design")}</h3>
                                                        <p className="text-[11px] font-semibold text-slate-500 mt-1">
                                                            Brand: {getBrandName(asset.brand_id) || "None"}
                                                        </p>
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

                                                <div className="mt-auto">
                                                    <div className="w-full h-px bg-slate-100"></div>

                                                    <div className="grid grid-cols-[1fr_15px] items-center mt-3">
                                                        <div className="flex items-center">
                                                            {isLocked ? (
                                                                <span className="inline-flex items-center gap-1 text-xs opacity-0 select-none w-[72px]">
                                                                    <Wand2 className="w-3 h-3" /> Remix
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        if (!canEditExistingDesign) return;
                                                                        loadDesignIntoGenerator(asset);
                                                                    }}
                                                                    disabled={!canEditExistingDesign}
                                                                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 w-[72px] justify-start"
                                                                >
                                                                    <Wand2 className="w-3 h-3" /> Remix
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => setPreviewDesign(asset)}
                                                                className="text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold w-[68px] justify-center"
                                                            >
                                                                View <ArrowRight className="w-3 h-3" />
                                                            </button>

                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (isAssetPosted) return;
                                                                    if (!supportedPublishPlatforms.has(platformKey)) {
                                                                        toast.error(`Direct publishing is not supported for ${platform} yet.`);
                                                                        return;
                                                                    }
                                                                    try {
                                                                        setPostingDesignPlatform(actionKey);
                                                                        await handleDesignPost({
                                                                            platform,
                                                                            text: asset.title || "New design",
                                                                            imageUrl: asset.image_url,
                                                                            designAssetId: asset.id || undefined,
                                                                        });
                                                                    } catch (error: any) {
                                                                        toast.error(error?.message || `Failed to post to ${platform}`);
                                                                    } finally {
                                                                        setPostingDesignPlatform(null);
                                                                    }
                                                                }}
                                                                disabled={
                                                                    isDesignReadOnly
                                                                    || !supportedPublishPlatforms.has(platformKey)
                                                                    || postingDesignPlatform === actionKey
                                                                    || isPostedForPlatform
                                                                    || isAssetPosted
                                                                }
                                                                className={`transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider min-w-[80px] justify-center ${(isPostedForPlatform || isAssetPosted)
                                                                    ? "px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700"
                                                                    : "text-emerald-600 hover:text-emerald-700"
                                                                    }`}
                                                            >
                                                                <Send className="w-3 h-3" /> {(isPostedForPlatform || isAssetPosted) ? "Posted" : postingDesignPlatform === actionKey ? "Posting" : "Post"}
                                                            </button>
                                                        </div>

                                                        {canDesignDelete && (
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm("Delete this design?")) {
                                                                        setRecentDesigns(prev => prev.filter(p => p.id !== asset.id));
                                                                        try {
                                                                            const { deleteDesign } = await import("@/lib/api/design");
                                                                            await deleteDesign(asset.id);
                                                                        } catch { /* already removed from UI */ }
                                                                        toast.success("Design deleted");
                                                                    }
                                                                }}
                                                                className="justify-self-end text-slate-400 hover:text-red-500 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Pinned Action - View Details */}
                                                    <div className="justify-self-center flex items-center gap-4">
                                                        <button
                                                            onClick={() => setPreviewDesign(asset)}
                                                            className="text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
                                                        >
                                                            View <ArrowRight className="w-3 h-3" />
                                                        </button>

                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const platform = resolveAssetPlatform(asset);
                                                                const platformKey = platform.toLowerCase();
                                                                const isAssetPosted = Boolean(asset.is_posted) || postedDesignIds.has(asset.id || 0);
                                                                const actionKey = makeDesignPlatformKey(asset.id, platform);
                                                                if (isAssetPosted) return;
                                                                if (!supportedPublishPlatforms.has(platformKey)) {
                                                                    toast.error(`Direct publishing is not supported for ${platform} yet.`);
                                                                    return;
                                                                }
                                                                try {
                                                                    setPostingDesignPlatform(actionKey);
                                                                    await handleDesignPost({
                                                                        platform,
                                                                        text: asset.title || "New design",
                                                                        imageUrl: asset.image_url,
                                                                        designAssetId: asset.id || undefined,
                                                                        brandId: asset.brand_id ?? null,
                                                                    });
                                                                } catch (error: any) {
                                                                    toast.error(error?.message || `Failed to post to ${platform}`);
                                                                } finally {
                                                                    setPostingDesignPlatform(null);
                                                                }
                                                            }}
                                                            disabled={
                                                                isDesignReadOnly
                                                                || 
                                                                !supportedPublishPlatforms.has(resolveAssetPlatform(asset).toLowerCase())
                                                                || postingDesignPlatform === makeDesignPlatformKey(asset.id, resolveAssetPlatform(asset))
                                                                || postedDesignPlatformKeys.has(makeDesignPlatformKey(asset.id, resolveAssetPlatform(asset)))
                                                                || Boolean(asset.is_posted)
                                                                || postedDesignIds.has(asset.id || 0)
                                                            }
                                                            className={`transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${(postedDesignPlatformKeys.has(makeDesignPlatformKey(asset.id, resolveAssetPlatform(asset))) || Boolean(asset.is_posted) || postedDesignIds.has(asset.id || 0))
                                                                ? "px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700"
                                                                : "text-emerald-600 hover:text-emerald-700"
                                                                }`}
                                                        >
                                                            <Send className="w-3 h-3" /> {(postedDesignPlatformKeys.has(makeDesignPlatformKey(asset.id, resolveAssetPlatform(asset))) || Boolean(asset.is_posted) || postedDesignIds.has(asset.id || 0)) ? "Posted" : postingDesignPlatform === makeDesignPlatformKey(asset.id, resolveAssetPlatform(asset)) ? "Posting" : "Post"}
                                                        </button>
                                                    </div>

                                                    {canDesignDelete && (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (confirm("Delete this design?")) {
                                                                    setRecentDesigns(prev => prev.filter(p => p.id !== asset.id));
                                                                    try {
                                                                        const { deleteDesign } = await import("@/lib/api/design");
                                                                        await deleteDesign(asset.id);
                                                                    } catch { /* already removed from UI */ }
                                                                    toast.success("Design deleted");
                                                                }
                                                            }}
                                                            className="justify-self-end text-slate-400 hover:text-red-500 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                                ) : (
                                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ImageIcon className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">No designs found</h3>
                                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">Get started by generating your first AI visual in the Generate tab.</p>
                                        <button onClick={() => canUseDesignGenerator && setActiveTab("generate")} disabled={!canUseDesignGenerator} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50">
                                            Start Creating
                                        </button>
                                    </div>
                                )}
                            </div>
                            {!isLibraryLoading && totalLibraryItems > 0 && (
                                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
                                    <p className="text-sm text-slate-500">
                                        Showing {(libraryPage - 1) * LIBRARY_PAGE_SIZE + 1}-{Math.min((libraryPage - 1) * LIBRARY_PAGE_SIZE + recentDesigns.length, totalLibraryItems)} of {totalLibraryItems}
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
                    )}

                    {activeTab === "calendar" && (
                        <div className="max-w-7xl mx-auto h-full">
                            <ScheduledPostsCalendar
                                scope="design"
                                title="Design Calendar"
                                subtitle="Shows only scheduled posts from Design Studio, including upcoming and already posted items."
                            />
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}

export default function DesignStudioPage() {
    return (
        <PermissionGate require="design_studio:read" fallback={<DashboardLayout><AccessDenied /></DashboardLayout>}>
            <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading studio...</div>}>
                <DesignStudioContent />
            </Suspense>
        </PermissionGate>
    );
}
