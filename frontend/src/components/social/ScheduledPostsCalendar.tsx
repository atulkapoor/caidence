"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, momentLocalizer, Views, type View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CalendarClock, CheckCircle2, Clock3, X } from "lucide-react";
import { cancelScheduledPost, fetchScheduledPosts, type ScheduledPost } from "@/lib/api/social";
import { toast } from "sonner";

const localizer = momentLocalizer(moment);

type CalendarScope = "content" | "design";

interface ScheduledEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    post: ScheduledPost;
}

interface ScheduledPostsCalendarProps {
    scope: CalendarScope;
    title: string;
    subtitle: string;
}

const excludedStatuses = new Set(["failed", "error", "cancelled", "canceled"]);

const platformColors: Record<string, { bg: string; color: string; border: string }> = {
    linkedin: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    instagram: { bg: "#fdf2f8", color: "#be185d", border: "#fbcfe8" },
    facebook: { bg: "#eff6ff", color: "#1e40af", border: "#93c5fd" },
    twitter: { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
    whatsapp: { bg: "#ecfdf3", color: "#047857", border: "#bbf7d0" },
};

const toLocalDateTime = (iso: string) => new Date(iso).toLocaleString();

const hasValue = (value: number | null | undefined) => value !== null && value !== undefined;
const getVisibleRange = (date: Date, view: View) => {
    const base = moment(date);
    if (view === Views.DAY) {
        return {
            start: base.clone().startOf("day").toDate(),
            end: base.clone().endOf("day").toDate(),
        };
    }
    if (view === Views.WEEK) {
        return {
            start: base.clone().startOf("week").toDate(),
            end: base.clone().endOf("week").toDate(),
        };
    }
    return {
        start: base.clone().startOf("month").startOf("week").toDate(),
        end: base.clone().endOf("month").endOf("week").toDate(),
    };
};

export function ScheduledPostsCalendar({ scope, title, subtitle }: ScheduledPostsCalendarProps) {
    const [allPosts, setAllPosts] = useState<ScheduledPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [currentView, setCurrentView] = useState<View>(Views.MONTH);
    const hasLoadedOnce = useRef(false);

    useEffect(() => {
        const loadPosts = async (initialLoad = false) => {
            if (initialLoad) {
                setIsLoading(true);
            }
            try {
                const visibleRange = getVisibleRange(currentDate, currentView);
                const rows = await fetchScheduledPosts({
                    scope,
                    status_in: "scheduled,queued,pending,processing,published,posted,success,completed",
                    from_date: visibleRange.start.toISOString(),
                    to_date: visibleRange.end.toISOString(),
                    limit: 500,
                }).catch(() => [] as ScheduledPost[]);

                const deduped = rows.sort(
                    (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
                );
                setAllPosts(deduped);
            } catch (error) {
                console.error("Failed to load scheduled posts", error);
                setAllPosts([]);
            } finally {
                if (initialLoad) {
                    setIsLoading(false);
                }
            }
        };

        const initialLoad = !hasLoadedOnce.current;
        loadPosts(initialLoad);
        if (!hasLoadedOnce.current) {
            hasLoadedOnce.current = true;
        }
    }, [currentDate, currentView, scope]);

    const posts = useMemo(() => {
        const visibleRange = getVisibleRange(currentDate, currentView);
        const startMs = visibleRange.start.getTime();
        const endMs = visibleRange.end.getTime();

        return allPosts.filter((post) => {
            const status = String(post.status || "").toLowerCase();
            if (excludedStatuses.has(status)) return false;
            const scheduledMs = new Date(post.scheduled_at).getTime();
            if (Number.isFinite(startMs) && scheduledMs < startMs) return false;
            if (Number.isFinite(endMs) && scheduledMs > endMs) return false;

            const hasContentRef = hasValue(post.content_id);
            const hasDesignRef = hasValue(post.design_asset_id);

            if (scope === "content") {
                // Content calendar only: explicit content-linked posts.
                return hasContentRef && !hasDesignRef;
            }

            // Design calendar:
            // 1) explicit design-linked posts
            // 2) fallback posts with no content_id (common for some design schedules)
            return hasDesignRef || !hasContentRef;
        });
    }, [allPosts, scope, currentDate, currentView]);

    const events = useMemo<ScheduledEvent[]>(
        () =>
            posts.map((post) => {
                const start = new Date(post.scheduled_at);
                return {
                    id: `scheduled-${post.id}`,
                    title: post.title || `${post.platform.toUpperCase()} Scheduled Post`,
                    start,
                    end: new Date(start.getTime() + 60 * 60 * 1000),
                    post,
                };
            }),
        [posts]
    );

    const canCancelSelected =
        selectedPost &&
        new Set(["scheduled", "processing", "queued", "pending"]).has(
            String(selectedPost.status || "").toLowerCase()
        );

    const handleCancelSelected = async () => {
        if (!selectedPost || !canCancelSelected) return;
        const confirmed = window.confirm("Are you sure you want to cancel this scheduled post?");
        if (!confirmed) return;

        setIsCancelling(true);
        const toastId = toast.loading("Canceling scheduled post...");
        try {
            await cancelScheduledPost(selectedPost.id);
            setAllPosts((prev) => prev.filter((post) => post.id !== selectedPost.id));
            setSelectedPost(null);
            toast.success("Scheduled post canceled", { id: toastId });
        } catch (error: any) {
            toast.error(error?.message || "Failed to cancel scheduled post", { id: toastId });
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <div className="h-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="mb-5">
                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                <p className="text-slate-500 text-sm">{subtitle}</p>
            </div>

            <div className="mb-4 text-xs font-semibold text-slate-500">
                {isLoading
                    ? "Loading scheduled posts..."
                    : `${posts.length} scheduled posts (${scope === "design" ? "Design Studio" : "Content Studio"} view)`}
            </div>

            <div className="flex-1 min-h-0">
                {isLoading ? (
                    <div className="h-full py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center">
                        <div className="w-10 h-10 mx-auto border-4 border-slate-200 border-t-violet-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium">
                            {scope === "content" ? "Loading content..." : "Loading designs..."}
                        </p>
                    </div>
                ) : (
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: "100%" }}
                        date={currentDate}
                        view={currentView}
                        views={[Views.MONTH, Views.WEEK, Views.DAY]}
                        defaultView={Views.MONTH}
                        popup
                        doShowMoreDrillDown={false}
                        onNavigate={(date) => setCurrentDate(date)}
                        onView={(view) => setCurrentView(view)}
                        onSelectEvent={(event: ScheduledEvent) => setSelectedPost(event.post)}
                        eventPropGetter={(event: ScheduledEvent) => {
                            const key = String(event.post.platform || "").toLowerCase();
                            const theme = platformColors[key] || platformColors.twitter;
                            return {
                                style: {
                                    backgroundColor: theme.bg,
                                    color: theme.color,
                                    borderColor: theme.border,
                                    borderWidth: "1px",
                                    borderStyle: "solid",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    padding: "2px 4px",
                                    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                                },
                            };
                        }}
                        components={{
                            event: ({ event }: { event: ScheduledEvent }) => (
                                <div className="flex items-center gap-1.5 p-1 truncate">
                                    <CalendarClock className="w-3.5 h-3.5" />
                                    <span className="truncate text-xs">{event.title}</span>
                                </div>
                            ),
                        }}
                    />
                )}
            </div>

            {selectedPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">{selectedPost.title || "Scheduled Post"}</h3>
                            <button onClick={() => setSelectedPost(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                                <span className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 uppercase text-slate-700">
                                    {selectedPost.platform}
                                </span>
                                <span className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700">
                                    Scheduled: {toLocalDateTime(selectedPost.scheduled_at)}
                                </span>
                                {selectedPost.published_at ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Posted: {toLocalDateTime(selectedPost.published_at)}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-700">
                                        <Clock3 className="w-3.5 h-3.5" />
                                        Pending
                                    </span>
                                )}
                            </div>

                            {selectedPost.image_url && (
                                <img
                                    src={selectedPost.image_url}
                                    alt={selectedPost.title || "Scheduled post image"}
                                    className="w-full max-h-[220px] object-contain rounded-xl border border-slate-200 bg-slate-50"
                                />
                            )}

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Post Content</p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{selectedPost.message}</p>
                            </div>

                            {canCancelSelected && (
                                <div className="pt-2 flex justify-end">
                                    <button
                                        onClick={handleCancelSelected}
                                        disabled={isCancelling}
                                        className="px-4 py-2 text-sm font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-60"
                                    >
                                        {isCancelling ? "Canceling..." : "Cancel Schedule"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
