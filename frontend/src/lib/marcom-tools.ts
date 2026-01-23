import { Megaphone, Globe, Mail, Search as SearchIcon, Share2, ShoppingBag, FileText, PenTool, LucideIcon } from "lucide-react";

export interface ToolInput {
    name: string;
    label: string;
    type: "text" | "textarea" | "select";
    placeholder?: string;
    options?: string[]; // for select
}

export interface MarcomTool {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    category: string;
    color: string;
    inputs: ToolInput[];
    promptTemplate: string; // Used as a key/identifier for the backend if needed, or constructed dynamically
}

export const TOOLS: MarcomTool[] = [
    {
        id: "facebook-ad-headline",
        title: "Facebook Ad Headline",
        description: "Generate catchy headlines for your Facebook advertising campaigns that drive clicks.",
        icon: Megaphone,
        category: "Ads",
        color: "from-blue-500 to-blue-600",
        inputs: [
            { name: "product_name", label: "Product/Service Name", type: "text", placeholder: "e.g. EcoSneakers" },
            { name: "audience", label: "Target Audience", type: "text", placeholder: "e.g. Eco-conscious runners" },
            { name: "benefits", label: "Key Benefits", type: "textarea", placeholder: "e.g. Made from recycled plastic, lightweight, waterproof" }
        ],
        promptTemplate: "Generate 5 catchy Facebook Ad headlines for {product_name} targeting {audience}. Key benefits: {benefits}."
    },
    {
        id: "website-headline",
        title: "Website Headline (H1)",
        description: "Create powerful main headlines for your landing pages to capture visitor attention immediately.",
        icon: Globe,
        category: "Website",
        color: "from-emerald-500 to-teal-500",
        inputs: [
            { name: "product_name", label: "Product/Service Name", type: "text", placeholder: "e.g. C(AI)DENCE" },
            { name: "value_prop", label: "Unique Value Proposition", type: "textarea", placeholder: "e.g. AI-powered marketing suite that automates campaigns" }
        ],
        promptTemplate: "Generate 5 powerful H1 homepage headlines for {product_name} that highlight this value proposition: {value_prop}."
    },
    {
        id: "email-subject-line",
        title: "Email Subject Line",
        description: "Write email subject lines that get opened. Increase your open rates instantly.",
        icon: Mail,
        category: "Email",
        color: "from-violet-500 to-purple-500",
        inputs: [
            { name: "email_topic", label: "Email Topic", type: "text", placeholder: "e.g. Summer Sale Announcement" },
            { name: "recipient", label: "Recipient Type", type: "text", placeholder: "e.g. Existing Customers" },
            { name: "tone", label: "Tone", type: "select", options: ["Urgent", "Friendly", "Professional", "Curious"] }
        ],
        promptTemplate: "Generate 5 email subject lines for a email about {email_topic} sent to {recipient}. Tone: {tone}."
    },
    {
        id: "seo-meta-description",
        title: "SEO Meta Description",
        description: "Optimize your web pages for search engines with keyword-rich meta descriptions.",
        icon: SearchIcon,
        category: "SEO",
        color: "from-orange-500 to-amber-500",
        inputs: [
            { name: "page_title", label: "Page Title", type: "text", placeholder: "e.g. Best Running Shoes 2024" },
            { name: "keywords", label: "Target Keywords", type: "text", placeholder: "e.g. running shoes, marathon, eco-friendly" }
        ],
        promptTemplate: "Write 3 SEO meta descriptions (under 160 chars) for a page titled '{page_title}'. Keywords: {keywords}."
    },
    {
        id: "social-post-idea",
        title: "Social Media Post Idea",
        description: "Never run out of content ideas. Generate engaging post concepts for any platform.",
        icon: Share2,
        category: "Social",
        color: "from-pink-500 to-rose-500",
        inputs: [
            { name: "topic", label: "Topic/Niche", type: "text", placeholder: "e.g. Digital Marketing Trends" },
            { name: "platform", label: "Platform", type: "select", options: ["LinkedIn", "Twitter", "Instagram", "Facebook"] }
        ],
        promptTemplate: "Generate 5 engaging social media post ideas for {platform} about {topic}."
    },
    {
        id: "product-description",
        title: "Product Description",
        description: "Turn features into benefits with compelling product descriptions that sell.",
        icon: ShoppingBag,
        category: "E-commerce",
        color: "from-cyan-500 to-blue-500",
        inputs: [
            { name: "product_name", label: "Product Name", type: "text", placeholder: "e.g. Smart Watch Pro" },
            { name: "features", label: "Key Features", type: "textarea", placeholder: "e.g. 7-day battery, heart rate monitor, waterproof" }
        ],
        promptTemplate: "Write a compelling product description (approx 100 words) for {product_name}. Features: {features}."
    },
    {
        id: "blog-post-intro",
        title: "Blog Post Intro",
        description: "Hook your readers from the first sentence with captivating introductions.",
        icon: PenTool,
        category: "Blog",
        color: "from-indigo-500 to-blue-500",
        inputs: [
            { name: "title", label: "Blog Title", type: "text", placeholder: "e.g. 5 Ways to Save Money" },
            { name: "audience", label: "Target Audience", type: "text", placeholder: "e.g. College Students" }
        ],
        promptTemplate: "Write 3 engaging blog post introductions for an article titled '{title}' targeting {audience}."
    }
];
