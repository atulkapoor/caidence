import { useState } from "react";
import { Sparkles, Plus, Target, Calendar as CalendarIcon, DollarSign, X, Bell, Mail, MessageSquare, Phone } from "lucide-react";
import { sendTestEmail, sendTestSMS, sendTestWhatsApp, createCampaign, launchCampaign, enhanceDescription, addInfluencerToCampaign, CampaignDraft } from "@/lib/api";
import { AudienceOverlapStub } from "@/components/analytics/AudienceOverlapStub";
import { StrategyComparator } from "@/components/campaigns/StrategyComparator";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CreateCampaignTab() {
    const [name, setName] = useState("");
    const [budget, setBudget] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [description, setDescription] = useState("");

    // Detailed Targeting
    const [audience, setAudience] = useState("");

    // Dynamic Lists
    const [goals, setGoals] = useState<string[]>([]);
    const [newGoal, setNewGoal] = useState("");

    const [brandColors, setBrandColors] = useState<string[]>([]);
    const [newColor, setNewColor] = useState("");

    // Influencers
    const [influencerHandles, setInfluencerHandles] = useState<string[]>([]);
    const [newInfluencer, setNewInfluencer] = useState("");

    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

    const toggleChannel = (channel: string) => {
        if (selectedChannels.includes(channel)) {
            setSelectedChannels(selectedChannels.filter(c => c !== channel));
        } else {
            setSelectedChannels([...selectedChannels, channel]);
        }
    };

    const handleAddGoal = () => {
        if (newGoal.trim()) {
            setGoals([...goals, newGoal.trim()]);
            setNewGoal("");
        }
    };

    const handleAddColor = () => {
        if (newColor.trim()) {
            setBrandColors([...brandColors, newColor.trim()]);
            setNewColor("");
        }
    };

    const handleAddInfluencer = () => {
        const handle = newInfluencer.trim().replace(/^@/, ''); // Remove @ if present
        if (handle && !influencerHandles.includes(handle)) {
            setInfluencerHandles([...influencerHandles, handle]);
            setNewInfluencer("");
        }
    };

    // Description Enhancement
    const [isEnhancing, setIsEnhancing] = useState(false);
    const handleEnhanceDescription = async () => {
        if (!description) return;
        setIsEnhancing(true);
        try {
            const enhanced = await enhanceDescription(description);
            setDescription(enhanced);
            toast.success("Description enhanced!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to enhance description");
        } finally {
            setIsEnhancing(false);
        }
    };

    // Agent Wizard State
    const [showWizard, setShowWizard] = useState(false);
    const [wizardGoal, setWizardGoal] = useState("");
    const [wizardProduct, setWizardProduct] = useState("");
    const [wizardAudience, setWizardAudience] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [agentLogs, setAgentLogs] = useState<string[]>([]);

    // Comparison State
    const [comparisonData, setComparisonData] = useState<{ planA: CampaignDraft, planB: CampaignDraft } | null>(null);

    const applyDraftToForm = (draft: CampaignDraft) => {
        setName(draft.title);
        setDescription(draft.description);
        setBudget(draft.budget.replace(/[^0-9]/g, ''));
        // We'll keep the user's audience input as it's usually better than AI summary
        setAudience(wizardAudience);

        // Map channels if possible, or just log them for now
        draft.channels?.forEach(ch => console.log("Suggested channel:", ch));

        // Simple mapping attempt for demo purposes
        const newSelected: string[] = [];
        draft.channels?.forEach(ch => {
            if (ch.toLowerCase().includes("instagram")) newSelected.push("Instagram");
            if (ch.toLowerCase().includes("tiktok")) newSelected.push("TikTok");
            if (ch.toLowerCase().includes("email")) newSelected.push("Email");
            if (ch.toLowerCase().includes("linkedin")) newSelected.push("LinkedIn");
        });
        if (newSelected.length > 0) setSelectedChannels(newSelected);

        setShowWizard(false);
        setComparisonData(null);
    };

    const handleAutoGenerate = async () => {
        setIsGenerating(true);
        setAgentLogs([]);

        // Simulating progressive logs before the real response comes back (for UX)
        const initialLogs = [
            "Researcher Agent: Analyzing market trends and competitor data...",
            "Researcher Agent: Identifying key audience segments..."
        ];

        let logIndex = 0;
        const logInterval = setInterval(() => {
            if (logIndex < initialLogs.length) {
                setAgentLogs(prev => [...prev, initialLogs[logIndex]]);
                logIndex++;
            }
        }, 1000);

        try {
            // Import dynamically or assume it's available in scope if imported at top
            const { generateCampaignPlan } = await import("@/lib/api");
            const draft = await generateCampaignPlan(wizardGoal, wizardProduct, wizardAudience);

            clearInterval(logInterval);

            // Add the actual logs from the backend
            if (draft.agent_logs) {
                setAgentLogs(prev => [...prev, ...(draft.agent_logs || [])]);
            }

            // Wait a moment so user can read logs
            setTimeout(() => {
                setIsGenerating(false);

                if (draft.alternative_draft) {
                    // Show comparison modal
                    setComparisonData({
                        planA: draft,
                        planB: draft.alternative_draft
                    });
                } else {
                    // Direct apply if no alternative
                    applyDraftToForm(draft);
                }
            }, 1500);

        } catch (error) {
            clearInterval(logInterval);
            console.error("Agent Wizard Failed", error);
            setIsGenerating(false);
            alert("Failed to generate plan. Please try again.");
        }
    };


    const router = useRouter();

    const handleLaunch = async () => {
        if (!name) {
            toast.error("Please enter a campaign name");
            return;
        }

        try {
            const newCampaign = await createCampaign({
                title: name,
                description: description || "No description",
                status: "draft", // Create as draft first
                budget: budget,
                start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
                end_date: endDate ? new Date(endDate).toISOString() : undefined,
                channels: JSON.stringify(selectedChannels),
                audience_targeting: JSON.stringify({ audience, goals, brandColors })
            });

            // Add Influencers
            if (influencerHandles.length > 0) {
                try {
                    await Promise.all(influencerHandles.map(handle =>
                        addInfluencerToCampaign(newCampaign.id, handle)
                    ));
                    toast.success(`Added ${influencerHandles.length} influencers`);
                } catch (err) {
                    console.error("Error adding influencers", err);
                    toast.error("Some influencers could not be added");
                }
            }

            // Trigger Launch Event
            await launchCampaign(newCampaign.id);

            toast.success("Campaign launched successfully!");
            // Navigate to campaigns list with refresh
            router.push("/campaigns");
            router.refresh();
        } catch (err) {
            toast.error("Failed to launch campaign");
            console.error(err);
        }
    };

    return (
        <div className="flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Agent Wizard Modal */}
            {showWizard && (
                <div className="fixed z-50 inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
                        <div className="w-full max-w-md space-y-6">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-4 shadow-lg shadow-indigo-200">
                                    <Sparkles className="w-8 h-8 animate-pulse" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900">AI Campaign Agent</h2>
                                <p className="text-slate-500">Describe your goal, and our multi-agent team will build a strategy for you.</p>
                            </div>

                            {!isGenerating ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Campaign Goal</label>
                                        <input
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. Launch new coffee brand"
                                            value={wizardGoal}
                                            onChange={e => setWizardGoal(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Product / Service</label>
                                        <input
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. JavaJoy Bean Subscription"
                                            value={wizardProduct}
                                            onChange={e => setWizardProduct(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Target Audience</label>
                                        <input
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. Remote workers, Tech enthusiasts"
                                            value={wizardAudience}
                                            onChange={e => setWizardAudience(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={handleAutoGenerate}
                                        disabled={!wizardGoal || !wizardProduct || !wizardAudience}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Activate Agents 🤖
                                    </button>
                                    <button onClick={() => setShowWizard(false)} className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-bold">Cancel</button>
                                </div>
                            ) : (
                                <div className="bg-slate-900 text-green-400 p-6 rounded-xl font-mono text-xs h-64 overflow-y-auto w-full shadow-inner border border-slate-800">
                                    {agentLogs.map((log, i) => (
                                        <div key={i} className="mb-2 border-l-2 border-green-500 pl-2 animate-in slide-in-from-left-2 fade-in">
                                            <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span> {log}
                                        </div>
                                    ))}
                                    <div className="animate-pulse">_</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Form */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                        <Target className="w-5 h-5 text-blue-600" />
                        Create New Campaign
                    </div>
                    <button
                        onClick={() => setShowWizard(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-lg hover:shadow-md transition-all"
                    >
                        <Sparkles className="w-3 h-3" />
                        Auto-Generate Plan
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Row 1: Name & Budget */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Campaign Name</label>
                            <input
                                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                placeholder="e.g. Summer Sale 2026"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Budget (USD)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    className="w-full p-3 pl-9 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                    placeholder="5000"
                                    type="number"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* AI Description */}
                    <div className="space-y-2 relative">
                        <label className="text-sm font-bold text-slate-700">Campaign Description</label>
                        <div className="relative">
                            <textarea
                                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none min-h-[120px] resize-y"
                                placeholder="Describe your campaign strategy, goals, and key messaging..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            <button
                                onClick={handleEnhanceDescription}
                                disabled={isEnhancing || !description}
                                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                            >
                                <Sparkles className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} />
                                {isEnhancing ? "Enhancing..." : "Enhance Description"}
                            </button>
                        </div>
                    </div>

                    {/* Target Audience */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Target Audience</label>
                        <textarea
                            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none min-h-[100px]"
                            placeholder="Detail demographics, interests, and behaviors..."
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                        />
                    </div>

                    {/* Campaign Goals List */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Campaign Goals</label>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                placeholder="Add a goal (e.g. Increase Brand Awareness)"
                                value={newGoal}
                                onChange={(e) => setNewGoal(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                            />
                            <button
                                onClick={handleAddGoal}
                                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {goals.map((goal, i) => (
                                <span key={i} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100">
                                    {goal}
                                    <button onClick={() => setGoals(goals.filter((_, idx) => idx !== i))} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Marketing Channels */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Marketing Channels</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { icon: "📱", label: "Instagram" },
                                { icon: "🎥", label: "TikTok" },
                                { icon: "📺", label: "YouTube" },
                                { icon: "💼", label: "LinkedIn" },
                                { icon: "🐦", label: "Twitter" },
                                { icon: "📧", label: "Email" },
                            ].map((channel, i) => (
                                <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group ${selectedChannels.includes(channel.label) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        checked={selectedChannels.includes(channel.label)}
                                        onChange={() => toggleChannel(channel.label)}
                                    />
                                    <span className="text-xl group-hover:scale-110 transition-transform">{channel.icon}</span>
                                    <span className="text-sm font-medium text-slate-700">{channel.label}</span>
                                </label>
                            ))}
                        </div>

                        {/* Audience Overlap Visualization */}
                        <div className="mt-4">
                            <AudienceOverlapStub channels={selectedChannels} />
                        </div>
                    </div>

                    {/* Influencers Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Influencers & Creators</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                                <input
                                    className="w-full p-3 pl-8 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none"
                                    placeholder="instagram_handle"
                                    value={newInfluencer}
                                    onChange={(e) => setNewInfluencer(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddInfluencer()}
                                />
                            </div>
                            <button
                                onClick={handleAddInfluencer}
                                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200"
                            >
                                Add
                            </button>
                        </div>
                        {influencerHandles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {influencerHandles.map((handle, i) => (
                                    <span key={i} className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full border border-purple-100">
                                        @{handle}
                                        <button onClick={() => setInfluencerHandles(list => list.filter((_, idx) => idx !== i))} className="hover:text-purple-900 ml-1">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Start Date</label>
                            <input
                                type="date"
                                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">End Date</label>
                            <input
                                type="date"
                                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Brand Colors */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 block">Brand Colors</label>
                        <div className="flex gap-2">
                            <input
                                className="w-32 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-mono text-sm"
                                placeholder="#000000"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddColor()}
                            />
                            <button
                                onClick={handleAddColor}
                                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-3">
                            {brandColors.map((color, i) => (
                                <div key={i} className="group relative w-10 h-10 rounded-full shadow-sm border border-slate-200" style={{ backgroundColor: color }}>
                                    <button
                                        onClick={() => setBrandColors(brandColors.filter((_, idx) => idx !== i))}
                                        className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3 text-slate-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Channel Notifications (CPaaS Test) */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Bell className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-slate-800">Channel Notifications (Test Trigger)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Email Trigger */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold">
                                    <Mail className="w-4 h-4" /> Email
                                </div>
                                <button
                                    onClick={() => sendTestEmail("test@example.com", "Campaign Launch", "Your campaign has started!")
                                        .then(() => alert("Test Email Sent!"))
                                        .catch(err => alert("Email Failed: " + err.message))
                                    }
                                    className="w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
                                >
                                    Send Test Email
                                </button>
                            </div>

                            {/* SMS Trigger */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold">
                                    <MessageSquare className="w-4 h-4" /> SMS
                                </div>
                                <button
                                    onClick={() => sendTestSMS("+1234567890", "Campaign Alert: Launching now!")
                                        .then(() => alert("Test SMS Sent!"))
                                        .catch(err => alert("SMS Failed: " + err.message))
                                    }
                                    className="w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
                                >
                                    Send Test SMS
                                </button>
                            </div>

                            {/* WhatsApp Trigger */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold">
                                    <Phone className="w-4 h-4" /> WhatsApp
                                </div>
                                <button
                                    onClick={() => sendTestWhatsApp("+1234567890", "Campaign Update: Metrics are up 🚀")
                                        .then(() => alert("Test WhatsApp Sent!"))
                                        .catch(err => alert("WhatsApp Failed: " + err.message))
                                    }
                                    className="w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-green-600 transition-colors shadow-sm"
                                >
                                    Send WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleLaunch}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                        >
                            🚀 Launch Campaign
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Tips/Stats */}
            <div className="w-80 shrink-0 space-y-6 hidden xl:block">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="font-bold text-lg mb-2">Campaign Tips</h3>
                    <ul className="space-y-3 text-sm text-indigo-100">
                        <li className="flex gap-2"><span className="text-yellow-300">💡</span> Define a clear objective.</li>
                        <li className="flex gap-2"><span className="text-yellow-300">💡</span> Know your audience deeply.</li>
                        <li className="flex gap-2"><span className="text-yellow-300">💡</span> Maintain consistent branding.</li>
                    </ul>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Selected Channels</span>
                            <span className="font-bold text-slate-900">0</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                            <span className="text-sm text-slate-500">Duration</span>
                            <span className="font-bold text-slate-900">0 Days</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Goals</span>
                            <span className="font-bold text-slate-900">{goals.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
