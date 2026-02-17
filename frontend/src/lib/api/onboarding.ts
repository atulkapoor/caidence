import { API_BASE_URL, authenticatedFetch } from "./core";

export interface OnboardingStep {
    index: number;
    name: string;
    title: string;
    required: boolean;
    skippable: boolean;
}

export interface OnboardingProgress {
    current_step: number;
    profile_type: string | null;
    is_complete: boolean;
    steps: OnboardingStep[];
    completed_steps: number[];
}

export async function getOnboardingProgress(): Promise<OnboardingProgress> {
    const res = await authenticatedFetch(`${API_BASE_URL}/onboarding/progress`);
    if (!res.ok) throw new Error("Failed to fetch onboarding progress");
    return res.json();
}

export async function updateOnboardingStep(
    stepIndex: number,
    stepData: Record<string, unknown>,
    profileType?: string,
): Promise<OnboardingProgress> {
    const res = await authenticatedFetch(`${API_BASE_URL}/onboarding/progress`, {
        method: "PUT",
        body: JSON.stringify({
            step_index: stepIndex,
            step_data: stepData,
            profile_type: profileType,
        }),
    });
    if (!res.ok) throw new Error("Failed to update onboarding step");
    return res.json();
}

export async function completeOnboarding(): Promise<{ is_complete: boolean; profile_type: string; completed_at: string }> {
    const res = await authenticatedFetch(`${API_BASE_URL}/onboarding/complete`, { method: "POST" });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to complete onboarding");
    }
    return res.json();
}
