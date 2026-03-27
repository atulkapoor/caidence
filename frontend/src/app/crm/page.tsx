"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    createCrmCategory,
    createCrmGeneratePost,
    createRelationship,
    CrmCategory,
    CrmCategoryBrandOption,
    CrmGeneratePost,
    Brand,
    deleteCrmGeneratePost,
    deleteCrmCategory,
    deleteRelationship,
    downloadCrmTemplate,
    fetchCrmCategories,
    fetchCrmCategoryBrandOptions,
    fetchCrmGeneratePosts,
    fetchBrands,
    fetchWhatsAppContacts,
    fetchRelationships,
    generateXRayReport,
    RelationshipProfile,
    WhatsAppContact,
    updateCrmCategory,
    updateCrmGeneratePost,
    updateRelationship,
    uploadCrmRelationships,
    getConnectionStatus,
    publishSocialPost,
    publishToLinkedIn,
    publishToWhatsApp,
    scheduleSocialPost,
} from "@/lib/api";
import { Calendar, ChevronDown, ChevronUp, Download, Facebook, FileText, ImageIcon, Instagram, Linkedin, Mail, Pencil, Plus, Save, Send, Trash2, Twitter, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/rbac/PermissionGate";
import { AccessDenied } from "@/components/rbac/AccessDenied";
import { useModalScroll } from "@/hooks/useModalScroll";
import { useTabState } from "@/hooks/useTabState";
import { usePermissionContext } from "@/contexts/PermissionContext";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { ScheduledPostsCalendar } from "@/components/social/ScheduledPostsCalendar";

function CRMPageInner() {
    const [activeTab, setActiveTab] = useTabState("portfolio");
    const [relationships, setRelationships] = useState<RelationshipProfile[]>([]);
    const [categories, setCategories] = useState<CrmCategory[]>([]);
    const [categoryBrandOptions, setCategoryBrandOptions] = useState<CrmCategoryBrandOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [showPortfolioModal, setShowPortfolioModal] = useState(false);
    const [editingProfile, setEditingProfile] = useState<RelationshipProfile | null>(null);
    const [formHandle, setFormHandle] = useState("");
    const [formPlatform, setFormPlatform] = useState("Instagram");
    const [formStatus, setFormStatus] = useState<"Active" | "Vetted" | "Past" | "Blacklisted">("Active");
    const [formWhatsapp, setFormWhatsapp] = useState("");
    const [formName, setFormName] = useState("");
    const [formCategoryIds, setFormCategoryIds] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CrmCategory | null>(null);
    const [categoryName, setCategoryName] = useState("");
    const [categoryBrandIds, setCategoryBrandIds] = useState<number[]>([]);
    const [categorySaving, setCategorySaving] = useState(false);
    const [showGenerateBuilder, setShowGenerateBuilder] = useState(false);
    const [generateSelectedPlatforms, setGenerateSelectedPlatforms] = useState<string[]>(["LinkedIn"]);
    const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
    const [selectedGenerateBrandId, setSelectedGenerateBrandId] = useState<number | null>(null);
    const [generateTitle, setGenerateTitle] = useState("New Post");
    const [generateDescription, setGenerateDescription] = useState("");
    const [generateImagePreview, setGenerateImagePreview] = useState<string | null>(null);
    const [generateImageName, setGenerateImageName] = useState("");
    const [editingGenerateDraftId, setEditingGenerateDraftId] = useState<number | null>(null);
    const [generatePosts, setGeneratePosts] = useState<CrmGeneratePost[]>([]);
    const [loadingGeneratePosts, setLoadingGeneratePosts] = useState(true);
    const [postingGenerateDraftId, setPostingGenerateDraftId] = useState<number | null>(null);
    const [viewingGeneratePost, setViewingGeneratePost] = useState<CrmGeneratePost | null>(null);
    const [expandedRecipientDraftIds, setExpandedRecipientDraftIds] = useState<Set<number>>(new Set());
    const [whatsAppContacts, setWhatsAppContacts] = useState<WhatsAppContact[]>([]);
    const [selectedCrmNumbers, setSelectedCrmNumbers] = useState<string[]>([]);
    const [whatsAppRecipients, setWhatsAppRecipients] = useState("");
    const [selectedWhatsAppCategoryIds, setSelectedWhatsAppCategoryIds] = useState<number[]>([]);
    const [categorySearch, setCategorySearch] = useState("");
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
    const [isWhatsAppSending, setIsWhatsAppSending] = useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDateTime, setScheduleDateTime] = useState("");
    const [scheduleWhatsAppRecipients, setScheduleWhatsAppRecipients] = useState("");
    const [scheduleDraft, setScheduleDraft] = useState<{
        title: string;
        platform: string;
        text: string;
        imageUrl?: string;
        brandId?: number | null;
        crmGeneratePostId?: number | null;
    } | null>(null);
    const [whatsAppDraft, setWhatsAppDraft] = useState<{
        id: number;
        title: string;
        text: string;
        imageUrl?: string;
        brandId?: number | null;
    } | null>(null);
    const generateFileInputRef = useRef<HTMLInputElement | null>(null);
    const { role } = usePermissionContext();
    const isBrandScopedUser = role === "brand_admin" || role === "brand_member";

    useModalScroll(showPortfolioModal || showCategoryModal || Boolean(viewingGeneratePost) || isWhatsAppOpen || isScheduleOpen);

    const loadRelationships = async () => {
        const data = await fetchRelationships();
        setRelationships(data);
    };

    const loadCategories = async () => {
        const [categoryData, brandOptions] = await Promise.all([
            fetchCrmCategories(),
            fetchCrmCategoryBrandOptions(),
        ]);
        setCategories(categoryData);
        setCategoryBrandOptions(brandOptions);
    };

    const loadGeneratePosts = async () => {
        const posts = await fetchCrmGeneratePosts();
        setGeneratePosts(posts);
    };

    const loadWhatsAppContacts = async () => {
        const contacts = await fetchWhatsAppContacts();
        setWhatsAppContacts(contacts);
    };

    const loadBrands = async () => {
        const brands = await fetchBrands();
        setAvailableBrands(brands.filter((brand) => brand.is_active));
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([loadRelationships(), loadCategories(), loadGeneratePosts(), loadWhatsAppContacts(), loadBrands()]);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load CRM data");
            } finally {
                setLoading(false);
                setLoadingCategories(false);
                setLoadingGeneratePosts(false);
            }
        };
        loadData();
    }, []);

    const handleGenerateReport = async (handle: string) => {
        const toastId = toast.loading(`Generating X-Ray Report for ${handle}...`);
        try {
            const res = await generateXRayReport(handle);
            toast.success(`Report generated! (${res.download_url})`, { id: toastId });
        } catch (err: any) {
            console.error(err);
            toast.error(`Failed to generate report: ${err.message}`, { id: toastId });
        }
    };

    const handleExport = () => {
        if (relationships.length === 0) {
            toast.error("No data to export");
            return;
        }
        const headers = ["Handle", "WhatsApp Numbers", "Platform", "Categories", "Status", "Total Spend", "Avg ROI", "Last Contact"];
        const csvContent = [
            headers.join(","),
            ...relationships.map((r) => [
                r.handle,
                (r.whatsapp_numbers || []).join("|"),
                r.platform,
                (r.category_names || []).join("|"),
                r.relationship_status,
                r.total_spend,
                r.avg_roi,
                r.last_contact,
            ].join(",")),
        ].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `crm_export_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Export downloaded");
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await downloadCrmTemplate();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "crm_influencer_template.xlsx";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Template downloaded");
        } catch (err: any) {
            toast.error(err?.message || "Failed to download template");
        }
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const toastId = toast.loading("Uploading CRM file...");
        try {
            const result = await uploadCrmRelationships(file);
            toast.success(`Imported. Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`, { id: toastId });
            if (result.errors?.length) toast.error(`Some rows were skipped. Example: ${result.errors[0]}`);
            await loadRelationships();
        } catch (err: any) {
            toast.error(err?.message || "Failed to import CRM file", { id: toastId });
        }
    };

    const resetPortfolioForm = () => {
        setFormHandle("");
        setFormPlatform("Instagram");
        setFormStatus("Active");
        setFormWhatsapp("");
        setFormName("");
        setFormCategoryIds([]);
        setEditingProfile(null);
    };

    const openEditPortfolio = (rel: RelationshipProfile) => {
        setEditingProfile(rel);
        setFormHandle(rel.handle || "");
        setFormPlatform(rel.platform || "Instagram");
        setFormStatus(rel.relationship_status || "Active");
        setFormWhatsapp((rel.whatsapp_numbers || []).join(", "));
        setFormCategoryIds(rel.category_ids || []);
        setFormName("");
        setShowPortfolioModal(true);
    };

    const handleSavePortfolio = async () => {
        const handle = formHandle.trim();
        if (!handle) return toast.error("Handle is required");
        setSaving(true);
        try {
            const payload = {
                handle,
                platform: formPlatform,
                relationship_status: formStatus,
                whatsapp_numbers: formWhatsapp.split(/[;,]/).map((v) => v.trim()).filter(Boolean),
                name: formName || undefined,
                category_ids: formCategoryIds,
            };
            if (editingProfile?.creator_id) {
                await updateRelationship(editingProfile.creator_id, payload);
                toast.success("Influencer updated");
            } else {
                await createRelationship(payload);
                toast.success("Influencer added");
            }
            await loadRelationships();
            setShowPortfolioModal(false);
            resetPortfolioForm();
        } catch (err: any) {
            toast.error(err?.message || "Failed to save influencer");
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePortfolio = async (rel: RelationshipProfile) => {
        if (!rel.creator_id) return toast.error("This entry cannot be deleted");
        if (!confirm(`Remove ${rel.handle} from portfolio?`)) return;
        try {
            await deleteRelationship(rel.creator_id);
            await loadRelationships();
            toast.success("Influencer removed");
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete influencer");
        }
    };

    const resetCategoryForm = () => {
        setCategoryName("");
        setCategoryBrandIds(isBrandScopedUser && categoryBrandOptions.length > 0 ? [categoryBrandOptions[0].id] : []);
        setEditingCategory(null);
    };

    const handleSaveCategory = async () => {
        const name = categoryName.trim();
        if (!name) return toast.error("Category name is required");
        if (categoryBrandIds.length === 0) return toast.error("Please select at least one brand");
        setCategorySaving(true);
        try {
            if (editingCategory) {
                await updateCrmCategory(editingCategory.id, { name, brand_ids: categoryBrandIds });
                toast.success("Category updated");
            } else {
                await createCrmCategory({ name, brand_ids: categoryBrandIds });
                toast.success("Category created");
            }
            await Promise.all([loadCategories(), loadRelationships()]);
            setShowCategoryModal(false);
            resetCategoryForm();
        } catch (err: any) {
            toast.error(err?.message || "Failed to save category");
        } finally {
            setCategorySaving(false);
        }
    };

    const handleDeleteCategory = async (category: CrmCategory) => {
        if (!confirm(`Delete category "${category.name}"?`)) return;
        try {
            await deleteCrmCategory(category.id);
            await Promise.all([loadCategories(), loadRelationships()]);
            toast.success("Category deleted");
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete category");
        }
    };

    const filteredRelationships = relationships.filter((rel) => {
        const query = searchQuery.toLowerCase();
        return rel.handle.toLowerCase().includes(query) || (rel.platform || "").toLowerCase().includes(query) || (rel.category_names || []).join(" ").toLowerCase().includes(query);
    });

    const generatePlatforms = [
        { id: "LinkedIn", icon: Linkedin, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
        { id: "Twitter", icon: Twitter, color: "text-sky-500", bg: "bg-sky-50", border: "border-sky-200" },
        { id: "Blog", icon: FileText, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
        { id: "Email", icon: Mail, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" },
        { id: "Facebook", icon: Facebook, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
        { id: "Instagram", icon: Instagram, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
        { id: "WhatsApp", icon: WhatsAppIcon, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    ];
    const generatePrimaryPlatform = generateSelectedPlatforms[0] || "LinkedIn";

    const toggleGeneratePlatform = (id: string) => {
        setGenerateSelectedPlatforms((prev) =>
            prev.includes(id)
                ? (prev.length > 1 ? prev.filter((item) => item !== id) : prev)
                : [...prev, id]
        );
    };

    const handleGenerateImagePick = () => {
        generateFileInputRef.current?.click();
    };

    const handleGenerateImageSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setGenerateImagePreview(typeof reader.result === "string" ? reader.result : null);
            setGenerateImageName(file.name);
        };
        reader.readAsDataURL(file);
    };

    const resetGenerateBuilder = () => {
        setGenerateSelectedPlatforms(["LinkedIn"]);
        setSelectedGenerateBrandId(null);
        setGenerateTitle("New Post");
        setGenerateDescription("");
        setGenerateImagePreview(null);
        setGenerateImageName("");
        setEditingGenerateDraftId(null);
        if (generateFileInputRef.current) {
            generateFileInputRef.current.value = "";
        }
    };

    const formatCardDate = (value?: string | null) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = String(date.getFullYear());
        return `${day}/${month}/${year}`;
    };

    const getBrandName = (brandId?: number | null) =>
        availableBrands.find((brand) => brand.id === brandId)?.name || null;

    const toDateTimeLocalValue = (date: Date) => {
        const tzOffsetMs = date.getTimezoneOffset() * 60_000;
        return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
    };

    const parseRecipients = (raw: string): string[] => {
        return raw
            .split(/[\n,;]+/g)
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
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

    const addSelectedScheduleRecipients = () => {
        if (selectedCrmNumbers.length === 0) return;
        const current = parseRecipients(scheduleWhatsAppRecipients);
        const merged = Array.from(new Set([...current, ...selectedCrmNumbers]));
        setScheduleWhatsAppRecipients(merged.join(", "));
        setSelectedCrmNumbers([]);
    };

    const relationshipCategoryMap = new Map<number, number[]>(
        relationships
            .filter((rel) => typeof rel.creator_id === "number")
            .map((rel) => [rel.creator_id as number, rel.category_ids || []])
    );

    const getContactCategoryIds = (contact: WhatsAppContact) =>
        contact.category_ids && contact.category_ids.length > 0
            ? contact.category_ids
            : (relationshipCategoryMap.get(contact.id) || []);

    const filteredWhatsAppContacts = selectedWhatsAppCategoryIds.length > 0
        ? whatsAppContacts.filter((contact) =>
            getContactCategoryIds(contact).some((id) => selectedWhatsAppCategoryIds.includes(id))
        )
        : whatsAppContacts;

    const filteredCategories = categories.filter((category) =>
        category.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
    );

    const allCrmNumbers = Array.from(new Set(filteredWhatsAppContacts.flatMap((contact) => contact.whatsapp_numbers || [])));
    const isAllCrmSelected = allCrmNumbers.length > 0 && selectedCrmNumbers.length === allCrmNumbers.length;

    const selectAllCrmNumbers = () => {
        setSelectedCrmNumbers(allCrmNumbers);
    };

    const clearAllCrmNumbers = () => {
        setSelectedCrmNumbers([]);
    };

    const toggleRecipientExpansion = (draftId: number) => {
        setExpandedRecipientDraftIds((prev) => {
            const next = new Set(prev);
            if (next.has(draftId)) next.delete(draftId);
            else next.add(draftId);
            return next;
        });
    };

    const openWhatsAppModal = (draft: CrmGeneratePost) => {
        setWhatsAppDraft({
            id: draft.id,
            title: draft.title || "New Post",
            text: (draft.description || "").trim() || (draft.title || "New Post"),
            imageUrl: draft.image_url || undefined,
            brandId: draft.brand_id ?? null,
        });
        setWhatsAppRecipients("");
        setSelectedCrmNumbers([]);
        setSelectedWhatsAppCategoryIds([]);
        setCategorySearch("");
        setIsCategoryDropdownOpen(false);
        setIsWhatsAppOpen(true);
    };

    const handleSaveGenerateDraft = async () => {
        if (!generateImagePreview && !generateDescription.trim()) {
            toast.error("Upload an image or add a description before saving");
            return;
        }
        const payload = {
            title: generateTitle.trim() || "New Post",
            platform: generatePrimaryPlatform,
            brand_id: selectedGenerateBrandId,
            description: generateDescription.trim() || null,
            image_url: generateImagePreview,
            image_name: generateImageName || null,
        };

        const toastId = toast.loading(editingGenerateDraftId ? "Updating..." : "Saving...");
        try {
            if (editingGenerateDraftId) {
                await updateCrmGeneratePost(editingGenerateDraftId, payload);
                toast.success("Generate post updated", { id: toastId });
            } else {
                await createCrmGeneratePost(payload);
                toast.success("Generate post saved", { id: toastId });
            }
            await loadGeneratePosts();
            setShowGenerateBuilder(false);
            resetGenerateBuilder();
        } catch (err: any) {
            toast.error(err?.message || "Failed to save generate post", { id: toastId });
        }
    };

    const getGenerateDraftPayload = () => ({
        title: generateTitle.trim() || "New Post",
        platform: generatePrimaryPlatform,
        brand_id: selectedGenerateBrandId,
        description: generateDescription.trim() || null,
        image_url: generateImagePreview,
        image_name: generateImageName || null,
    });

    const ensureGenerateDraftForActions = async (): Promise<CrmGeneratePost | null> => {
        const payload = getGenerateDraftPayload();
        if (!payload.image_url && !payload.description) {
            toast.error("Upload an image or add a description first");
            return null;
        }
        try {
            if (editingGenerateDraftId) {
                const updated = await updateCrmGeneratePost(editingGenerateDraftId, payload);
                await loadGeneratePosts();
                return updated;
            }
            const created = await createCrmGeneratePost(payload);
            setEditingGenerateDraftId(created.id);
            await loadGeneratePosts();
            return created;
        } catch (err: any) {
            toast.error(err?.message || "Failed to prepare post");
            return null;
        }
    };

    const handleBuilderPost = async () => {
        const draft = await ensureGenerateDraftForActions();
        if (!draft) return;
        await handlePostGenerateDraft(draft);
    };

    const openScheduleForDraft = (draft: CrmGeneratePost) => {
        const defaultDate = new Date(Date.now() + 30 * 60 * 1000);
        setScheduleWhatsAppRecipients("");
        setSelectedCrmNumbers([]);
        setSelectedWhatsAppCategoryIds([]);
        setCategorySearch("");
        setIsCategoryDropdownOpen(false);
        setScheduleDraft({
            title: draft.title || "New Post",
            platform: draft.platform,
            text: (draft.description || "").trim() || (draft.title || "New Post"),
            imageUrl: draft.image_url || undefined,
            brandId: draft.brand_id ?? null,
            crmGeneratePostId: draft.id,
        });
        setScheduleDateTime(toDateTimeLocalValue(defaultDate));
        setIsScheduleOpen(true);
    };

    const handleOpenSchedule = async () => {
        const draft = await ensureGenerateDraftForActions();
        if (!draft) return;
        openScheduleForDraft(draft);
    };

    const handleScheduleSubmit = async () => {
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
        if (!["linkedin", "facebook", "instagram", "whatsapp"].includes(platformKey)) {
            toast.error(`Scheduling currently supports LinkedIn, Facebook, Instagram, and WhatsApp only. "${scheduleDraft.platform}" is not supported yet.`);
            return;
        }
        const recipients = platformKey === "whatsapp" ? parseRecipients(scheduleWhatsAppRecipients) : [];
        if (platformKey === "whatsapp" && recipients.length === 0) {
            toast.error("Add at least one WhatsApp recipient to schedule");
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
                title: scheduleDraft.title,
                platform: platformKey,
                message: scheduleDraft.text,
                image_url: scheduleDraft.imageUrl,
                brand_id: scheduleDraft.brandId ?? undefined,
                crm_generate_post_id: scheduleDraft.crmGeneratePostId ?? undefined,
                to_numbers: platformKey === "whatsapp" ? recipients : undefined,
                scheduled_at: scheduleDate.toISOString(),
            });
            toast.success(`Scheduled to ${scheduleDraft.platform}`, { id: toastId });
            setIsScheduleOpen(false);
            setScheduleDraft(null);
            setScheduleWhatsAppRecipients("");
        } catch (err: any) {
            toast.error(err?.message || `Failed to schedule ${scheduleDraft.platform} post`, { id: toastId });
        } finally {
            setIsScheduling(false);
        }
    };

    const handleEditGenerateDraft = (draftId: number) => {
        const draft = generatePosts.find((item) => item.id === draftId);
        if (!draft) return;
        if (draft.is_posted) {
            toast.info("Posted items are view-only. Create a new one to post again.");
            return;
        }
        setEditingGenerateDraftId(draft.id);
        setGenerateSelectedPlatforms([draft.platform]);
        setSelectedGenerateBrandId(draft.brand_id ?? null);
        setGenerateTitle(draft.title || "New Post");
        setGenerateDescription(draft.description || "");
        setGenerateImagePreview(draft.image_url || null);
        setGenerateImageName(draft.image_name || "");
        setShowGenerateBuilder(true);
    };

    const handleDeleteGenerateDraft = async (draftId: number) => {
        const toastId = toast.loading("Deleting...");
        try {
            await deleteCrmGeneratePost(draftId);
            await loadGeneratePosts();
            toast.success("Draft deleted", { id: toastId });
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete draft", { id: toastId });
            return;
        }
        if (editingGenerateDraftId === draftId) {
            resetGenerateBuilder();
            setShowGenerateBuilder(false);
        }
        if (viewingGeneratePost?.id === draftId) {
            setViewingGeneratePost(null);
        }
    };

    const handlePostGenerateDraft = async (draft: CrmGeneratePost) => {
        if (draft.is_posted) {
            toast.info("This post is already published.");
            return;
        }

        const platform = (draft.platform || "").trim();
        const platformKey = platform.toLowerCase();
        const text = (draft.description || "").trim() || (draft.title || "New Post").trim();
        const imageValue = draft.image_url || undefined;

        if (!text && !imageValue) {
            toast.error("Nothing to post");
            return;
        }

        if (platformKey === "whatsapp") {
            openWhatsAppModal(draft);
            return;
        }

        setPostingGenerateDraftId(draft.id);
        const toastId = toast.loading(`Posting to ${platform || "platform"}...`);
        try {

            const supportedDirectPlatforms = new Set(["linkedin", "facebook", "instagram"]);
            if (!supportedDirectPlatforms.has(platformKey)) {
                throw new Error(`Direct publishing currently supports LinkedIn, Facebook, Instagram, and WhatsApp only. "${platform}" is not supported yet.`);
            }
            if (platformKey === "instagram" && !imageValue) {
                throw new Error("Instagram posting requires an image");
            }
            if (platformKey === "instagram" && imageValue && !/^https?:\/\//i.test(imageValue)) {
                throw new Error("Instagram needs a public image URL. Save image to a public URL first.");
            }

            const status = await getConnectionStatus(platformKey, draft.brand_id ?? undefined);
            if (!status.connected) {
                throw new Error(`Connect ${platform} in Onboarding/Settings before posting`);
            }

            const publishResult = platformKey === "linkedin" && imageValue?.startsWith("data:")
                ? await publishToLinkedIn({
                    text,
                    image_data_url: imageValue,
                    brand_id: draft.brand_id ?? undefined,
                })
                : await publishSocialPost(platformKey, text, imageValue, undefined, undefined, draft.brand_id ?? undefined);

            if (!publishResult.published) {
                throw new Error(`Unexpected ${platform} publish response`);
            }

            await updateCrmGeneratePost(draft.id, {
                is_posted: true,
                posted_target_name: publishResult.target_name || platform,
            });
            await loadGeneratePosts();
            setViewingGeneratePost((prev) => (
                prev && prev.id === draft.id
                    ? {
                        ...prev,
                        is_posted: true,
                        posted_target_name: publishResult.target_name || platform,
                        posted_at: new Date().toISOString(),
                    }
                    : prev
            ));
            toast.success(`Posted to ${publishResult.target_name || platform}`, { id: toastId });
        } catch (err: any) {
            toast.error(err?.message || `Failed to post to ${platform}`, { id: toastId });
        } finally {
            setPostingGenerateDraftId(null);
        }
    };

    const handleWhatsAppSend = async () => {
        if (!whatsAppDraft) return;
        const recipients = parseRecipients(whatsAppRecipients);
        if (recipients.length === 0) {
            toast.error("Add at least one WhatsApp number");
            return;
        }

        const status = await getConnectionStatus("whatsapp", whatsAppDraft.brandId ?? undefined);
        if (!status.connected) {
            toast.error("Connect WhatsApp in Onboarding/Settings before sending");
            return;
        }

        setIsWhatsAppSending(true);
        const toastId = toast.loading(`Sending WhatsApp to ${recipients.length} recipient(s)...`);
        try {
            const isDataUrl = typeof whatsAppDraft.imageUrl === "string" && whatsAppDraft.imageUrl.startsWith("data:");
            const result = await publishToWhatsApp({
                to_numbers: recipients,
                message: whatsAppDraft.text,
                image_url: whatsAppDraft.imageUrl && /^https?:\/\//i.test(whatsAppDraft.imageUrl) ? whatsAppDraft.imageUrl : undefined,
                image_data_url: isDataUrl ? whatsAppDraft.imageUrl : undefined,
                brand_id: whatsAppDraft.brandId ?? undefined,
            });

            const sentRecipients = result.results
                .filter((item) => item.status === "sent")
                .map((item) => item.to)
                .filter(Boolean);
            const failedResults = result.results.filter((item) => item.status !== "sent");
            if (sentRecipients.length === 0) {
                const firstError = failedResults[0]?.error;
                throw new Error(firstError || "WhatsApp send failed for all recipients");
            }

            const targetName = result.verified_name || result.display_phone_number || "WhatsApp";
            await updateCrmGeneratePost(whatsAppDraft.id, {
                is_posted: true,
                posted_target_name: targetName,
                posted_recipients: sentRecipients,
            });
            await loadGeneratePosts();
            if (sentRecipients.length < recipients.length) {
                toast.error(`Sent ${sentRecipients.length}/${recipients.length}. Some numbers failed.`, { id: toastId });
            } else {
                toast.success(`WhatsApp sent to ${sentRecipients.length} recipient(s)`, { id: toastId });
            }
            setIsWhatsAppOpen(false);
            setWhatsAppDraft(null);
            setViewingGeneratePost((prev) => (
                prev && prev.id === whatsAppDraft.id
                    ? {
                        ...prev,
                        is_posted: true,
                        posted_target_name: targetName,
                        posted_recipients: sentRecipients,
                        posted_at: new Date().toISOString(),
                    }
                    : prev
            ));
        } catch (err: any) {
            toast.error(err?.message || "Failed to send WhatsApp message", { id: toastId });
        } finally {
            setIsWhatsAppSending(false);
        }
    };

    return (
        <DashboardLayout>
            <PermissionGate require="crm:read" fallback={<AccessDenied />}>
                <div className="max-w-7xl mx-auto p-4 space-y-6">
                    <header className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                        <div className="justify-self-start">
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">CRM & Relationships</h1>
                            <p className="text-slate-500">Manage influencer partnerships and track lifetime value.</p>
                        </div>
                        <div className="justify-self-center">
                            <div className="flex p-1 bg-slate-100 rounded-lg ml-6">
                                <button
                                    onClick={() => setActiveTab("portfolio")}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "portfolio"
                                        ? "bg-white text-rose-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    Portfolio
                                </button>
                                <button
                                    onClick={() => setActiveTab("category")}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "category"
                                        ? "bg-white text-rose-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    Category
                                </button>
                                <button
                                    onClick={() => setActiveTab("generate")}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "generate"
                                        ? "bg-white text-rose-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    Generate
                                </button>
                                <button
                                    onClick={() => setActiveTab("calendar")}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === "calendar"
                                        ? "bg-white text-rose-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"}`}
                                >
                                    Calendar
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 justify-self-end">
                            <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={handleFileSelected} className="hidden" />
                            <PermissionGate require="crm:create">
                                <button onClick={handleDownloadTemplate} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50">Download CRM Template</button>
                            </PermissionGate>
                            <PermissionGate require="crm:create">
                                <button onClick={handleUploadClick} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">Upload CRM File</button>
                            </PermissionGate>
                        </div>
                    </header>

                    {activeTab === "portfolio" && (
                        <div className="grid grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Active Relationships</div>
                                <div className="text-3xl font-black text-slate-900">{relationships.filter((r) => r.relationship_status === "Active").length}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Spend (YTD)</div>
                                <div className="text-3xl font-black text-slate-900">${relationships.reduce((sum, r) => sum + r.total_spend, 0).toLocaleString()}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Avg. ROI Multiple</div>
                                <div className="text-3xl font-black text-emerald-600">{relationships.length > 0 ? (relationships.reduce((sum, r) => sum + r.avg_roi, 0) / relationships.length).toFixed(1) : "0"}x</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center bg-indigo-50 border-indigo-100">
                                <button onClick={handleExport} className="flex flex-col items-center gap-2 text-indigo-700 font-bold hover:scale-105 transition-transform"><Download className="w-6 h-6" />Download Full Export</button>
                            </div>
                        </div>
                    )}

                    {activeTab === "portfolio" && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h2 className="font-bold text-slate-900">Portfolio</h2>
                                <div className="flex gap-2 items-center">
                                    <input
                                        placeholder="Search handle/category..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <PermissionGate require="crm:create">
                                        <button
                                            onClick={() => {
                                                resetPortfolioForm();
                                                setShowPortfolioModal(true);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Influencer
                                        </button>
                                    </PermissionGate>
                                </div>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-6 py-4">WhatsApp</th>
                                        <th className="px-6 py-4">Influencer</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Total Spend</th>
                                        <th className="px-6 py-4">Avg. ROI</th>
                                        <th className="px-6 py-4">Last Contact</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading relationships...</td></tr>
                                    ) : filteredRelationships.length === 0 ? (
                                        <tr><td colSpan={8} className="p-8 text-center text-slate-400">No influencers found.</td></tr>
                                    ) : filteredRelationships.map((rel) => (
                                        <tr key={`${rel.handle}-${rel.creator_id ?? "readonly"}`} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600 text-xs font-semibold">{(rel.whatsapp_numbers || []).join(", ") || "-"}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: rel.avatar_color }}>
                                                        {rel.handle.substring(1, 3).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{rel.handle}</div>
                                                        <div className="text-xs text-slate-500">{rel.platform}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {(rel.category_names || []).length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {(rel.category_names || []).map((name) => (
                                                            <span key={`${rel.handle}-${name}`} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-slate-400 text-xs">-</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${rel.relationship_status === "Active" ? "bg-emerald-100 text-emerald-700" : rel.relationship_status === "Vetted" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                                                    {rel.relationship_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-700">${rel.total_spend.toLocaleString()}</td>
                                            <td className="px-6 py-4 font-bold text-emerald-600">{rel.avg_roi}x</td>
                                            <td className="px-6 py-4 text-slate-500">{rel.last_contact}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <PermissionGate require="crm:update">
                                                        <button onClick={() => handleGenerateReport(rel.handle)} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1"><FileText className="w-4 h-4" /> X-Ray</button>
                                                    </PermissionGate>
                                                    <PermissionGate require="crm:update">
                                                        <button onClick={() => openEditPortfolio(rel)} disabled={!rel.creator_id} className={`text-slate-500 hover:text-slate-800 font-bold text-xs flex items-center gap-1 ${!rel.creator_id ? "opacity-50 cursor-not-allowed" : ""}`}><Pencil className="w-4 h-4" /> Edit</button>
                                                    </PermissionGate>
                                                    <PermissionGate require="crm:delete">
                                                        <button onClick={() => handleDeletePortfolio(rel)} disabled={!rel.creator_id} className={`text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-1 ${!rel.creator_id ? "opacity-50 cursor-not-allowed" : ""}`}><Trash2 className="w-4 h-4" /> Delete</button>
                                                    </PermissionGate>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "category" && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h2 className="font-bold text-slate-900">Category</h2>
                                <PermissionGate require="crm:create">
                                    <button
                                        onClick={() => {
                                            resetCategoryForm();
                                            setShowCategoryModal(true);
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Category
                                    </button>
                                </PermissionGate>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Brands</th>
                                        {/* <th className="px-6 py-4">User ID</th> */}
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingCategories ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading categories...</td></tr>
                                    ) : categories.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">No categories yet.</td></tr>
                                    ) : categories.map((category) => (
                                        <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-900">{category.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {category.brands.map((brand) => (
                                                        <span key={`${category.id}-${brand.id}`} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">{brand.name}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            {/* <td className="px-6 py-4 text-slate-600">{category.user_id}</td> */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <PermissionGate require="crm:update">
                                                        <button onClick={() => { setEditingCategory(category); setCategoryName(category.name); setCategoryBrandIds(category.brand_ids || []); setShowCategoryModal(true); }} className="text-slate-500 hover:text-slate-800 font-bold text-xs flex items-center gap-1"><Pencil className="w-4 h-4" /> Edit</button>
                                                    </PermissionGate>
                                                    <PermissionGate require="crm:delete">
                                                        <button onClick={() => handleDeleteCategory(category)} className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-1"><Trash2 className="w-4 h-4" /> Delete</button>
                                                    </PermissionGate>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "generate" && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-end">
                                <PermissionGate require="crm:create">
                                    <button
                                        onClick={() => {
                                            setShowGenerateBuilder(true);
                                            resetGenerateBuilder();
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create
                                    </button>
                                </PermissionGate>
                            </div>

                            {showGenerateBuilder && (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-[32px] leading-none font-bold text-slate-900">Create Post</h3>
                                            <button
                                                onClick={() => {
                                                    setShowGenerateBuilder(false);
                                                    resetGenerateBuilder();
                                                }}
                                                className="text-slate-400 hover:text-slate-600 p-1"
                                                title="Close builder"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">1</span>
                                                        Choose Platform(s)
                                                    </h2>
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Multi-select enabled</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {generatePlatforms.map((platform) => (
                                                        <button
                                                            key={platform.id}
                                                            onClick={() => toggleGeneratePlatform(platform.id)}
                                                            className={`relative p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 group ${generateSelectedPlatforms.includes(platform.id)
                                                                    ? `bg-white ${platform.border} ring-2 ring-indigo-500 ring-offset-1 shadow-md`
                                                                    : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm"
                                                                }`}
                                                        >
                                                            <div className={`p-2 rounded-lg ${platform.bg} ${platform.color} transition-transform group-hover:scale-110`}>
                                                                <platform.icon className="w-5 h-5" />
                                                            </div>
                                                            <span className={`text-xs font-bold ${generateSelectedPlatforms.includes(platform.id) ? "text-slate-800" : "text-slate-500"}`}>{platform.id}</span>
                                                            {generateSelectedPlatforms.includes(platform.id) && (
                                                                <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full"></div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-600">Post Title (Optional)</label>
                                                <input
                                                    value={generateTitle}
                                                    onChange={(e) => setGenerateTitle(e.target.value)}
                                                    placeholder="Enter post title..."
                                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-600">Brand (Optional)</label>
                                                <select
                                                    value={selectedGenerateBrandId || ""}
                                                    onChange={(e) => setSelectedGenerateBrandId(e.target.value ? Number(e.target.value) : null)}
                                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
                                                >
                                                    <option value="">No Brand</option>
                                                    {availableBrands.map((brand) => (
                                                        <option key={brand.id} value={brand.id}>
                                                            {brand.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-600">Upload File</label>
                                                <input
                                                    ref={generateFileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleGenerateImageSelected}
                                                    className="hidden"
                                                />
                                                <button
                                                    onClick={handleGenerateImagePick}
                                                    className="h-11 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    {generateImageName ? `Change Image (${generateImageName})` : "Upload Image"}
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-600">Description</label>
                                                <textarea
                                                    value={generateDescription}
                                                    onChange={(e) => setGenerateDescription(e.target.value)}
                                                    placeholder="Write caption/description..."
                                                    className="w-full min-h-[130px] border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white text-slate-900"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-[32px] leading-none font-bold text-slate-900">{generateTitle || "New Post"}</h3>
                                                <p className="text-sm text-slate-500">{generatePrimaryPlatform}{selectedGenerateBrandId ? ` • ${getBrandName(selectedGenerateBrandId) || "Brand"}` : ""}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleBuilderPost}
                                                    disabled={postingGenerateDraftId !== null}
                                                    className="flex items-center gap-2 px-3 h-10 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-60"
                                                >
                                                    <Send className="w-4 h-4" />
                                                    {postingGenerateDraftId ? "Posting..." : "Post"}
                                                </button>
                                                <button
                                                    onClick={handleOpenSchedule}
                                                    className="flex items-center gap-2 px-3 h-10 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600"
                                                >
                                                    Schedule
                                                </button>
                                                <button
                                                    onClick={handleSaveGenerateDraft}
                                                    className="flex items-center gap-2 px-4 h-10 rounded-2xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    {editingGenerateDraftId ? "Update" : "Save"}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-slate-300 p-4 min-h-[420px] bg-[#eef1f6]">
                                            {generateImagePreview ? (
                                                <img
                                                    src={generateImagePreview}
                                                    alt="Generate preview"
                                                    className="w-full max-h-[250px] object-contain rounded-lg border border-slate-200 bg-white"
                                                />
                                            ) : (
                                                <div className="h-[220px] rounded-xl border border-dashed border-slate-300 bg-white/70 flex items-center justify-center text-slate-400">
                                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                                        <ImageIcon className="w-4 h-4" />
                                                        No image uploaded yet
                                                    </div>
                                                </div>
                                            )}
                                            {generateDescription.trim() && (
                                                <div className="mt-4 rounded-xl border border-slate-300 bg-white p-3">
                                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{generateDescription}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Generate Library</h3>
                                    <span className="text-xs font-semibold text-slate-500">{generatePosts.length} saved</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {loadingGeneratePosts && (
                                        <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
                                            <div className="w-10 h-10 mx-auto border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                                            <p className="text-slate-500 font-medium">Loading posts...</p>
                                        </div>
                                    )}
                                    {!loadingGeneratePosts && generatePosts.map((draft) => {
                                        const recipients = draft.posted_recipients || [];
                                        const expanded = expandedRecipientDraftIds.has(draft.id);
                                        const visibleRecipients = expanded ? recipients : recipients.slice(0, 2);
                                        const remainingCount = Math.max(0, recipients.length - visibleRecipients.length);
                                        return (
                                            <div key={draft.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-[350px]">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wide">
                                                        {draft.platform}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 text-[11px] font-bold">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatCardDate(draft.created_at)}
                                                    </span>
                                                </div>
                                                <h4 className="text-[28px] leading-none font-black text-slate-900 mb-2">{draft.title}</h4>
                                                <p className="text-xs text-slate-500 font-semibold mb-3">Brand: {getBrandName(draft.brand_id) || "None"}</p>

                                                {draft.image_url ? (
                                                    <img
                                                        src={draft.image_url}
                                                        alt={draft.title}
                                                        className="h-36 w-full rounded-xl object-cover border border-slate-200 mb-3"
                                                    />
                                                ) : (
                                                    <div className="h-36 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-semibold mb-3">
                                                        <ImageIcon className="w-4 h-4 mr-1" /> No image
                                                    </div>
                                                )}

                                                <p className="text-sm text-slate-600 line-clamp-4 flex-1">{draft.description?.trim() || "No description"}</p>

                                                <div className="mt-3 min-h-[68px]">
                                                    {draft.is_posted ? (
                                                        <div className="space-y-2">
                                                            <div className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                                                Posted{draft.posted_target_name ? ` to ${draft.posted_target_name}` : ""}
                                                            </div>
                                                            {visibleRecipients.length > 0 && (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {visibleRecipients.map((recipient) => (
                                                                        <span key={`${draft.id}-${recipient}`} className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                                            {recipient}
                                                                        </span>
                                                                    ))}
                                                                    {remainingCount > 0 && (
                                                                        <button
                                                                            onClick={() => toggleRecipientExpansion(draft.id)}
                                                                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
                                                                        >
                                                                            +{remainingCount} more <ChevronDown className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                    {expanded && recipients.length > 2 && (
                                                                        <button
                                                                            onClick={() => toggleRecipientExpansion(draft.id)}
                                                                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
                                                                        >
                                                                            Show less <ChevronUp className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="h-full" />
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-auto">
                                                    {!draft.is_posted && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditGenerateDraft(draft.id)}
                                                                className="flex-1 text-xs font-bold text-slate-600 hover:text-violet-600 transition-colors flex items-center justify-center gap-1"
                                                            >
                                                                <Pencil className="w-3 h-3" /> Edit
                                                            </button>
                                                            <div className="w-px h-4 bg-slate-200"></div>
                                                        </>
                                                    )}

                                                    <button
                                                        onClick={() => setViewingGeneratePost(draft)}
                                                        className="flex-1 text-xs font-bold text-slate-600 hover:text-violet-600 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        View <span className="text-[11px]">→</span>
                                                    </button>

                                                    {draft.is_posted && (
                                                        <>
                                                            <div className="w-px h-4 bg-slate-200"></div>
                                                            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                Posted
                                                            </span>
                                                        </>
                                                    )}

                                                    <div className="w-px h-4 bg-slate-200"></div>
                                                    <button
                                                        onClick={() => handleDeleteGenerateDraft(draft.id)}
                                                        className="px-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {!loadingGeneratePosts && generatePosts.length === 0 && (
                                        <div className="col-span-full py-16 text-center">
                                            <p className="text-slate-500 font-medium">No saved posts yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "calendar" && (
                        <div className="min-h-[70vh] p-6 sm:p-8">
                            <ScheduledPostsCalendar
                                scope="crm"
                                title="CRM Calendar"
                                subtitle="Shows only scheduled posts from CRM Generate, including upcoming and already posted items."
                            />
                        </div>
                    )}

                    {viewingGeneratePost && (
                        <div
                            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                            onClick={() => setViewingGeneratePost(null)}
                        >
                            <div
                                className="bg-white rounded-2xl w-full max-w-5xl max-h-[88vh] overflow-hidden border border-slate-200 shadow-2xl grid grid-cols-1 lg:grid-cols-12"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="lg:col-span-8 p-6 overflow-y-auto">
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-[38px] leading-none font-black text-slate-900">{viewingGeneratePost.title}</h3>
                                        <button
                                            onClick={() => setViewingGeneratePost(null)}
                                            className="p-2 rounded-full border border-slate-200 text-slate-500 hover:text-slate-700"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        {viewingGeneratePost.image_url ? (
                                            <img
                                                src={viewingGeneratePost.image_url}
                                                alt={viewingGeneratePost.title}
                                                className="w-full max-h-[420px] object-contain rounded-xl bg-white border border-slate-200"
                                            />
                                        ) : (
                                            <div className="h-[300px] rounded-xl border border-dashed border-slate-300 bg-white/70 flex items-center justify-center text-slate-400">
                                                <div className="flex items-center gap-2 text-sm font-semibold">
                                                    <ImageIcon className="w-4 h-4" />
                                                    No image uploaded yet
                                                </div>
                                            </div>
                                        )}
                                        {viewingGeneratePost.description?.trim() && (
                                            <p className="mt-4 text-slate-700 whitespace-pre-wrap">{viewingGeneratePost.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white p-6 overflow-y-auto">
                                    <h4 className="text-2xl font-black text-slate-900 mb-4">Details</h4>
                                    <div className="space-y-3 mb-6">
                                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 flex justify-between text-sm">
                                            <span className="font-bold text-slate-500 uppercase">Platform</span>
                                            <span className="font-bold text-slate-900">{viewingGeneratePost.platform}</span>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 flex justify-between text-sm">
                                            <span className="font-bold text-slate-500 uppercase">Brand</span>
                                            <span className="font-bold text-slate-900">{getBrandName(viewingGeneratePost.brand_id) || "None"}</span>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 flex justify-between text-sm">
                                            <span className="font-bold text-slate-500 uppercase">Created</span>
                                            <span className="font-bold text-slate-900">{formatCardDate(viewingGeneratePost.created_at)}</span>
                                        </div>
                                    </div>

                                    {viewingGeneratePost.is_posted && (
                                        <div className="mb-4 space-y-2">
                                            <div className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                                Posted{viewingGeneratePost.posted_target_name ? ` to ${viewingGeneratePost.posted_target_name}` : ""}
                                            </div>
                                            {(viewingGeneratePost.posted_recipients || []).length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(viewingGeneratePost.posted_recipients || []).map((recipient) => (
                                                        <span key={`view-${viewingGeneratePost.id}-${recipient}`} className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                            {recipient}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {!viewingGeneratePost.is_posted && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        handleEditGenerateDraft(viewingGeneratePost.id);
                                                        setViewingGeneratePost(null);
                                                    }}
                                                    className="w-full h-11 rounded-xl text-sm font-bold bg-violet-600 text-white hover:bg-violet-700"
                                                >
                                                    Edit / Remix
                                                </button>
                                                <button
                                                    onClick={() => handlePostGenerateDraft(viewingGeneratePost)}
                                                    disabled={postingGenerateDraftId === viewingGeneratePost.id}
                                                    className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                                >
                                                    <Send className="w-4 h-4" />
                                                    {postingGenerateDraftId === viewingGeneratePost.id ? "Posting..." : `Post to ${viewingGeneratePost.platform}`}
                                                </button>
                                                <button
                                                    onClick={() => openScheduleForDraft(viewingGeneratePost)}
                                                    className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-amber-500 text-white hover:bg-amber-600"
                                                >
                                                    <Calendar className="w-4 h-4" />
                                                    Schedule
                                                </button>
                                            </>
                                        )}
                                        {viewingGeneratePost.is_posted && (
                                            <div className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700">
                                                <Send className="w-4 h-4" />
                                                Posted
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleDeleteGenerateDraft(viewingGeneratePost.id)}
                                            className="w-full h-11 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isScheduleOpen && scheduleDraft && (
                        <div
                            className="fixed inset-0 z-[65] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                            onClick={() => {
                                if (!isScheduling) {
                                    setIsScheduleOpen(false);
                                    setScheduleDraft(null);
                                    setScheduleWhatsAppRecipients("");
                                }
                            }}
                        >
                            <div
                                className={`bg-white rounded-2xl w-full ${scheduleDraft.platform.toLowerCase() === "whatsapp" ? "max-w-lg" : "max-w-md"} p-6 shadow-2xl border border-slate-200`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                    {scheduleDraft.platform.toLowerCase() === "whatsapp" ? "Send WhatsApp Message" : "Schedule Post"}
                                </h3>
                                <p className="text-sm text-slate-500 mb-5">
                                    {scheduleDraft.title} ({scheduleDraft.platform})
                                </p>
                                <div className="space-y-3 mb-6">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={scheduleDateTime}
                                        onChange={(e) => setScheduleDateTime(e.target.value)}
                                        min={toDateTimeLocalValue(new Date())}
                                        className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                                    />
                                    {scheduleDraft.platform.toLowerCase() === "whatsapp" && (
                                        <div className="space-y-4">
                                            <div
                                                className="space-y-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase">Category Filter</label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (filteredCategories.length === 0) return;
                                                                const ids = filteredCategories.map((category) => category.id);
                                                                setSelectedWhatsAppCategoryIds((prev) => Array.from(new Set([...prev, ...ids])));
                                                                setSelectedCrmNumbers([]);
                                                            }}
                                                            className="px-2.5 py-1 text-[11px] font-bold border border-slate-200 text-slate-600 rounded-lg"
                                                        >
                                                            Select All
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedWhatsAppCategoryIds([]);
                                                                setSelectedCrmNumbers([]);
                                                            }}
                                                            className="px-2.5 py-1 text-[11px] font-bold border border-slate-200 text-slate-600 rounded-lg"
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <div
                                                        className="w-full min-h-[44px] border border-slate-200 rounded-xl bg-white px-3 py-2 flex flex-wrap gap-2 items-center cursor-text"
                                                        onClick={() => setIsCategoryDropdownOpen(true)}
                                                    >
                                                        {selectedWhatsAppCategoryIds.length === 0 && (
                                                            <span className="text-xs text-slate-400">Search or select categories...</span>
                                                        )}
                                                        {selectedWhatsAppCategoryIds.map((id) => {
                                                            const category = categories.find((item) => item.id === id);
                                                            if (!category) return null;
                                                            return (
                                                                <span key={`schedule-chip-${id}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                                                                    {category.name}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedWhatsAppCategoryIds((prev) => prev.filter((value) => value !== id));
                                                                            setSelectedCrmNumbers([]);
                                                                        }}
                                                                        className="text-emerald-600 hover:text-emerald-800"
                                                                    >
                                                                        x
                                                                    </button>
                                                                </span>
                                                            );
                                                        })}
                                                        <input
                                                            value={categorySearch}
                                                            onChange={(e) => {
                                                                setCategorySearch(e.target.value);
                                                                setIsCategoryDropdownOpen(true);
                                                            }}
                                                            onFocus={() => setIsCategoryDropdownOpen(true)}
                                                            placeholder={selectedWhatsAppCategoryIds.length === 0 ? "" : "Search..."}
                                                            className="flex-1 min-w-[120px] border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
                                                        />
                                                    </div>
                                                    {isCategoryDropdownOpen && (
                                                        <div className="absolute z-10 mt-2 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                                                            {filteredCategories.length === 0 ? (
                                                                <p className="text-xs text-slate-500 p-3">No categories found.</p>
                                                            ) : (
                                                                filteredCategories.map((category) => {
                                                                    const checked = selectedWhatsAppCategoryIds.includes(category.id);
                                                                    return (
                                                                        <label key={`schedule-cat-${category.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={checked}
                                                                                onChange={() => {
                                                                                    setSelectedWhatsAppCategoryIds((prev) => (
                                                                                        prev.includes(category.id)
                                                                                            ? prev.filter((value) => value !== category.id)
                                                                                            : [...prev, category.id]
                                                                                    ));
                                                                                    setSelectedCrmNumbers([]);
                                                                                }}
                                                                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                                            />
                                                                            <span className="text-sm">{category.name}</span>
                                                                        </label>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Search and multi-select. Leave empty to show all numbers.
                                                </p>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase">Recipients (E.164)</label>
                                                    <button
                                                        type="button"
                                                        onClick={isAllCrmSelected ? clearAllCrmNumbers : selectAllCrmNumbers}
                                                        disabled={filteredWhatsAppContacts.length === 0}
                                                        className="px-2.5 py-1 text-[11px] font-bold border border-slate-200 text-slate-600 rounded-lg disabled:opacity-50"
                                                    >
                                                        {isAllCrmSelected ? "Deselect All" : "Select All"}
                                                    </button>
                                                </div>
                                                <div className="border border-slate-200 rounded-xl p-2 max-h-40 overflow-y-auto bg-slate-50 mb-2">
                                                    {filteredWhatsAppContacts.length === 0 ? (
                                                        <p className="text-xs text-slate-500 p-2">
                                                            {selectedWhatsAppCategoryIds.length > 0
                                                                ? "No WhatsApp numbers for this category yet."
                                                                : "No WhatsApp numbers in CRM yet."}
                                                        </p>
                                                    ) : (
                                                        filteredWhatsAppContacts.flatMap((contact) =>
                                                            (contact.whatsapp_numbers || []).map((number) => {
                                                                const id = `schedule-${contact.id}:${number}`;
                                                                const checked = selectedCrmNumbers.includes(number);
                                                                return (
                                                                    <label key={id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={checked}
                                                                            onChange={() => toggleCrmNumber(number)}
                                                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                                        />
                                                                        <span className="text-xs font-medium text-slate-700">{contact.handle} - {number}</span>
                                                                    </label>
                                                                );
                                                            })
                                                        )
                                                    )}
                                                </div>
                                                <div className="flex justify-end items-center">
                                                    <button
                                                        type="button"
                                                        onClick={addSelectedScheduleRecipients}
                                                        disabled={selectedCrmNumbers.length === 0}
                                                        className="px-3 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                                                    >
                                                        Add Selected
                                                    </button>
                                                </div>
                                                <textarea
                                                    value={scheduleWhatsAppRecipients}
                                                    onChange={(e) => setScheduleWhatsAppRecipients(e.target.value)}
                                                    placeholder="+919876543210, +919812345678"
                                                    className="w-full min-h-[90px] p-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                />
                                                <p className="text-xs text-slate-500 mt-2">
                                                    Use commas or new lines. In Meta Dev mode, only approved test numbers will receive messages.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setIsScheduleOpen(false);
                                            setScheduleDraft(null);
                                            setScheduleWhatsAppRecipients("");
                                        }}
                                        disabled={isScheduling}
                                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleScheduleSubmit}
                                        disabled={isScheduling}
                                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-60 ${
                                            scheduleDraft.platform.toLowerCase() === "whatsapp"
                                                ? "bg-emerald-600 hover:bg-emerald-700"
                                                : "bg-violet-600 hover:bg-violet-700"
                                        }`}
                                    >
                                        {isScheduling
                                            ? "Scheduling..."
                                            : scheduleDraft.platform.toLowerCase() === "whatsapp"
                                                ? "Schedule WhatsApp"
                                                : "Schedule Post"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isWhatsAppOpen && whatsAppDraft && (
                        <div
                            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                            onClick={() => {
                                if (!isWhatsAppSending) {
                                    setIsWhatsAppOpen(false);
                                    setWhatsAppDraft(null);
                                }
                            }}
                        >
                            <div
                                className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsCategoryDropdownOpen(false);
                                }}
                            >
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Send WhatsApp Message</h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    {new RegExp(`\\(WhatsApp\\)\\s*$`, "i").test(whatsAppDraft.title)
                                        ? whatsAppDraft.title
                                        : `${whatsAppDraft.title} (WhatsApp)`}
                                </p>

                                <div className="space-y-4">
                                    <div
                                        className="space-y-2"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between">
                                            <label className="block text-xs font-bold text-slate-500 uppercase">Category Filter</label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (filteredCategories.length === 0) return;
                                                        const ids = filteredCategories.map((category) => category.id);
                                                        setSelectedWhatsAppCategoryIds((prev) => Array.from(new Set([...prev, ...ids])));
                                                        setSelectedCrmNumbers([]);
                                                    }}
                                                    className="px-2.5 py-1 text-[11px] font-bold border border-slate-200 text-slate-600 rounded-lg"
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedWhatsAppCategoryIds([]);
                                                        setSelectedCrmNumbers([]);
                                                    }}
                                                    className="px-2.5 py-1 text-[11px] font-bold border border-slate-200 text-slate-600 rounded-lg"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <div
                                                className="w-full min-h-[44px] border border-slate-200 rounded-xl bg-white px-3 py-2 flex flex-wrap gap-2 items-center cursor-text"
                                                onClick={() => setIsCategoryDropdownOpen(true)}
                                            >
                                                {selectedWhatsAppCategoryIds.length === 0 && (
                                                    <span className="text-xs text-slate-400">Search or select categories...</span>
                                                )}
                                                {selectedWhatsAppCategoryIds.map((id) => {
                                                    const category = categories.find((item) => item.id === id);
                                                    if (!category) return null;
                                                    return (
                                                        <span key={`chip-${id}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                                                            {category.name}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedWhatsAppCategoryIds((prev) => prev.filter((value) => value !== id));
                                                                    setSelectedCrmNumbers([]);
                                                                }}
                                                                className="text-emerald-600 hover:text-emerald-800"
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                                <input
                                                    value={categorySearch}
                                                    onChange={(e) => {
                                                        setCategorySearch(e.target.value);
                                                        setIsCategoryDropdownOpen(true);
                                                    }}
                                                    onFocus={() => setIsCategoryDropdownOpen(true)}
                                                    placeholder={selectedWhatsAppCategoryIds.length === 0 ? "" : "Search..."}
                                                    className="flex-1 min-w-[120px] border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
                                                />
                                            </div>
                                            {isCategoryDropdownOpen && (
                                                <div className="absolute z-10 mt-2 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                                                    {filteredCategories.length === 0 ? (
                                                        <p className="text-xs text-slate-500 p-3">No categories found.</p>
                                                    ) : (
                                                        filteredCategories.map((category) => {
                                                            const checked = selectedWhatsAppCategoryIds.includes(category.id);
                                                            return (
                                                                <label key={`cat-${category.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        onChange={() => {
                                                                            setSelectedWhatsAppCategoryIds((prev) => (
                                                                                prev.includes(category.id)
                                                                                    ? prev.filter((value) => value !== category.id)
                                                                                    : [...prev, category.id]
                                                                            ));
                                                                            setSelectedCrmNumbers([]);
                                                                        }}
                                                                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                                    />
                                                                    <span className="text-sm">{category.name}</span>
                                                                </label>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Search and multi-select. Leave empty to show all numbers.
                                        </p>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-bold text-slate-500 uppercase">Recipients (E.164)</label>
                                            <button
                                                type="button"
                                                onClick={isAllCrmSelected ? clearAllCrmNumbers : selectAllCrmNumbers}
                                                disabled={filteredWhatsAppContacts.length === 0}
                                                className="px-2.5 py-1 text-[11px] font-bold border border-slate-200 text-slate-600 rounded-lg disabled:opacity-50"
                                            >
                                                {isAllCrmSelected ? "Deselect All" : "Select All"}
                                            </button>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl p-2 max-h-40 overflow-y-auto bg-slate-50 mb-2">
                                            {filteredWhatsAppContacts.length === 0 ? (
                                                <p className="text-xs text-slate-500 p-2">
                                                    {selectedWhatsAppCategoryIds.length > 0
                                                        ? "No WhatsApp numbers for this category yet."
                                                        : "No WhatsApp numbers in CRM yet."}
                                                </p>
                                            ) : (
                                                filteredWhatsAppContacts.flatMap((contact) =>
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
                                                                <span className="text-xs font-medium text-slate-700">{contact.handle} - {number}</span>
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
                                </div>

                                <div className="mt-6 flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setIsWhatsAppOpen(false);
                                            setWhatsAppDraft(null);
                                        }}
                                        disabled={isWhatsAppSending}
                                        className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleWhatsAppSend}
                                        disabled={isWhatsAppSending}
                                        className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-60"
                                    >
                                        {isWhatsAppSending ? "Sending..." : "Send WhatsApp"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showPortfolioModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && (setShowPortfolioModal(false), resetPortfolioForm())} />
                            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">{editingProfile ? "Edit Influencer" : "Add Influencer"}</h3>
                                    <button onClick={() => !saving && (setShowPortfolioModal(false), resetPortfolioForm())} className="text-slate-400 hover:text-slate-600">X</button>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Handle</label>
                                        <input value={formHandle} onChange={(e) => setFormHandle(e.target.value)} placeholder="@creator_handle" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Platform</label>
                                            <select value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                                                <option value="Instagram">Instagram</option>
                                                <option value="TikTok">TikTok</option>
                                                <option value="YouTube">YouTube</option>
                                                <option value="Twitch">Twitch</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                            <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as typeof formStatus)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                                                <option value="Active">Active</option>
                                                <option value="Vetted">Vetted</option>
                                                <option value="Past">Past</option>
                                                <option value="Blacklisted">Blacklisted</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Name (Optional)</label>
                                        <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Creator name" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Categories</label>
                                        <div className="max-h-36 overflow-auto border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1">
                                            {categories.length === 0 ? (
                                                <p className="text-xs text-slate-400 px-1 py-1">No categories available.</p>
                                            ) : categories.map((category) => (
                                                <label key={category.id} className="flex items-center gap-2 text-sm text-slate-700 px-1 py-0.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={formCategoryIds.includes(category.id)}
                                                        onChange={() => setFormCategoryIds((prev) => prev.includes(category.id) ? prev.filter((id) => id !== category.id) : [...prev, category.id])}
                                                    />
                                                    <span>{category.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">WhatsApp Numbers</label>
                                        <textarea value={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.value)} placeholder="+919876543210, +919812345678" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[90px]" />
                                        <p className="text-xs text-slate-400">Separate numbers with commas or semicolons.</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button onClick={() => !saving && (setShowPortfolioModal(false), resetPortfolioForm())} className="px-4 py-2 text-slate-500 font-bold" disabled={saving}>Cancel</button>
                                    <button onClick={handleSavePortfolio} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showCategoryModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !categorySaving && (setShowCategoryModal(false), resetCategoryForm())} />
                            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">{editingCategory ? "Edit Category" : "Add Category"}</h3>
                                    <button onClick={() => !categorySaving && (setShowCategoryModal(false), resetCategoryForm())} className="text-slate-400 hover:text-slate-600">X</button>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Category Name</label>
                                        <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Skin, Hair" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Brands</label>
                                        <div className="max-h-40 overflow-auto border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1">
                                            {categoryBrandOptions.length === 0 ? (
                                                <p className="text-xs text-slate-400 px-1 py-1">No accessible brands found.</p>
                                            ) : categoryBrandOptions.map((brand) => (
                                                <label key={brand.id} className="flex items-center gap-2 text-sm text-slate-700 px-1 py-0.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={categoryBrandIds.includes(brand.id)}
                                                        onChange={() => {
                                                            if (isBrandScopedUser) {
                                                                setCategoryBrandIds([brand.id]);
                                                                return;
                                                            }
                                                            setCategoryBrandIds((prev) => prev.includes(brand.id) ? prev.filter((id) => id !== brand.id) : [...prev, brand.id]);
                                                        }}
                                                        disabled={isBrandScopedUser}
                                                    />
                                                    <span>{brand.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {isBrandScopedUser && <p className="text-xs text-slate-500">Brand-level users can create categories only for their own brand.</p>}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button onClick={() => !categorySaving && (setShowCategoryModal(false), resetCategoryForm())} className="px-4 py-2 text-slate-500 font-bold" disabled={categorySaving}>Cancel</button>
                                    <button onClick={handleSaveCategory} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold" disabled={categorySaving}>{categorySaving ? "Saving..." : "Save"}</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </PermissionGate>
        </DashboardLayout>
    );
}

export default function CRMPage() {
    return (
        <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading CRM...</div>}>
            <CRMPageInner />
        </Suspense>
    );
}
