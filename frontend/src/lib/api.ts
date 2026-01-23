


const API_BASE_URL = "/api/proxy/v1";

// --- Auth Helper ---
async function getAuthHeaders(): Promise<HeadersInit> {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem("token") : null;
    return token ? {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    } : { "Content-Type": "application/json" };
}

export async function login(data: any) {
    const params = new URLSearchParams();
    params.append('username', data.email);
    params.append('password', data.password);

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Login failed");
    }

    return res.json();
}

export async function register(data: any) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Registration failed");
    }

    return res.json();
}

export interface DashboardStats {
    active_campaigns: number;
    active_campaigns_growth: number;
    ai_workflows: number;
    content_generated: number;
    ai_conversations: number;
}

export interface ActivityLog {
    id: number;
    action: string;
    details: string;
    timestamp: string;
    user_id?: number;
}

export interface Project {
    id: number;
    name: string;
    objective: string;
    project_type: string;
    status: string;
    created_at: string;
    owner_id?: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
}

export async function fetchActivities(): Promise<ActivityLog[]> {
    const res = await fetch(`${API_BASE_URL}/dashboard/activities`);
    if (!res.ok) throw new Error("Failed to fetch activities");
    return res.json();
}

export async function createProject(project: { name: string; objective: string; project_type: string }): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/projects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
    });
    if (!res.ok) throw new Error("Failed to create project");
    return res.json();
}

// --- Content Studio ---
export interface ContentGeneration {
    id: number;
    title: string;
    platform: string;
    content_type: string;
    prompt: string;
    result: string;
    created_at: string;
}

