"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, SkipForward, Check, Loader2 } from "lucide-react";
import {
    updateOnboardingStep,
    completeOnboarding,
    type OnboardingProgress,
    type OnboardingStep,
} from "@/lib/api/onboarding";
import { OnboardingProgressBar } from "./OnboardingProgressBar";
import { ProfileTypeStep } from "./steps/ProfileTypeStep";
import { CompanyInfoStep } from "./steps/CompanyInfoStep";
import { BrandingStep } from "./steps/BrandingStep";
import { ConnectSocialsStep } from "./steps/ConnectSocialsStep";
import { InviteTeamStep } from "./steps/InviteTeamStep";
import { CreateBrandStep } from "./steps/CreateBrandStep";
import { BrandIdentityStep } from "./steps/BrandIdentityStep";
import { TargetAudienceStep } from "./steps/TargetAudienceStep";
import { BrandGuidelinesStep } from "./steps/BrandGuidelinesStep";
import { PersonalInfoStep } from "./steps/PersonalInfoStep";
import { PortfolioStep } from "./steps/PortfolioStep";
import { RateCardStep } from "./steps/RateCardStep";

interface OnboardingWizardProps {
    initialProgress: OnboardingProgress;
}

// Map step names to components
const STEP_COMPONENTS: Record<string, React.ComponentType<StepProps>> = {
    profile_type: ProfileTypeStep,
    company_info: CompanyInfoStep,
    branding: BrandingStep,
    connect_socials: ConnectSocialsStep,
    invite_team: InviteTeamStep,
    create_brand: CreateBrandStep,
    brand_identity: BrandIdentityStep,
    target_audience: TargetAudienceStep,
    brand_guidelines: BrandGuidelinesStep,
    personal_info: PersonalInfoStep,
    portfolio: PortfolioStep,
    rate_card: RateCardStep,
};

export interface StepProps {
    onNext: (data: Record<string, unknown>) => void;
    onProfileTypeSelect?: (type: string) => void;
    stepData: Record<string, unknown>;
    loading: boolean;
}

export function OnboardingWizard({ initialProgress }: OnboardingWizardProps) {
    const router = useRouter();
    const [progress, setProgress] = useState(initialProgress);
    const [currentStepIndex, setCurrentStepIndex] = useState(initialProgress.current_step);
    const [stepData, setStepData] = useState<Record<string, unknown>>({});
    const [saving, setSaving] = useState(false);

    const steps = progress.steps;
    const currentStep: OnboardingStep | undefined = steps[currentStepIndex];
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;
    const isCompleted = progress.completed_steps.includes(currentStepIndex);

    const handleNext = useCallback(
        async (data: Record<string, unknown>, profileType?: string) => {
            setSaving(true);
            try {
                const updated = await updateOnboardingStep(
                    currentStepIndex,
                    data,
                    profileType,
                );
                setProgress(updated);
                setStepData({});

                if (isLastStep) {
                    // Try to complete onboarding
                    try {
                        await completeOnboarding();
                        toast.success("Welcome to C(AI)DENCE!");
                        router.push("/dashboard");
                    } catch (e) {
                        const msg = e instanceof Error ? e.message : "Cannot complete onboarding yet";
                        toast.error(msg);
                    }
                } else {
                    setCurrentStepIndex((prev) => prev + 1);
                }
            } catch {
                toast.error("Failed to save progress");
            } finally {
                setSaving(false);
            }
        },
        [currentStepIndex, isLastStep, router],
    );

    const handleBack = () => {
        if (!isFirstStep) {
            setCurrentStepIndex((prev) => prev - 1);
            setStepData({});
        }
    };

    const handleSkip = async () => {
        if (currentStep?.skippable) {
            setSaving(true);
            try {
                const updated = await updateOnboardingStep(currentStepIndex, {});
                setProgress(updated);
                setStepData({});
                setCurrentStepIndex((prev) => prev + 1);
            } catch {
                toast.error("Failed to skip step");
            } finally {
                setSaving(false);
            }
        }
    };

    const handleProfileTypeSelect = (type: string) => {
        handleNext({ profile_type: type }, type);
    };

    const StepComponent = currentStep ? STEP_COMPONENTS[currentStep.name] : null;

    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            {/* Progress bar */}
            <OnboardingProgressBar
                steps={steps}
                currentStepIndex={currentStepIndex}
                completedSteps={progress.completed_steps}
            />

            {/* Step title */}
            <div className="mt-10 mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    {currentStep?.title || "Welcome"}
                </h1>
                <p className="text-slate-500 mt-2 font-medium">
                    Step {currentStepIndex + 1} of {steps.length}
                    {currentStep?.required && (
                        <span className="text-red-400 ml-2 text-sm">Required</span>
                    )}
                </p>
            </div>

            {/* Step content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                {StepComponent ? (
                    <StepComponent
                        onNext={(data) => handleNext(data)}
                        onProfileTypeSelect={
                            currentStep?.name === "profile_type"
                                ? handleProfileTypeSelect
                                : undefined
                        }
                        stepData={stepData}
                        loading={saving}
                    />
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <p>This step is coming soon.</p>
                    </div>
                )}
            </div>

            {/* Navigation buttons */}
            {currentStep?.name !== "profile_type" && (
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={handleBack}
                        disabled={isFirstStep || saving}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>

                    <div className="flex items-center gap-3">
                        {currentStep?.skippable && !isCompleted && (
                            <button
                                onClick={handleSkip}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-30"
                            >
                                <SkipForward size={14} />
                                Skip
                            </button>
                        )}

                        {isCompleted && !isLastStep && (
                            <button
                                onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        )}

                        {isLastStep && (
                            <button
                                onClick={async () => {
                                    setSaving(true);
                                    try {
                                        await completeOnboarding();
                                        toast.success("Welcome to C(AI)DENCE!");
                                        router.push("/dashboard");
                                    } catch (e) {
                                        const msg = e instanceof Error ? e.message : "Please complete all required steps";
                                        toast.error(msg);
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                Complete Setup
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
