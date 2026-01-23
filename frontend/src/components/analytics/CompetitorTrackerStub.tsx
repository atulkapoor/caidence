import { useState, useEffect } from "react";
import { fetchCompetitorAnalysis, CompetitorAnalysisResponse } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus, Search, Swords } from "lucide-react";

export function CompetitorTrackerStub() {
    const [competitors, setCompetitors] = useState<string[]>(["CompetitorX", "BrandY", "MarketZ"]);
    const [newCompetitor, setNewCompetitor] = useState("");
    const [data, setData] = useState<CompetitorAnalysisResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchCompetitorAnalysis(competitors);
            setData(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [competitors]);

    const addCompetitor = () => {
        if (newCompetitor && !competitors.includes(newCompetitor)) {
            setCompetitors([...competitors, newCompetitor]);
            setNewCompetitor("");
        }
    };

    const removeCompetitor = (comp: string) => {
        setCompetitors(competitors.filter(c => c !== comp));
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Swords className="w-5 h-5 text-indigo-600" />
                        Competitor Intelligence
                    </h3>
                    <p className="text-sm text-slate-500">Track share of voice and sentiment against rivals.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            className="pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Add competitor..."
                            value={newCompetitor}
                            onChange={(e) => setNewCompetitor(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <button onClick={addCompetitor} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">
                        Track
                    </button>
                    <button onClick={loadData} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors">
                        Refresh
                    </button>
                </div>
            </div>

            {loading && (
                <div className="h-40 flex items-center justify-center text-slate-400 animate-pulse">
                    Analyzing market data...
                </div>
            )}

            {!loading && data && (
                <div className="space-y-6">
                    {/* Share of Voice Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <span>Share of Voice</span>
                            <span>Total Market: 100%</span>
                        </div>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            {data.breakdown.map((item, i) => (
                                <div
                                    key={i}
                                    style={{ width: `${item.share_of_voice}%`, backgroundColor: `hsl(${220 + (i * 40)}, 70%, 50%)` }}
                                    className="h-full hover:opacity-80 transition-opacity relative group cursor-help"
                                    title={`${item.name}: ${item.share_of_voice}%`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Report Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left font-bold text-slate-500 p-3">Competitor</th>
                                    <th className="text-left font-bold text-slate-500 p-3">Share of Voice</th>
                                    <th className="text-left font-bold text-slate-500 p-3">Sentiment</th>
                                    <th className="text-left font-bold text-slate-500 p-3">Top Topics</th>
                                    <th className="text-right font-bold text-slate-500 p-3">Activity (24h)</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.breakdown.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${220 + (i * 40)}, 70%, 50%)` }} />
                                            {item.name}
                                        </td>
                                        <td className="p-3 font-mono text-slate-600">{item.share_of_voice}%</td>
                                        <td className="p-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold capitalize ${item.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-700' :
                                                    item.sentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {item.sentiment === 'Positive' && <TrendingUp className="w-3 h-3" />}
                                                {item.sentiment === 'Negative' && <TrendingDown className="w-3 h-3" />}
                                                {item.sentiment === 'Neutral' && <Minus className="w-3 h-3" />}
                                                {item.sentiment}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-500 italic max-w-xs truncate">
                                            {item.top_hashtags.join(", ")}
                                        </td>
                                        <td className="p-3 text-right font-medium text-slate-700">
                                            {item.recent_activity}
                                        </td>
                                        <td className="p-3 text-center">
                                            {item.name !== 'Others / Market' && (
                                                <button
                                                    onClick={() => removeCompetitor(item.name)}
                                                    className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                                                    title="Remove"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
