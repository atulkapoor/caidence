"use client";

import React, { useState, useEffect } from "react";
import { FileText, Download, LayoutTemplate, Printer, AlertCircle } from "lucide-react";
import dynamic from 'next/dynamic';


const PDFDownloadButton = dynamic(() => import("./CollateralPDF"), {
    ssr: false,
    loading: () => <button className="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm">Loading PDF Engine...</button>
});

export function CollateralGenerator() {
    const [isClient, setIsClient] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        content: "",
        template: "flyer"
    });

    // Fix hydration mismatch for PDF renderer
    useEffect(() => {
        setIsClient(true);
    }, []);

    const templates = [
        { id: "flyer", name: "Product Flyer", icon: <LayoutTemplate className="w-5 h-5 text-blue-600" /> },
        { id: "ebook", name: "E-Book Chapter", icon: <FileText className="w-5 h-5 text-purple-600" /> },
        { id: "brochure", name: "Tri-Fold Brochure", icon: <Printer className="w-5 h-5 text-emerald-600" /> }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h2 className="text-xl font-bold text-slate-900">Content Editor</h2>
                        <div className="flex gap-2">
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setFormData({ ...formData, template: t.id })}
                                    className={`p-2 rounded-lg border transition-all ${formData.template === t.id
                                        ? "bg-slate-50 border-blue-500 shadow-sm"
                                        : "border-slate-100 hover:bg-slate-50"
                                        }`}
                                    title={t.name}
                                >
                                    {t.icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Document Title</label>
                            <input
                                placeholder="e.g. Q1 Marketing Report"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Subtitle / Tagline</label>
                            <input
                                placeholder="e.g. Confidential Analysis"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={formData.subtitle}
                                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Body Content</label>
                            <textarea
                                placeholder="Enter your main content here..."
                                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[200px]"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            />
                            <div className="flex justify-between mt-2">
                                <button className="text-xs font-bold text-blue-600 hover:underline">✨ Enhance with AI</button>
                                <span className="text-xs text-slate-400">{formData.content.length} characters</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="bg-slate-900 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center relative min-h-[500px]">
                    <div className="absolute top-4 right-4">
                        {isClient && (
                            <PDFDownloadButton
                                data={formData}
                                fileName={`${formData.title || "document"}.pdf`}
                            />
                        )}
                    </div>

                    <div className="mb-6 text-white text-center">
                        <h3 className="font-bold text-lg">Live Preview</h3>
                        <p className="text-slate-400 text-sm">A4 • {formData.template} Template</p>
                    </div>

                    {/* Paper Mockup */}
                    <div className="bg-white w-[300px] h-[424px] shadow-2xl rounded-sm p-8 flex flex-col transform transition-transform hover:scale-105 duration-300">
                        <div className="border-b-2 border-slate-100 pb-4 mb-4">
                            <div className="h-6 w-3/4 bg-slate-900 rounded mb-2 overflow-hidden">
                                {formData.title && <span className="text-xs text-white px-1 block pt-1">{formData.title.substring(0, 20)}</span>}
                            </div>
                            <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
                        </div>
                        <div className="space-y-2 flex-1">
                            {formData.content ? (
                                <p className="text-[6px] text-slate-600 overflow-hidden text-ellipsis h-full">
                                    {formData.content}
                                </p>
                            ) : (
                                <>
                                    <div className="h-2 w-full bg-slate-100 rounded"></div>
                                    <div className="h-2 w-full bg-slate-100 rounded"></div>
                                    <div className="h-2 w-5/6 bg-slate-100 rounded"></div>
                                    <div className="h-2 w-4/6 bg-slate-100 rounded"></div>
                                </>
                            )}
                        </div>
                        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-center">
                            <div className="h-2 w-24 bg-slate-100 rounded"></div>
                        </div>
                    </div>

                    {!isClient && (
                        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-2xl">
                            <span className="text-white font-bold">Loading Preview Engine...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
