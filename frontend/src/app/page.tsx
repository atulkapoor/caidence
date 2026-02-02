"use client";

import Link from "next/link";
import Image from "next/image";
import {
    ArrowRight, Bot, Sparkles, LayoutTemplate, Zap, CheckCircle2, BarChart3,
    Target, Megaphone, TrendingUp, PlayCircle, Globe, Shield,
    Briefcase, ShoppingBag, Building, Plus, Minus, ChevronDown, ChevronUp, Sliders,
    Quote, Star, Link2, Cpu, Rocket
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("agencies");
    const [spend, setSpend] = useState(10000);
    const [cpa, setCpa] = useState(50);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Auto-redirect if logged in
        const token = localStorage.getItem("token");
        if (token) {
            router.push("/dashboard");
        }
    }, [router]);

    // ROI Calculator Logic
    const predictedSavings = Math.round(spend * 0.32); // 32% efficiency
    const annualSavings = predictedSavings * 12;

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            {/* --- Navbar --- */}
            <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-900">C(AI)DENCE</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
                        <Link href="#capabilities" className="hover:text-indigo-600 transition-colors">Capabilities</Link>
                        <Link href="#solutions" className="hover:text-indigo-600 transition-colors">Solutions</Link>
                        <Link href="#roi" className="hover:text-indigo-600 transition-colors">ROI</Link>
                        <Link href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
                        <Link href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                            Log In
                        </Link>
                        <Link href="/register" className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all hover:scale-105 shadow-xl shadow-slate-900/20 flex items-center gap-2">
                            Start Free Trial <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <header className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-100/50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3"></div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-300 shadow-sm text-sm font-bold text-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            v2.0 is live: Autonomous Agents are here
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-slate-900">
                            The Unified <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-blue-700">AI Marketing OS</span>
                        </h1>

                        <p className="text-xl text-slate-600 font-medium leading-relaxed max-w-xl">
                            Stop juggling tools. C(AI)DENCE replaces your agency stack with autonomous agents that plan, write, design, and optimize campaigns 24/7.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2">
                                Start 7-Day Free Trial
                            </Link>
                            <Link href="#" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl text-lg border border-slate-300 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm flex items-center justify-center gap-2 group">
                                <PlayCircle className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" /> Watch Demo
                            </Link>
                        </div>

                        <div className="flex items-center gap-4 text-sm font-bold text-slate-500 pt-4">
                            <div className="flex -space-x-2">
                                <Image src="/images/trusted-users.png" alt="Trusted marketers" width={180} height={40} className="h-10 w-auto" />
                            </div>
                            <p>Trusted by 10,000+ marketers</p>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent blur-2xl -z-10 rounded-full"></div>
                        <div className="bg-white rounded-3xl border border-slate-300 shadow-2xl shadow-slate-300/50 overflow-hidden relative group hover:scale-[1.02] transition-transform duration-500">
                            <Image
                                src="/images/hero-dashboard.png"
                                alt="C(AI)DENCE Dashboard"
                                width={600}
                                height={450}
                                className="w-full h-auto"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* --- HOW IT WORKS SECTION --- */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm">Process</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mt-2">From raw data to ROI in 3 steps</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 -z-10"></div>

                        {[
                            {
                                step: "01",
                                title: "Connect",
                                description: "Link your ad accounts (Meta, Google, TikTok) and analytics sources in one click.",
                                icon: Link2
                            },
                            {
                                step: "02",
                                title: "Analyze",
                                description: "Our AI agents crawl specific competitors and your historical data to find winning patterns.",
                                icon: Cpu
                            },
                            {
                                step: "03",
                                title: "Automate",
                                description: "Launch optimized campaigns, auto-kill losing ads, and scale winners 24/7.",
                                icon: Rocket
                            }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center group">
                                <div className="w-24 h-24 bg-white rounded-full border-4 border-indigo-50 flex items-center justify-center shadow-xl mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                                        <item.icon className="w-8 h-8" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-white">
                                        {item.step}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-600 font-medium leading-relaxed max-w-xs">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- INTEGRATION PARTNERS (Infinite Marquee) --- */}
            <section className="py-16 border-y border-slate-200 bg-slate-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center mb-10">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Seamless integrations with your favorite tools</p>
                </div>

                <div className="relative flex overflow-x-hidden group">
                    <div className="animate-marquee whitespace-nowrap flex items-center gap-16 pr-16">
                        {[
                            { name: "Meta Ads", icon: "Meta" },
                            { name: "Google Ads", icon: "Google" },
                            { name: "Shopify", icon: "Shopify" },
                            { name: "HubSpot", icon: "HubSpot" },
                            { name: "Salesforce", icon: "Salesforce" },
                            { name: "TikTok", icon: "TikTok" },
                            { name: "Klaviyo", icon: "Klaviyo" },
                            { name: "Slack", icon: "Slack" },
                            { name: "Stripe", icon: "Stripe" },
                            { name: "Zapier", icon: "Zapier" },
                            { name: "WooCommerce", icon: "Woo" },
                            { name: "BigCommerce", icon: "BigC" },
                        ].map((integration, i) => (
                            <div key={i} className="flex items-center gap-3 text-2xl font-black text-slate-400 grayscale hover:grayscale-0 hover:text-indigo-600 transition-all cursor-default">
                                {/* Ideally utilize actual SVGs here, using text for now */}
                                <span className="text-xl">⚡️</span> {integration.name}
                            </div>
                        ))}
                    </div>
                    {/* Duplicate for seamless loop */}
                    <div className="animate-marquee whitespace-nowrap flex items-center gap-16 pr-16 absolute top-0 left-full">
                        {[
                            { name: "Meta Ads", icon: "Meta" },
                            { name: "Google Ads", icon: "Google" },
                            { name: "Shopify", icon: "Shopify" },
                            { name: "HubSpot", icon: "HubSpot" },
                            { name: "Salesforce", icon: "Salesforce" },
                            { name: "TikTok", icon: "TikTok" },
                            { name: "Klaviyo", icon: "Klaviyo" },
                            { name: "Slack", icon: "Slack" },
                            { name: "Stripe", icon: "Stripe" },
                            { name: "Zapier", icon: "Zapier" },
                            { name: "WooCommerce", icon: "Woo" },
                            { name: "BigCommerce", icon: "BigC" },
                        ].map((integration, i) => (
                            <div key={`dup-${i}`} className="flex items-center gap-3 text-2xl font-black text-slate-400 grayscale hover:grayscale-0 hover:text-indigo-600 transition-all cursor-default">
                                <span className="text-xl">⚡️</span> {integration.name}
                            </div>
                        ))}
                    </div>
                </div>

                <style jsx>{`
                    .animate-marquee {
                        animation: marquee 25s linear infinite;
                    }
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-100%); }
                    }
                `}</style>
            </section>

            {/* --- SOLUTIONS TABS --- */}
            <section id="solutions" className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-indigo-700 font-bold tracking-wider uppercase text-sm">Tailored Solutions</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mt-2">Built for every stage of growth</h2>
                    </div>

                    <div className="flex flex-col md:flex-row justify-center gap-4 mb-12">
                        {[
                            { id: "agencies", label: "For Agencies", icon: Briefcase },
                            { id: "ecommerce", label: "For E-Commerce", icon: ShoppingBag },
                            { id: "enterprise", label: "For Enterprise", icon: Building },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all border ${activeTab === tab.id
                                    ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-105"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-100 rounded-3xl p-8 md:p-12 border border-slate-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-6">
                                    {activeTab === "agencies" && "Scale to 100+ clients without hiring properly."}
                                    {activeTab === "ecommerce" && "Stop burning ad spend on bad creative."}
                                    {activeTab === "enterprise" && "Brand safety & compliance at scale."}
                                </h3>
                                <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
                                    {activeTab === "agencies" && "Manage multiple client workspaces from a single dashboard. Deploy custom agents for each brand voice and automate your monthly reporting."}
                                    {activeTab === "ecommerce" && "Our AI day-trades your ads 24/7. It kills losing ads instantly and scales winners while you sleep. Integrate with Shopify for ROAS based on real profit."}
                                    {activeTab === "enterprise" && "Deploy private LLMs trained on your proprietary data. SOC2 compliant security, SSO, and dedicated success managers to ensure smooth adoption."}
                                </p>
                                <ul className="space-y-4 mb-8">
                                    {[1, 2, 3].map(i => (
                                        <li key={i} className="flex items-center gap-3 font-bold text-slate-700">
                                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                            {activeTab === "agencies" && ["Multi-tenant Dashboard", "White-label Reporting", "Asset Sharing"][i - 1]}
                                            {activeTab === "ecommerce" && ["Dynamic Product Ads", "LTV Prediction", "Inventory Sync"][i - 1]}
                                            {activeTab === "enterprise" && ["SSO & audit Logs", "Private Cloud Option", "SLA Support"][i - 1]}
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/register" className="text-indigo-700 font-bold hover:underline flex items-center gap-2">
                                    Learn more about {activeTab} <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 aspect-video flex items-center justify-center relative overflow-hidden">
                                {activeTab === "agencies" && (
                                    <Image
                                        src="/images/solution-agencies.png"
                                        alt="Agency Dashboard"
                                        fill
                                        className="object-cover"
                                    />
                                )}
                                {activeTab === "ecommerce" && (
                                    <Image
                                        src="/images/solution-ecommerce.png"
                                        alt="E-Commerce Dashboard"
                                        fill
                                        className="object-cover"
                                    />
                                )}
                                {activeTab === "enterprise" && (
                                    <Image
                                        src="/images/solution-enterprise.png"
                                        alt="Enterprise Dashboard"
                                        fill
                                        className="object-cover"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ROI CALCULATOR --- */}
            <section id="roi" className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-indigo-400 font-bold tracking-wider uppercase text-sm">ROI Calculator</span>
                            <h2 className="text-4xl font-black mt-2 mb-6 text-white">See how much you're wasting</h2>
                            <p className="text-slate-300 text-lg mb-8 font-medium">
                                Most marketing teams spend 30% of their budget on low-performing ads and manual labor costs. C(AI)DENCE recaptures that value.
                            </p>

                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between mb-2 font-bold">
                                        <label className="text-slate-200">Monthly Ad Spend</label>
                                        <span className="text-indigo-400">${spend.toLocaleString()}</span>
                                    </div>
                                    <input
                                        type="range" min="1000" max="100000" step="1000"
                                        value={spend} onChange={(e) => setSpend(parseInt(e.target.value))}
                                        className="w-full cursor-pointer accent-indigo-500"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2 font-bold">
                                        <label className="text-slate-200">Current CPA</label>
                                        <span className="text-indigo-400">${cpa}</span>
                                    </div>
                                    <input
                                        type="range" min="10" max="200" step="5"
                                        value={cpa} onChange={(e) => setCpa(parseInt(e.target.value))}
                                        className="w-full cursor-pointer accent-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 lg:p-12 shadow-2xl">
                            <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-white">
                                <Sparkles className="w-5 h-5 text-indigo-400" /> Projected Annual Impact
                            </h3>
                            <div className="grid grid-cols-1 gap-8">
                                <div className="bg-slate-900/60 rounded-2xl p-6 border border-white/10">
                                    <div className="text-slate-300 text-sm font-bold uppercase mb-2">Wasted Spend Recovered</div>
                                    <div className="text-4xl font-black text-emerald-400">
                                        ${annualSavings.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-slate-400 mt-2 font-medium">Based on 32% efficiency gain</div>
                                </div>
                                <div className="bg-slate-900/60 rounded-2xl p-6 border border-white/10">
                                    <div className="text-slate-300 text-sm font-bold uppercase mb-2">Campaigns Launched</div>
                                    <div className="text-4xl font-black text-indigo-400">
                                        {(12 * 4)} <span className="text-lg text-slate-400 font-medium">Auto-generated</span>
                                    </div>
                                    <div className="text-sm text-slate-400 mt-2 font-medium">Assuming 4 campaigns/mo</div>
                                </div>
                            </div>
                            <button className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 border border-indigo-500">
                                Start Recovering Budget
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CAPABILITIES GRID --- */}
            <section id="capabilities" className="py-24 px-6 bg-slate-100 border-t border-slate-200">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <span className="text-indigo-700 font-bold tracking-wider uppercase text-sm">Capabilities</span>
                        <h2 className="text-4xl font-black text-slate-900 mt-2">One Platform. Infinite Possibilities.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Large Card: AI Agent */}
                        <div className="md:col-span-2 bg-white rounded-3xl p-10 border border-slate-300 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 mb-6">
                                    <Target className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Autonomous Strategy Agent</h3>
                                <p className="text-slate-600 max-w-md font-medium">Our AI doesn't just write copy. It researches your market, defines buyer personas, and builds complete go-to-market strategies.</p>
                            </div>
                            <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-l from-indigo-600 to-transparent"></div>
                        </div>

                        {/* Card: Content Studio */}
                        <div className="md:col-span-1 bg-white rounded-3xl p-10 border border-slate-300 shadow-sm hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-700 mb-6">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Hyper-Speed Content</h3>
                            <p className="text-slate-600 text-sm font-medium">Generate weeks worth of social posts, blogs, and ad copy in minutes. All on-brand.</p>
                        </div>

                        {/* Card: Analytics */}
                        <div className="md:col-span-1 bg-white rounded-3xl p-10 border border-slate-300 shadow-sm hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 mb-6">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Unified Analytics</h3>
                            <p className="text-slate-600 text-sm font-medium">Cross-channel reporting that actually makes sense. Track ROI, ROAS, and LTV automatically.</p>
                        </div>

                        {/* Large Card: Automation */}
                        <div className="md:col-span-2 bg-white rounded-3xl p-10 border border-slate-300 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 mb-6">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Workflow Automation</h3>
                                <p className="text-slate-600 max-w-md font-medium">Connect your CRM, Email, and Ad platforms. Trigger actions based on real-time user behavior.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TESTIMONIALS --- */}
            <section className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-indigo-700 font-bold tracking-wider uppercase text-sm">Customer Stories</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mt-2">Loved by marketing teams worldwide</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                quote: "C(AI)DENCE reduced our campaign creation time by 80%. What used to take our team a week now happens in hours.",
                                name: "Sarah Chen",
                                role: "Head of Growth",
                                company: "TechScale Inc.",
                                stars: 5
                            },
                            {
                                quote: "The AI agent understood our brand voice perfectly. It's like having a senior strategist working 24/7.",
                                name: "Marcus Thompson",
                                role: "CMO",
                                company: "Elevate Commerce",
                                stars: 5
                            },
                            {
                                quote: "Finally, one platform that does it all. We consolidated 6 different tools into C(AI)DENCE and never looked back.",
                                name: "Priya Sharma",
                                role: "Marketing Director",
                                company: "GlobalBrands Agency",
                                stars: 5
                            }
                        ].map((testimonial, i) => (
                            <div key={i} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.stars)].map((_, j) => (
                                        <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <Quote className="w-8 h-8 text-indigo-200 mb-4" />
                                <p className="text-slate-700 text-lg font-medium leading-relaxed mb-6">"{testimonial.quote}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{testimonial.name}</div>
                                        <div className="text-sm text-slate-500">{testimonial.role}, {testimonial.company}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FAQ SECTION --- */}
            <section id="faq" className="py-24 px-6 bg-white border-t border-slate-200">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {[
                            { q: "Is my data safe?", a: "Absolutely. We rely on enterprise-grade encryption and never use your proprietary data to train our public models. Your brand assets remain isolated." },
                            { q: "Can I connect my own Ad Accounts?", a: "Yes. C(AI)DENCE integrates natively with Meta Ads Manager, Google Ads, LinkedIn Campaign Manager, and TikTok Ads. You retain full ownership." },
                            { q: "Do you offer agency white-labeling?", a: "Yes! Our Agency Plan allows you to customize the dashboard with your logo and domain, so your clients see your brand, powered by our AI." },
                            { q: "Can I try it for free?", a: "We offer a 7-day full access trial. No credit card required to explore the platform and generate your first strategy." },
                        ].map((faq, i) => (
                            <div key={i} className="border border-slate-300 rounded-2xl overflow-hidden hover:border-indigo-200 transition-colors">
                                <button
                                    onClick={() => toggleFaq(i)}
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors bg-white hover:bg-slate-50"
                                >
                                    <span className="font-bold text-slate-900 text-lg">{faq.q}</span>
                                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
                                </button>
                                {openFaq === i && (
                                    <div className="p-6 pt-0 text-slate-600 leading-relaxed bg-slate-50/50 font-medium border-t border-slate-200">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- TESTIMONIALS SECTION --- */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-indigo-700 font-bold tracking-wider uppercase text-sm">Testimonials</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mt-2">Loved by growth teams</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                quote: "C(AI)DENCE replaced our entire media buying agency. We're spending 40% less on ads while revenue is up 2x. It's actually insane.",
                                author: "Sarah Jenkins",
                                role: "CMO at StyleBox",
                                company: "DTC Fashion"
                            },
                            {
                                quote: "The competitor analysis feature alone is worth the subscription. It found a creative angle we hadn't thought of, and it became our best performer.",
                                author: "Marcus Chen",
                                role: "Founder",
                                company: "TechFlow"
                            },
                            {
                                quote: "Finally, an AI tool that doesn't just generate text but actually DOES the work. The autonomous agent manages our campaigns perfectly.",
                                author: "Elena Rodriguez",
                                role: "Head of Growth",
                                company: "HealthPlus"
                            }
                        ].map((t, i) => (
                            <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-all duration-300">
                                <div className="flex text-indigo-500 mb-4">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className="w-5 h-5 fill-current" />
                                    ))}
                                </div>
                                <p className="text-slate-700 text-lg font-medium italic mb-6">"{t.quote}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
                                        {t.author.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{t.author}</div>
                                        <div className="text-sm text-slate-500">{t.role}, {t.company}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- PRICING SECTION --- */}
            <section id="pricing" className="py-24 px-6 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-indigo-700 font-bold tracking-wider uppercase text-sm">Pricing</span>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mt-2">Simple, transparent pricing</h2>
                        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Start free, scale as you grow. No hidden fees.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                name: "Starter",
                                price: "$49",
                                period: "/month",
                                description: "Perfect for solopreneurs and small teams",
                                features: ["1 Workspace", "5 Campaigns/month", "AI Chat Assistant", "Basic Analytics", "Email Support"],
                                popular: false
                            },
                            {
                                name: "Professional",
                                price: "$149",
                                period: "/month",
                                description: "For growing agencies and e-commerce brands",
                                features: ["5 Workspaces", "Unlimited Campaigns", "AI Strategy Agent", "Advanced Analytics", "Priority Support", "White-label Reports"],
                                popular: true
                            },
                            {
                                name: "Enterprise",
                                price: "Custom",
                                period: "",
                                description: "For large teams with custom requirements",
                                features: ["Unlimited Workspaces", "Custom Integrations", "Dedicated Success Manager", "SSO & Audit Logs", "SLA Guarantee", "Private Cloud Option"],
                                popular: false
                            }
                        ].map((plan, i) => (
                            <div key={i} className={`bg-white rounded-3xl p-8 border-2 ${plan.popular ? 'border-indigo-600 shadow-xl shadow-indigo-100 scale-105' : 'border-slate-200'} relative`}>
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                                    <span className="text-slate-500 font-medium">{plan.period}</span>
                                </div>
                                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                                <ul className="mt-6 space-y-3">
                                    {plan.features.map((feature, j) => (
                                        <li key={j} className="flex items-center gap-2 text-sm text-slate-700">
                                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/register" className={`mt-8 block w-full py-3 text-center font-bold rounded-xl transition-all ${plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                    Get Started
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-24 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-black">Ready to transform your marketing?</h2>
                    <p className="mt-6 text-xl text-indigo-100 max-w-2xl mx-auto">
                        Join 10,000+ marketers who are already using C(AI)DENCE to automate campaigns, generate content, and scale their business.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register" className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-2xl text-lg hover:bg-indigo-50 transition-all shadow-xl flex items-center justify-center gap-2">
                            Start Free Trial <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="px-8 py-4 bg-transparent border-2 border-white/50 text-white font-bold rounded-2xl text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            <PlayCircle className="w-5 h-5" /> Watch Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-100 border-t border-slate-300 pt-20 pb-10 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xl font-black text-slate-900">C(AI)DENCE</span>
                        </div>
                        <p className="text-slate-600 text-sm max-w-xs leading-relaxed font-medium">
                            The world's first autonomous marketing operating system. Built for agencies and growth teams.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Product</h4>
                        <ul className="space-y-3 text-sm text-slate-600 font-medium">
                            <li><Link href="#" className="hover:text-indigo-700">Features</Link></li>
                            <li><Link href="#" className="hover:text-indigo-700">Integrations</Link></li>
                            <li><Link href="#" className="hover:text-indigo-700">Enterprise</Link></li>
                            <li><Link href="#" className="hover:text-indigo-700">Roadmap</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Company</h4>
                        <ul className="space-y-3 text-sm text-slate-600 font-medium">
                            <li><Link href="#" className="hover:text-indigo-700">About</Link></li>
                            <li><Link href="#" className="hover:text-indigo-700">Careers</Link></li>
                            <li><Link href="#" className="hover:text-indigo-700">Blog</Link></li>
                            <li><Link href="#" className="hover:text-indigo-700">Contact</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-300">
                    <div className="text-xs text-slate-500 font-bold">
                        &copy; 2026 C(AI)DENCE Inc.
                    </div>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Globe className="w-4 h-4 text-slate-500" />
                        <Shield className="w-4 h-4 text-slate-500" />
                    </div>
                </div>
            </footer>
        </div>
    );
}
