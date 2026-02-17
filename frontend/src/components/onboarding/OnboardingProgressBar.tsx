"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingStep } from "@/lib/api/onboarding";

interface OnboardingProgressBarProps {
    steps: OnboardingStep[];
    currentStepIndex: number;
    completedSteps: number[];
}

export function OnboardingProgressBar({
    steps,
    currentStepIndex,
    completedSteps,
}: OnboardingProgressBarProps) {
    return (
        <div className="flex items-center justify-between">
            {steps.map((step, i) => {
                const isCompleted = completedSteps.includes(i);
                const isCurrent = i === currentStepIndex;
                const isPast = i < currentStepIndex;

                return (
                    <div key={step.index} className="flex items-center flex-1 last:flex-initial">
                        {/* Step circle */}
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                                    isCompleted
                                        ? "bg-emerald-100 text-emerald-700"
                                        : isCurrent
                                        ? "bg-slate-900 text-white ring-4 ring-slate-200"
                                        : isPast
                                        ? "bg-slate-200 text-slate-600"
                                        : "bg-slate-100 text-slate-400"
                                )}
                            >
                                {isCompleted ? <Check size={16} /> : i + 1}
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] font-bold mt-1.5 text-center max-w-[80px] leading-tight",
                                    isCurrent ? "text-slate-900" : "text-slate-400"
                                )}
                            >
                                {step.title}
                            </span>
                        </div>

                        {/* Connecting line */}
                        {i < steps.length - 1 && (
                            <div
                                className={cn(
                                    "flex-1 h-0.5 mx-2 mt-[-16px]",
                                    i < currentStepIndex || isCompleted
                                        ? "bg-emerald-300"
                                        : "bg-slate-200"
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
