"use client";

import { useEffect, useState } from "react";
import { Plus, X, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepProps } from "../OnboardingWizard";

interface TeamInvite {
    email: string;
    role: "admin" | "member";
}

const inputClass = cn(
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3",
    "text-slate-900 font-medium placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
    "transition-all",
);

export function InviteTeamStep({ onNext, loading, stepData }: StepProps) {
    const [emailInput, setEmailInput] = useState("");
    const [roleInput, setRoleInput] = useState<"admin" | "member">("member");
    const [invites, setInvites] = useState<TeamInvite[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const rawInvites = Array.isArray(stepData.invites) ? stepData.invites : [];
        const normalized = rawInvites
            .map((inv) => {
                if (typeof inv !== "object" || inv === null) return null;
                const item = inv as Record<string, unknown>;
                const email = String(item.email ?? "").trim().toLowerCase();
                const role = item.role === "admin" ? "admin" : "member";
                if (!email) return null;
                return { email, role } as TeamInvite;
            })
            .filter(Boolean) as TeamInvite[];
        setInvites(normalized);
    }, [stepData]);

    const handleAdd = () => {
        const email = emailInput.trim().toLowerCase();
        if (!email) return;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        if (invites.some((inv) => inv.email === email)) {
            setError("This email has already been added.");
            return;
        }

        setInvites((prev) => [...prev, { email, role: roleInput }]);
        setEmailInput("");
        setError("");
    };

    const handleRemove = (email: string) => {
        setInvites((prev) => prev.filter((inv) => inv.email !== email));
    };

    const handleRoleChange = (email: string, role: "admin" | "member") => {
        setInvites((prev) =>
            prev.map((inv) => (inv.email === email ? { ...inv, role } : inv)),
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext({ invites });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Team Member Email
                </label>
                <div className="flex gap-3">
                    <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => { setEmailInput(e.target.value); setError(""); }}
                        onKeyDown={handleKeyDown}
                        placeholder="colleague@company.com"
                        className={cn(inputClass, "flex-1")}
                    />
                    <select
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value as "admin" | "member")}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                </div>
                {error && (
                    <p className="text-red-500 text-sm font-medium mt-1.5">{error}</p>
                )}
            </div>

            {invites.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-600">
                        {invites.length} invite{invites.length !== 1 ? "s" : ""} queued
                    </p>
                    <div className="space-y-2">
                        {invites.map(({ email, role }) => (
                            <div
                                key={email}
                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium text-slate-800 text-sm">{email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={role}
                                        onChange={(e) =>
                                            handleRoleChange(email, e.target.value as "admin" | "member")
                                        }
                                        className="text-sm font-bold text-slate-600 bg-transparent border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(email)}
                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {invites.length > 0 ? "Send Invitations" : "Skip for Now"}
            </button>
        </form>
    );
}
