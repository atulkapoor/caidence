import { Zap, Clock, FileText, PenTool, Mail, Share2 } from "lucide-react";

export function RightSidebar() {
    return (
        <div className="space-y-6">
            {/* AI Intelligence Card */}
            <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-4">
                        <Zap className="h-6 w-6 text-amber-300 fill-amber-300" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Campaign Intelligence</h3>
                    <p className="text-violet-100 text-sm mb-4">
                        8 AI-generated assets per campaign are improving performance by 24%.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-medium bg-white/10 p-2 rounded-lg">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Ready for automation
                    </div>
                </div>
                {/* Background Decor */}
                <div className="absolute -top-12 -right-12 h-32 w-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 right-0 h-24 w-24 bg-indigo-500/30 rounded-full blur-xl"></div>
            </div>

            {/* Activity Feed */}
            <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-slate-900">Recent Activity</h3>
                </div>
                <div className="p-4 space-y-4">
                    {[
                        { title: "Summer Campaign Ad", type: "Ad Copy", time: "2m ago", icon: FileText, color: "bg-blue-100 text-blue-600" },
                        { title: "LinkedIn Post", type: "Social", time: "45m ago", icon: Share2, color: "bg-indigo-100 text-indigo-600" },
                        { title: "Welcome Sequence", type: "Email", time: "2h ago", icon: Mail, color: "bg-green-100 text-green-600" },
                        { title: "Product Update", type: "Blog", time: "5h ago", icon: PenTool, color: "bg-orange-100 text-orange-600" },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-3">
                            <div className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${item.color}`}>
                                <item.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                        {item.type}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {item.time}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 border-t border-border">
                    <button className="w-full text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                        View all activity
                    </button>
                </div>
            </div>
        </div>
    );
}
