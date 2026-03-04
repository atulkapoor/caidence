"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepProps } from "../OnboardingWizard";

const inputClass = cn(
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3",
    "text-slate-900 font-medium placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
    "transition-all",
);

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

function normalizeHexColor(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toUpperCase() : null;
}

export function BrandingStep({ onNext, loading, stepData }: StepProps) {
    const [primaryColor, setPrimaryColor] = useState("#0f172a");
    const [secondaryColor, setSecondaryColor] = useState("#64748b");
    const [primaryColorText, setPrimaryColorText] = useState("#0F172A");
    const [secondaryColorText, setSecondaryColorText] = useState("#64748B");
    const [headingFont, setHeadingFont] = useState("");
    const [bodyFont, setBodyFont] = useState("");
    const [logoDataUrl, setLogoDataUrl] = useState("");
    const [logoFileName, setLogoFileName] = useState("");
    const [logoError, setLogoError] = useState("");
    const [colorError, setColorError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedPrimary = normalizeHexColor(String(stepData.primary_color ?? "#0f172a")) ?? "#0F172A";
        const savedSecondary = normalizeHexColor(String(stepData.secondary_color ?? "#64748b")) ?? "#64748B";
        setPrimaryColor(savedPrimary.toLowerCase());
        setSecondaryColor(savedSecondary.toLowerCase());
        setPrimaryColorText(savedPrimary);
        setSecondaryColorText(savedSecondary);
        setHeadingFont(String(stepData.heading_font ?? ""));
        setBodyFont(String(stepData.body_font ?? ""));
        setLogoDataUrl(String(stepData.logo_data_url ?? ""));
        setLogoFileName(String(stepData.logo_file_name ?? ""));
    }, [stepData]);

    const processLogoFile = (file: File) => {
        if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
            setLogoError("Only PNG, JPG, or SVG files are allowed.");
            return;
        }
        if (file.size > MAX_LOGO_SIZE_BYTES) {
            setLogoError("Logo file must be 5MB or smaller.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === "string") {
                setLogoDataUrl(result);
                setLogoFileName(file.name);
                setLogoError("");
            } else {
                setLogoError("Failed to read the selected file.");
            }
        };
        reader.onerror = () => setLogoError("Failed to read the selected file.");
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedPrimary = normalizeHexColor(primaryColorText);
        const normalizedSecondary = normalizeHexColor(secondaryColorText);

        if (!normalizedPrimary || !normalizedSecondary) {
            setColorError("Use valid 6-digit hex colors, e.g. #0F172A.");
            return;
        }

        setColorError("");
        onNext({
            primary_color: normalizedPrimary,
            secondary_color: normalizedSecondary,
            heading_font: headingFont,
            body_font: bodyFont,
            logo_data_url: logoDataUrl,
            logo_file_name: logoFileName,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        Primary Color
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5">
                        <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => {
                                const value = e.target.value.toUpperCase();
                                setPrimaryColor(value.toLowerCase());
                                setPrimaryColorText(value);
                                if (colorError) setColorError("");
                            }}
                            className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                        />
                        <input
                            type="text"
                            value={primaryColorText}
                            onChange={(e) => setPrimaryColorText(e.target.value)}
                            onBlur={() => {
                                const normalized = normalizeHexColor(primaryColorText);
                                if (normalized) {
                                    setPrimaryColor(normalized.toLowerCase());
                                    setPrimaryColorText(normalized);
                                }
                            }}
                            placeholder="#0F172A"
                            className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                        Secondary Color
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5">
                        <input
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => {
                                const value = e.target.value.toUpperCase();
                                setSecondaryColor(value.toLowerCase());
                                setSecondaryColorText(value);
                                if (colorError) setColorError("");
                            }}
                            className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                        />
                        <input
                            type="text"
                            value={secondaryColorText}
                            onChange={(e) => setSecondaryColorText(e.target.value)}
                            onBlur={() => {
                                const normalized = normalizeHexColor(secondaryColorText);
                                if (normalized) {
                                    setSecondaryColor(normalized.toLowerCase());
                                    setSecondaryColorText(normalized);
                                }
                            }}
                            placeholder="#64748B"
                            className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                        />
                    </div>
                </div>
            </div>
            {colorError && <p className="-mt-2 text-xs font-medium text-red-500">{colorError}</p>}

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Heading Font
                </label>
                <input
                    type="text"
                    value={headingFont}
                    onChange={(e) => setHeadingFont(e.target.value)}
                    placeholder="e.g. Inter, Playfair Display"
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Body Font
                </label>
                <input
                    type="text"
                    value={bodyFont}
                    onChange={(e) => setBodyFont(e.target.value)}
                    placeholder="e.g. Inter, DM Sans"
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Upload Logo
                </label>
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            fileInputRef.current?.click();
                        }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const droppedFile = e.dataTransfer.files?.[0];
                        if (droppedFile) processLogoFile(droppedFile);
                    }}
                    className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center hover:border-slate-400 transition-colors cursor-pointer"
                >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">PNG, JPG, SVG up to 5MB</p>
                    {logoFileName && <p className="text-xs mt-2 font-medium text-slate-600">{logoFileName}</p>}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                        className="sr-only"
                        onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) processLogoFile(selectedFile);
                        }}
                    />
                </div>
                {logoError && <p className="mt-1 text-xs font-medium text-red-500">{logoError}</p>}
                {logoDataUrl && !logoError && (
                    <img
                        src={logoDataUrl}
                        alt="Uploaded logo preview"
                        className="mt-3 h-14 max-w-full rounded-md border border-slate-200 object-contain bg-white p-1"
                    />
                )}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue
            </button>
        </form>
    );
}
