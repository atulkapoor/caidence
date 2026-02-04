"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Send, Sparkles, Paperclip, User, Bot, Crown, ArrowRight } from "lucide-react";
import { usePreferences } from "@/context/PreferencesContext";
import { TypewriterEffect } from "@/components/ui/TypewriterEffect";

const QUICK_PROMPTS: Record<string, string[]> = {
    "Technology": ["Draft a SaaS onboarding email", "Analyze churn metrics", "Feature announcement post", "Competitor battlecard"],
    "Real Estate": ["Write a listing description", "Market update for buyers", "Open house checklist", "Neighborhood guide"],
    "E-Commerce": ["Black Friday campaign ideas", "Abandoned cart email", "Product description generator", "Ad copy for Instagram"],
    "Healthcare": ["Patient welcome packet", "Telehealth guidelines", "Wellness newsletter topic", "Appointment reminder script"]
};

export default function AIChatPage() {
    const { industry } = usePreferences();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && !selectedFile) || isLoading) return;

        let userMsg = input;
        const attachedFile = selectedFile; // Capture current file

        // Client-side file reading for context
        if (attachedFile) {
            const isText = attachedFile.type.startsWith('text/') ||
                attachedFile.name.endsWith('.md') ||
                attachedFile.name.endsWith('.csv') ||
                attachedFile.name.endsWith('.json') ||
                attachedFile.name.endsWith('.ts') ||
                attachedFile.name.endsWith('.tsx') ||
                attachedFile.name.endsWith('.py');

            if (isText) {
                try {
                    const text = await attachedFile.text();
                    userMsg = `${userMsg}\n\n[Attached File: ${attachedFile.name}]\n\`\`\`\n${text.substring(0, 20000)}\n\`\`\``; // Limit context
                } catch (e) {
                    console.error("Failed to read file", e);
                }
            } else {
                userMsg = `${userMsg} [Attached File: ${attachedFile.name} (Content not read - binary format)]`;
            }
        }

        setInput("");
        setSelectedFile(null); // Clear file after sending
        setIsLoading(true);

        // Optimistic Update
        const displayContent = attachedFile
            ? `[Attached: ${attachedFile.name}] ${input}`
            : input;

        const newMsg = { role: "user", content: displayContent }; // Show short version in UI
        const apiMsg = { role: "user", content: userMsg }; // Send full content to API

        setMessages(prev => [...prev, newMsg]);

        try {
            // @ts-ignore
            const { sendChatMessage } = await import("@/lib/api");

            // Send full content (including file text) to backend
            const res = await sendChatMessage(userMsg, sessionId || undefined);

            if (!sessionId) {
                setSessionId(res.session_id);
            }

            setMessages(prev => [...prev, { role: "assistant", content: res.response }]);
        } catch (error) {
            console.error("Chat failed", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Error: Could not reach the AI. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredMessages = messages.filter(msg =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-140px)] gap-6">
                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Chat Header */}
                    <div className="h-16 border-b border-slate-100 flex items-center px-6 justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900">C(AI)DENCE Assistant</h2>
                                <p className="text-xs text-slate-500 font-medium">Always active • {industry || "Strategy"} Expert</p>
                            </div>
                        </div>
                        {/* Search Bar */}
                        <div className="relative block">
                            <input
                                type="text"
                                placeholder="Search chat..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-48 bg-white"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/30 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
                                    <Bot className="w-10 h-10 text-slate-400" />
                                </div>
                                <p className="font-bold text-lg text-slate-400">Start a conversation about {industry || "Marketing Strategy"}</p>
                            </div>
                        )}

                        {(searchQuery ? filteredMessages : messages).map((msg, idx) => (
                            <div key={idx} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-teal-600 text-white'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className={`space-y-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                                    <div className="font-bold text-sm text-slate-900">{msg.role === 'user' ? 'You' : 'C(AI)DENCE AI'}</div>
                                    <div className={`p-4 rounded-2xl shadow-sm border leading-relaxed whitespace-pre-wrap text-left ${msg.role === 'user'
                                        ? 'bg-teal-600 text-white border-transparent rounded-tr-none'
                                        : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                                        }`}>
                                        {msg.role === 'assistant' && idx === messages.length - 1 ? (
                                            <TypewriterEffect text={msg.content} />
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4 max-w-3xl animate-in fade-in duration-300">
                                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1">
                                    <Bot className="w-4 h-4 animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                    <div className="font-bold text-sm text-slate-900">C(AI)DENCE AI</div>
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-slate-400 italic">
                                        Thinking...
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        {selectedFile && (
                            <div className="mb-2 flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg w-fit text-sm text-slate-600">
                                <Paperclip className="w-4 h-4" />
                                <span className="font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                                <button onClick={() => setSelectedFile(null)} className="ml-2 hover:text-red-500">×</button>
                            </div>
                        )}
                        <div className="relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Message C(AI)DENCE..."
                                className="w-full pl-4 pr-32 py-4 h-24 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none font-medium placeholder:text-slate-400 transition-all focus:bg-white"
                            />
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-2 transition-colors rounded-lg ${selectedFile ? 'text-teal-600 bg-teal-50' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}
                                    title="Attach file"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!input.trim()) return;
                                        setIsEnhancing(true);
                                        try {
                                            const { enhanceDescription } = await import("@/lib/api");
                                            const enhanced = await enhanceDescription(input);
                                            setInput(enhanced);
                                        } catch (e) {
                                            console.error("Enhance failed", e);
                                        }
                                        setIsEnhancing(false);
                                    }}
                                    disabled={isEnhancing || !input.trim()}
                                    className="px-3 py-1.5 text-teal-700 hover:text-teal-800 transition-colors rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200/50 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {isEnhancing ? (
                                        <><div className="w-3 h-3 border border-teal-600 border-t-transparent rounded-full animate-spin" /> Enhancing...</>
                                    ) : (
                                        <><Sparkles className="w-3.5 h-3.5" /> Enhance</>
                                    )}
                                </button>
                                <button onClick={handleSend} disabled={isLoading || (!input.trim() && !selectedFile)} className="p-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg shadow-sm transition-all hover:scale-105">
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Right Sidebar - Expert Profiles */}
                <div className="w-[300px] shrink-0 space-y-6">
                    {/* Quick Prompts */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-3 text-sm">Quick Prompts</h3>
                        <div className="space-y-2">
                            {(QUICK_PROMPTS[industry] || ["Draft a welcome email", "Analyze campaign ROI", "Suggest ad headlines", "Create social calendar"]).map((prompt, i) => (
                                <button key={i} onClick={() => setInput(prompt)} className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50 transition-all text-xs font-medium text-slate-600 flex items-center justify-between group">
                                    {prompt}
                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-600" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Expert Profiles */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-3 text-sm px-1">Consult an Expert</h3>
                        <div className="space-y-3">
                            {[
                                { name: "Sarah", role: "Creative Director", color: "bg-purple-100 text-purple-600" },
                                { name: "David", role: "Data Analyst", color: "bg-blue-100 text-blue-600" },
                                { name: "Marcus", role: "Real Estate Pro", color: "bg-amber-100 text-amber-600" }
                            ].map((expert, i) => (
                                <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 hover:border-teal-500/50 hover:shadow-md transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 ${expert.color} rounded-full flex items-center justify-center font-bold`}>
                                            {expert.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-slate-900 group-hover:text-teal-700">{expert.name}</div>
                                            <div className="text-xs text-slate-500 font-medium">{expert.role}</div>
                                        </div>
                                        <Crown className="w-4 h-4 text-amber-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
