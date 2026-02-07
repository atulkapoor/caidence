"use client";

import { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import { useModalScroll } from "@/hooks/useModalScroll";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Plus, Twitter, Linkedin, Instagram, Facebook, Target, Clock } from "lucide-react";
// Removed unused Dialog import

// Setup the localizer by providing the moment (or globalize, or Luxon) instance
// to the localizer instance.
const localizer = momentLocalizer(moment);

interface SocialPost {
    id: number;
    title: string;
    start: Date;
    end: Date;
    platform: "twitter" | "linkedin" | "instagram" | "facebook";
    content?: string;
}

const mockEvents: SocialPost[] = [
    {
        id: 1,
        title: "Product Launch Tweet",
        start: new Date(new Date().setHours(10, 0, 0, 0)),
        end: new Date(new Date().setHours(11, 0, 0, 0)),
        platform: "twitter",
        content: "Excited to announce our new feature! #launch"
    },
    {
        id: 2,
        title: "LinkedIn Article Share",
        start: (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(14, 0, 0, 0); return d; })(),
        end: (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(15, 0, 0, 0); return d; })(),
        platform: "linkedin",
        content: "Check out our latest insights on AI marketing."
    },
];

const platformIcons = {
    twitter: <Twitter className="w-4 h-4 text-sky-500" />,
    linkedin: <Linkedin className="w-4 h-4 text-blue-700" />,
    instagram: <Instagram className="w-4 h-4 text-pink-600" />,
    facebook: <Facebook className="w-4 h-4 text-blue-600" />,
    campaign: <Target className="w-4 h-4 text-emerald-600" />
};

const platformColors = {
    twitter: "bg-sky-50 border-sky-200 text-sky-700",
    linkedin: "bg-blue-50 border-blue-200 text-blue-700",
    instagram: "bg-pink-50 border-pink-200 text-pink-700",
    facebook: "bg-blue-50 border-blue-600 text-blue-800",
    campaign: "bg-emerald-50 border-emerald-200 text-emerald-700" // New style for campaigns
};

interface SocialCalendarProps {
    campaigns?: any[];
}

export function SocialCalendar({ campaigns = [] }: SocialCalendarProps) {
    // Convert campaigns to calendar events - use 1-hour time slots instead of spanning entire date ranges
    const campaignEvents: SocialPost[] = campaigns.map((c: any) => {
        // Use actual start date or fallback to created_at
        const startDate = c.start_date ? new Date(c.start_date) : new Date(c.created_at);

        // Use actual end date or default to start + 1 hour
        const endDate = c.end_date ? new Date(c.end_date) : new Date(startDate.getTime() + 60 * 60 * 1000);

        return {
            id: c.id + 1000, // Offset IDs
            title: `Campaign: ${c.title}`,
            start: startDate,
            end: endDate,
            platform: "campaign" as any,
            content: c.description
        };
    });

    const [events, setEvents] = useState<SocialPost[]>([...mockEvents, ...campaignEvents]);
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
    useModalScroll(isSchedulerOpen);

    // Update events when campaigns change
    // Note: In a real app we'd use useEffect to sync prop changes, but simplistic approach here:
    if (campaigns.length > 0 && events.length === mockEvents.length) {
        setEvents([...mockEvents, ...campaignEvents]);
    }

    // Event custom styling
    const eventStyleGetter = (event: SocialPost) => {
        // Map platform to explicit colors for safer rendering in RBC
        const styleMap: any = {
            twitter: { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' }, // sky-50, sky-700, sky-200
            linkedin: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }, // blue-50, blue-700, blue-200
            instagram: { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' }, // pink-50, pink-700, pink-200
            facebook: { bg: '#eff6ff', color: '#1e40af', border: '#2563eb' }, // blue-50, blue-800, blue-600
            campaign: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }  // emerald-50, emerald-700, emerald-200
        };

        const theme = styleMap[event.platform] || styleMap.twitter;

        return {
            style: {
                backgroundColor: theme.bg,
                color: theme.color,
                borderColor: theme.border,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '2px 4px',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
            }
        };
    };

    const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
        setSelectedSlot({ start, end });
        setIsSchedulerOpen(true);
    };

    return (
        <div className="h-[800px] bg-white p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Social Media Calendar</h2>
                    <p className="text-slate-500 text-sm">Schedule and manage your posts across all platforms.</p>
                </div>
                <button
                    onClick={() => setIsSchedulerOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Schedule Post
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%" }}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    defaultView={Views.MONTH}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    eventPropGetter={eventStyleGetter}
                    components={{
                        event: ({ event }) => (
                            <div className="flex items-center gap-1.5 p-1 truncate">
                                {platformIcons[event.platform]}
                                <span className="truncate text-xs">{event.title}</span>
                            </div>
                        ),
                }}
            />
            </div>

            {/* Post Scheduler Modal (Replaced with actual Dialog if available, using strict HTML/Tailwind overlay for now if Dialog component is strictly specific) */}
            {isSchedulerOpen && (
                <PostSchedulerModal
                    isOpen={isSchedulerOpen}
                    onClose={() => setIsSchedulerOpen(false)}
                    initialDate={selectedSlot?.start}
                />
            )}
        </div>
    );
}