export async function generateContent(data: { title: string; platform: string; content_type: string; prompt: string }): Promise<ContentGeneration> {
    const res = await fetch(`${API_BASE_URL}/content/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to generate content");
    return res.json();
}

export async function fetchContentGenerations(): Promise<ContentGeneration[]> {
    const res = await fetch(`${API_BASE_URL}/content/`);
    if (!res.ok) throw new Error("Failed to fetch content history");
    return res.json();
}

export async function fetchContentGenerationById(id: number): Promise<ContentGeneration> {
    const res = await fetch(`${API_BASE_URL}/content/${id}`);
    if (!res.ok) throw new Error("Failed to fetch content details");
    return res.json();
}

// --- Design Studio ---
export interface DesignAsset {
    id: number;
    title: string;
    style: string;
    aspect_ratio: string;
    prompt: string;
    image_url: string;
    created_at: string;
    brand_colors?: string;
    reference_image?: string;
}

export async function generateDesign(data: { title: string; style: string; aspect_ratio: string; prompt: string; brand_colors?: string; reference_image?: string }): Promise<DesignAsset> {
    const res = await fetch(`${API_BASE_URL}/design/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to generate design");
    return res.json();
}

export async function fetchDesignAssets(): Promise<DesignAsset[]> {
    const res = await fetch(`${API_BASE_URL}/design/`);
    if (!res.ok) throw new Error("Failed to fetch design assets");
    return res.json();
}

export async function fetchDesignAssetById(id: number): Promise<DesignAsset> {
    const res = await fetch(`${API_BASE_URL}/design/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch design asset with id ${id}`);
    return res.json();
}

// --- Presentation Studio ---
export interface Presentation {
    id: number;
    title: string;
    source_type: string;
    slides_json: Record<string, unknown>;
    slide_count: number;
    created_at: string;
}

export async function fetchPresentations(): Promise<Presentation[]> {
    const res = await fetch(`${API_BASE_URL}/presentation/`);
    if (!res.ok) throw new Error("Failed to fetch presentations");
    return res.json();
}

export async function fetchPresentationById(id: number): Promise<Presentation> {
    const res = await fetch(`${API_BASE_URL}/presentation/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch presentation with id ${id}`);
    return res.json();
}

export async function generatePresentation(data: { title: string; source_type: string }): Promise<Presentation> {
    const res = await fetch(`${API_BASE_URL}/presentation/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to generate presentation");
    return res.json();
}

// --- Workflow Studio ---
export interface Workflow {
    id: number;
    name: string;
    description: string;
    status: string;
    steps_json: string;
    run_count: number;
    last_run?: string;
    created_at: string;
}

export interface WorkflowRun {
    id: number;
    workflow_id: number;
    status: string;
    logs: string;
    started_at: string;
    completed_at?: string;
}

export async function fetchWorkflows(): Promise<Workflow[]> {
    const res = await fetch(`${API_BASE_URL}/workflow`);
    if (!res.ok) throw new Error("Failed to fetch workflows");
    return res.json();
}

export async function createWorkflow(data: { name: string; description: string; steps_json: string }): Promise<Workflow> {
    const res = await fetch(`${API_BASE_URL}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errText = await res.text();
        console.error("Create Workflow Error:", errText);
        throw new Error(`Failed to create workflow: ${errText}`);
    }
    return res.json();
}

export async function updateWorkflow(id: number, data: { name: string; description: string; steps_json: string }): Promise<Workflow> {
    const res = await fetch(`${API_BASE_URL}/workflow/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update workflow");
    return res.json();
}

export async function fetchWorkflowById(id: number): Promise<Workflow> {
    const res = await fetch(`${API_BASE_URL}/workflow/${id}`);
    if (!res.ok) throw new Error("Failed to fetch workflow");
    return res.json();
}

export async function fetchWorkflowHistory(id: number): Promise<WorkflowRun[]> {
    const res = await fetch(`${API_BASE_URL}/workflow/${id}/history`);
    if (!res.ok) throw new Error("Failed to fetch workflow history");
    return res.json();
}

export async function runWorkflow(id: number): Promise<WorkflowRun> {
    const res = await fetch(`${API_BASE_URL}/workflow/${id}/run`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to run workflow");
    return res.json();
}

// --- Chat ---
export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
}

export async function sendChatMessage(message: string, session_id?: string): Promise<{ response: string; session_id: string }> {
    const res = await fetch(`${API_BASE_URL}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
}

export async function fetchChatHistory(session_id: string): Promise<ChatMessage[]> {
    const res = await fetch(`${API_BASE_URL}/chat/history/${session_id}`);
    if (!res.ok) throw new Error("Failed to fetch chat history");
    return res.json();
}


// --- Campaigns ---
export interface Campaign {
    id: number;
    title: string;
    description?: string;
    status: string;
    progress?: number;
    budget?: string;
    spent?: string;
    channels?: string[];
    created_at: string;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
    const res = await fetch(`${API_BASE_URL}/campaigns/`);
    if (!res.ok) throw new Error("Failed to fetch campaigns");
    return res.json();
}

export async function createCampaign(data: { title: string; description?: string; status?: string }): Promise<Campaign> {
    const res = await fetch(`${API_BASE_URL}/campaigns/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create campaign");
    return res.json();
}

export async function updateCampaign(id: number, data: Partial<Campaign>): Promise<Campaign> {
    const res = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update campaign");
    return res.json();
}

// --- Agent ---
export interface CampaignDraft {
    title: string;
    description: string;
    budget: string;
    channels: string[];
    agent_logs?: string[];
    alternative_draft?: CampaignDraft;
}

export async function generateCampaignPlan(goal: string, product: string, audience: string): Promise<CampaignDraft> {
    const res = await fetch(`${API_BASE_URL}/agent/draft_campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, product, audience }),
    });
    if (!res.ok) throw new Error("Failed to generate campaign details");
    return res.json();
}

export async function fetchCampaignAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/campaigns/analytics/stats`);
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
}

// --- CPaaS API ---
export const fetchCommunicationStatus = async () => {
    const response = await fetch(`${API_BASE_URL}/communications/status`);
    if (!response.ok) throw new Error("Failed to fetch communication status");
    return response.json();
};

export const sendTestEmail = async (to_email: string, subject: string, body: string) => {
    const response = await fetch(`${API_BASE_URL}/communications/send/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_email, subject, body }),
    });
    if (!response.ok) throw new Error("Failed to send email");
    return response.json();
};

