import { useEffect, useState } from "react";
import { fetchAudienceOverlap, AudienceOverlapResponse } from "@/lib/api";
import { Loader2, Users } from "lucide-react";

interface AudienceOverlapStubProps {
    channels: string[];
}

export function AudienceOverlapStub({ channels }: AudienceOverlapStubProps) {
    const [data, setData] = useState<AudienceOverlapResponse | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (channels.length < 2) {
            setData(null);
            return;
        }

        const loadData = async () => {
            setLoading(true);
            try {
                const result = await fetchAudienceOverlap(channels);
                setData(result);
            } catch (err) {
                console.error("Failed to load overlap data", err);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(loadData, 500);
        return () => clearTimeout(debounce);
    }, [channels]);

    if (channels.length < 2) {
        return (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Select at least 2 channels to see audience overlap.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="ml-2 text-sm font-medium text-slate-600">Calculating overlap...</span>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Audience Overlap
                </h3>
                <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    {100 - data.overlap_percentage}% Unique Reach
                </span>
            </div>

            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    {/* Visual Representation (Simplified Venn Concept) */}
                    <div className="relative w-48 h-48 flex-shrink-0">
                        {data.channel_breakdown.map((ch, i) => (
                            <div
                                key={ch.channel}
                                className="absolute rounded-full mix-blend-multiply opacity-60 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                                style={{
                                    backgroundColor: ch.color,
                                    width: '100px',
                                    height: '100px',
                                    top: i === 0 ? '10%' : i === 1 ? '40%' : '25%',
                                    left: i === 0 ? '10%' : i === 1 ? '40%' : '50%',
                                    zIndex: 10 - i
                                }}
                            >
                                {ch.channel}
                            </div>
                        ))}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="bg-white/90 px-2 py-1 rounded text-xs font-bold text-slate-800 shadow-sm z-20">
                                {data.overlap_percentage}% Overlap
                            </span>
                        </div>
                    </div>

                    {/* Stats Breakdown */}
                    <div className="flex-1 w-full space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-indigo-50 rounded-lg">
                                <div className="text-xs text-indigo-600 font-bold uppercase">Total Reach</div>
                                <div className="text-lg font-black text-slate-900">{(data.total_reach / 1000000).toFixed(1)}M</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <div className="text-xs text-green-600 font-bold uppercase">Unique Reach</div>
                                <div className="text-lg font-black text-slate-900">{(data.unique_reach / 1000000).toFixed(1)}M</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {data.channel_breakdown.map(ch => (
                                <div key={ch.channel} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                                        <span className="text-slate-600">{ch.channel}</span>
                                    </div>
                                    <span className="font-bold text-slate-900">{(ch.reach / 1000).toFixed(0)}k</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
