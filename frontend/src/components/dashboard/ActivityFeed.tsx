import { Clock, FileText, Mail, Video } from "lucide-react";

// Mock data - replace with API call
const activities = [
    {
        id: 1,
        action: "Email Campaign Created",
        subject: "Q4 Product Launch Newsletter",
        time: "2 hours ago",
        type: "email",
    },
    {
        id: 2,
        action: "Video Generated",
        subject: "Social Media Promo v2",
        time: "4 hours ago",
        type: "video",
    },
    {
        id: 3,
        action: "Content Published",
        subject: "Blog Post: AI in Marketing",
        time: "1 day ago",
        type: "content",
    },
    {
        id: 4,
        action: "Workflow Automated",
        subject: "Lead Nurturing Sequence",
        time: "2 days ago",
        type: "workflow",
    }
];

export function ActivityFeed() {
    return (
        <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-6">
                <h3 className="font-semibold text-white">Recent Activity</h3>
                <button className="text-sm text-primary hover:text-primary/80 font-medium">View All</button>
            </div>
            <div className="divide-y divide-border">
                {/* Fallback to mock data for now since DB is empty initially */}
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            {activity.type === "email" && <Mail className="h-5 w-5 text-blue-400" />}
                            {activity.type === "video" && <Video className="h-5 w-5 text-red-400" />}
                            {activity.type === "content" && <FileText className="h-5 w-5 text-emerald-400" />}
                            {activity.type === "workflow" && <Clock className="h-5 w-5 text-purple-400" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.subject}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