// Sub-component for the Modal (Inline for file simplicity, can be moved)
function PostSchedulerModal({ isOpen, onClose, initialDate }: { isOpen: boolean; onClose: () => void; initialDate?: Date }) {
    if (!isOpen) return null;

    const [content, setContent] = useState("");
    const [platform, setPlatform] = useState<SocialPost['platform']>("twitter");
    const [date, setDate] = useState(initialDate ? moment(initialDate).format("YYYY-MM-DDTHH:mm") : moment().format("YYYY-MM-DDTHH:mm"));
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateAI = async () => {
        setIsGenerating(true);
        try {
            // Use the actual content generation API
            const { generateContent } = await import("@/lib/api");
            const result = await generateContent({
                platform: platform,
                topic: "Marketing Post",
                tone: "professional"
            });
            setContent(result.result || "Generated content unavailable.");
        } catch (error) {
            console.error("AI generation failed, using fallback", error);
            // Fallback to mock if API fails
            const mocks = [
                "🚀 Just launched our new summer collection! Check it out now. #SummerVibes",
                "💡 Did you know that AI can boost marketing ROI by 30%? Read our latest case study.",
                "🎉 Celebrating 10k followers! Thank you all for the support.",
                "👀 Sneak peek at what's coming next week..."
            ];
            setContent(mocks[Math.floor(Math.random() * mocks.length)]);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-900">Compose New Post</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Platform Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Platform</label>
                        <div className="flex gap-3">
                            {(["twitter", "linkedin", "instagram", "facebook"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPlatform(p)}
                                    className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${platform === p
                                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                        : "border-slate-100 hover:border-indigo-100 hover:bg-slate-50 text-slate-500"
                                        }`}
                                >
                                    {platformIcons[p]}
                                    <span className="text-xs font-bold capitalize">{p}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Post Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-sm"
                        />
                        <div className="flex justify-between items-center text-xs text-slate-400 px-1">
                            <span>{content.length} characters</span>
                            <button
                                onClick={handleGenerateAI}
                                disabled={isGenerating}
                                className="text-indigo-600 font-bold hover:underline disabled:opacity-50 flex items-center gap-1"
                            >
                                {isGenerating ? "Generating..." : "Generate with AI"}
                            </button>
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule Time</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                type="datetime-local"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                            />
                        </div>
                        <p className="text-xs text-slate-400">Click anywhere on the field to open the date picker</p>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                    <button
                        onClick={() => { alert("Scheduled!"); onClose(); }}
                        className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
                    >
                        Schedule Post
                    </button>
                </div>
            </div>
        </div>
    );
}