export const sendTestSMS = async (phone_number: string, message: string) => {
    const response = await fetch(`${API_BASE_URL}/communications/send/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number, message }),
    });
    if (!response.ok) throw new Error("Failed to send SMS");
    return response.json();
};

export const sendTestWhatsApp = async (phone_number: string, content: string) => {
    const response = await fetch(`${API_BASE_URL}/communications/send/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number, content }),
    });
    if (!response.ok) throw new Error("Failed to send WhatsApp");
    return response.json();
};

export interface AudienceOverlapResponse {
    total_reach: number;
    unique_reach: number;
    overlap_percentage: number;
    channel_breakdown: {
        channel: string;
        reach: number;
        color: string;
    }[];
    message: string;
}

export async function fetchAudienceOverlap(channels: string[]): Promise<AudienceOverlapResponse> {
    const res = await fetch(`${API_BASE_URL}/analytics/audience-overlap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels }),
    });
    if (!res.ok) throw new Error("Failed to fetch overlap data");
    return res.json();
}

export interface CompetitorAnalysisResponse {
    breakdown: {
        name: string;
        share_of_voice: number;
        sentiment: string;
        top_hashtags: string[];
        recent_activity: string;
    }[];
}

export async function fetchCompetitorAnalysis(competitors: string[]): Promise<CompetitorAnalysisResponse> {
    const res = await fetch(`${API_BASE_URL}/analytics/competitor-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors }),
    });
    if (!res.ok) throw new Error("Failed to fetch competitor analysis");
    return res.json();
}

// --- Discovery ---
export interface InfluencerProfile {
    handle: string;
    platform: string;
    avatar_color: string;
    followers: number;
    engagement_rate: number;
    content_style_match: string[];
    voice_analysis: string[];
    image_recognition_tags: string[];
    audience_demographics: string;
    match_score: number;
}

export async function searchInfluencers(query: string, filters?: any): Promise<InfluencerProfile[]> {
    const res = await fetch(`${API_BASE_URL}/discovery/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, filters }),
    });
    if (!res.ok) throw new Error("Failed to search influencers");
    return res.json();
}

// --- CRM ---
export interface CampaignHistory {
    campaign_name: string;
    date: string;
    roi_multiple: number;
    status: string;
}

export interface RelationshipProfile {
    handle: string;
    platform: string;
    avatar_color: string;
    relationship_status: "Active" | "Vetted" | "Past" | "Blacklisted";
    total_spend: number;
    avg_roi: number;
    last_contact: string;
    campaign_history: CampaignHistory[];
}

export async function fetchRelationships(): Promise<RelationshipProfile[]> {
    const res = await fetch(`${API_BASE_URL}/crm/relationships`);
    if (!res.ok) throw new Error("Failed to fetch relationships");
    return res.json();
}

export async function generateXRayReport(handle: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/crm/generate-report?handle=${handle}`, {
        method: "POST"
    });
    if (!res.ok) throw new Error("Failed to generate report");
    return res.json();
}

// --- Admin API ---
export interface AdminUser {
    id: number;
    email: string;
    full_name: string;
    role: string;
    organization_id: number | null;
    is_active: boolean;
    is_approved: boolean;
    created_at: string;
}

export interface TeamInvite {
    email: string;
    full_name: string;
    role: string;
    password: string;
    organization_id?: number;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/admin/users`, { headers });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
}

export async function approveUser(userId: number): Promise<AdminUser> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ is_approved: true }),
    });
    if (!res.ok) throw new Error("Failed to approve user");
    return res.json();
}

export async function inviteUser(data: TeamInvite): Promise<AdminUser> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/admin/invite`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to invite user");
    }
    return res.json();
}
