"use client";

import { useState } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";

interface Brand {
    id: number;
    name: string;
    industry?: string;
}

interface BrandSwitcherProps {
    currentBrand?: Brand;
    brands: Brand[];
    onBrandChange: (brand: Brand) => void;
}

export function BrandSwitcher({ currentBrand, brands, onBrandChange }: BrandSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors w-full"
            >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {currentBrand?.name.charAt(0) || "?"}
                </div>
                <div className="flex-1 text-left">
                    <div className="font-bold text-sm text-slate-900">
                        {currentBrand?.name || "Select Brand"}
                    </div>
                    <div className="text-xs text-slate-400">
                        {currentBrand?.industry || "No brand selected"}
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="p-2 border-b border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
                                Switch Brand
                            </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-1">
                            {brands.map((brand) => (
                                <button
                                    key={brand.id}
                                    onClick={() => {
                                        onBrandChange(brand);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors ${currentBrand?.id === brand.id ? "bg-indigo-50" : ""
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                        {brand.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium text-sm text-slate-900">{brand.name}</div>
                                        <div className="text-xs text-slate-400">{brand.industry}</div>
                                    </div>
                                    {currentBrand?.id === brand.id && (
                                        <Check className="w-4 h-4 text-indigo-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="p-2 border-t border-slate-100">
                            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium">
                                <Building2 className="w-4 h-4" />
                                Manage Brands
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
