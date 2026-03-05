import { useEffect, useState } from "react";
import { X, Sparkles, User, Users, Activity, ExternalLink, Camera, Mic } from "lucide-react";
import { InfluencerProfile } from "@/lib/api";
import { useModalScroll } from "@/hooks/useModalScroll";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    profile: InfluencerProfile | null;
}

export function InfluencerProfileModal({ isOpen, onClose, profile }: Props) {
    useModalScroll(isOpen);
    const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
    const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setLoadedImages({});
        setFailedImages({});
    }, [profile?.id, isOpen]);

    if (!isOpen || !profile) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Panel */}
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 max-h-[90vh] overflow-y-auto">
                {/* Header / Banner */}
                <div className="h-40 relative" style={{ backgroundColor: profile.avatar_color }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-8 pb-8">
                    {/* Profile Info Row */}
                    <div className="flex justify-between items-end -mt-16 mb-8 relative z-10">
                        <div className="flex items-end gap-6">
                            <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl bg-white flex items-center justify-center text-4xl font-black text-slate-300">
                                {profile.image_url ? (
                                    <img src={profile.image_url} alt={profile.handle} className="w-full h-full object-cover rounded-3xl" />
                                ) : (
                                    profile.handle.substring(1, 3).toUpperCase()
                                )}
                            </div>
                            <div className="mb-2">
                                <h2 className="text-3xl font-black text-slate-900">{profile.handle}</h2>
                                <div className="flex items-center gap-2 text-slate-500 font-bold">
                                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-xs uppercase tracking-wider">{profile.platform}</span>
                                    <span>•</span>
                                    <span>{profile.audience_demographics.split(',')[0]} Audience</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mb-2">
                            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-100 font-bold flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                {profile.match_score}% Quality Match
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase mb-1">
                                <Users className="w-4 h-4" /> Reach
                            </div>
                            <div className="text-2xl font-black text-slate-900">
                                {(profile.followers / 1000000).toFixed(1)}M
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase mb-1">
                                <Activity className="w-4 h-4" /> Engagement
                            </div>
                            <div className="text-2xl font-black text-slate-900">
                                {profile.engagement_rate}%
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase mb-1">
                                <User className="w-4 h-4" /> Demographics
                            </div>
                            <div className="text-xl font-bold text-slate-900 truncate">
                                {profile.audience_demographics}
                            </div>
                        </div>
                    </div>

                    {/* AI Analysis */}
                    <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <Camera className="w-5 h-5 text-indigo-600" />
                                Visual Analysis
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.image_recognition_tags.concat(profile.content_style_match).map(tag => (
                                    <span key={tag} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg text-sm shadow-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <Mic className="w-5 h-5 text-pink-600" />
                                Voice & Tone
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.voice_analysis.map(tag => (
                                    <span key={tag} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg text-sm shadow-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Content (Mock) */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-4">Recent Content</h3>
                        <div className="grid grid-cols-4 gap-4">
                            {(profile.recent_posts && profile.recent_posts.length > 0
                                ? profile.recent_posts.slice(0, 4)
                                : [{ post_id: "placeholder-1" }, { post_id: "placeholder-2" }, { post_id: "placeholder-3" }, { post_id: "placeholder-4" }]
                            ).map((post) => (
                                <a
                                    key={post.post_id}
                                    href={post.post_url || "#"}
                                    target={post.post_url ? "_blank" : undefined}
                                    rel={post.post_url ? "noopener noreferrer" : undefined}
                                    className="aspect-[4/5] bg-slate-100 rounded-xl overflow-hidden relative group cursor-pointer block border border-slate-200"
                                >
                                    <div className="h-[62%] relative bg-slate-200">
                                        {post.media_url && !failedImages[post.post_id] ? (
                                            <>
                                                {!loadedImages[post.post_id] && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
                                                        <div className="w-7 h-7 border-4 border-slate-300 border-t-indigo-500 rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                                <img
                                                    src={post.media_url}
                                                    alt={post.caption || "Post"}
                                                    className={`w-full h-full object-cover ${loadedImages[post.post_id] ? "opacity-100" : "opacity-0"}`}
                                                    onLoad={() => setLoadedImages((prev) => ({ ...prev, [post.post_id]: true }))}
                                                    onError={() => setFailedImages((prev) => ({ ...prev, [post.post_id]: true }))}
                                                />
                                            </>
                                        ) : profile.image_url ? (
                                            <img src={profile.image_url} alt={profile.handle} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-black text-3xl">POST</div>
                                        )}
                                    </div>
                                    <div className="h-[38%] p-2.5 bg-slate-100">
                                        <p className="text-[12px] text-slate-700 line-clamp-3 leading-5">
                                            {post.caption || "Open post"}
                                        </p>
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                    {post.post_url && (
                                        <div className="absolute top-2 right-2 bg-black/55 text-white p-1.5 rounded-full">
                                            <ExternalLink className="w-3 h-3" />
                                        </div>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
