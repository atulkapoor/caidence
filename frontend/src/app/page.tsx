"use client";

import Link from "next/link";
import {
    ArrowRight, Bot, Sparkles, LayoutTemplate, Zap, CheckCircle2, BarChart3,
    Target, Megaphone, TrendingUp, PlayCircle, Globe, Shield,
    Briefcase, ShoppingBag, Building, Plus, Minus, ChevronDown, ChevronUp, Sliders
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("agencies");
    const [spend, setSpend] = useState(10000);
    const [cpa, setCpa] = useState(50);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
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
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
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
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3"></div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-bold text-slate-600 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            v2.0 is live: Autonomous Agents are here
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-slate-900">
                            The Unified <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">AI Marketing OS</span>
                        </h1>

                        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
                            Stop juggling tools. C(AI)DENCE replaces your agency stack with autonomous agents that plan, write, design, and optimize campaigns 24/7.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2">
                                Start 7-Day Free Trial
                            </Link>
                            <Link href="#" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl text-lg border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm flex items-center justify-center gap-2 group">
                                <PlayCircle className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" /> Watch Demo
                            </Link>
                        </div>

                        <div className="flex items-center gap-4 text-sm font-bold text-slate-400 pt-4">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
                                ))}
                            </div>
                            <p>Trusted by 10,000+ marketers</p>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent blur-2xl -z-10 rounded-full"></div>
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden relative group hover:scale-[1.02] transition-transform duration-500">
                            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                </div>
                                <div className="ml-4 px-3 py-1 bg-white rounded-md border border-slate-200 text-[10px] font-bold text-slate-400 flex-1 text-center">
                                    app.cadence.ai/dashboard
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="h-8 w-32 bg-slate-100 rounded-lg"></div>
                                    <div className="h-8 w-8 bg-indigo-100 rounded-lg"></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-24 bg-indigo-50 rounded-xl border border-indigo-100 p-4">
                                        <div className="w-8 h-8 bg-white rounded-lg mb-2 shadow-sm"></div>
                                        <div className="h-4 w-16 bg-indigo-200 rounded"></div>
                                    </div>
                                    <div className="h-24 bg-slate-50 rounded-xl border border-slate-100 p-4"></div>
                                    <div className="h-24 bg-slate-50 rounded-xl border border-slate-100 p-4"></div>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-2 h-40 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden">
                                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-indigo-100/50 to-transparent"></div>
                                        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-2 h-16">
                                            {[40, 60, 45, 70, 50, 80, 65].map((h, i) => (
                                                <div key={i} className="flex-1 bg-indigo-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-span-1 h-40 bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2">
                                        <div className="h-2 w-full bg-slate-200 rounded"></div>
                                        <div className="h-2 w-3/4 bg-slate-200 rounded"></div>
                                        <div className="h-2 w-1/2 bg-slate-200 rounded"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-8 right-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce">
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">ROI</div>
                                    <div className="text-lg font-black text-slate-900">+428%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Logo Cloud --- */}
            <section className="py-10 border-y border-slate-100 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Powering next-gen marketing teams</p>
                    <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {["Acme Corp", "GlobalTech", "Nebula", "FoxRun", "Circle", "Trio"].map((name, i) => (
                            <div key={i} className="text-xl font-black text-slate-300 flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-300 rounded-full"></div> {name}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- SOLUTIONS TABS --- */}
            <section id="solutions" className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm">Tailored Solutions</span>
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
                                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all ${activeTab === tab.id
                                        ? "bg-slate-900 text-white shadow-lg scale-105"
                                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-6">
                                    {activeTab === "agencies" && "Scale to 100+ clients without hiring properly."}
                                    {activeTab === "ecommerce" && "Stop burning ad spend on bad creative."}
                                    {activeTab === "enterprise" && "Brand safety & compliance at scale."}
                                </h3>
                                <p className="text-lg text-slate-500 mb-8 leading-relaxed">
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
                                <Link href="/register" className="text-indigo-600 font-bold hover:underline flex items-center gap-2">
                                    Learn more about {activeTab} <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 aspect-video flex items-center justify-center relative overflow-hidden">
                                {activeTab === "agencies" && <Briefcase className="w-24 h-24 text-indigo-100" />}
                                {activeTab === "ecommerce" && <ShoppingBag className="w-24 h-24 text-pink-100" />}
                                {activeTab === "enterprise" && <Building className="w-24 h-24 text-slate-100" />}
                                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/5 to-transparent"></div>
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
                            <h2 className="text-4xl font-black mt-2 mb-6">See how much you're wasting</h2>
                            <p className="text-slate-400 text-lg mb-8">
                                Most marketing teams spend 30% of their budget on low-performing ads and manual labor costs. C(AI)DENCE recaptures that value.
                            </p>

                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between mb-2 font-bold">
                                        <label>Monthly Ad Spend</label>
                                        <span className="text-indigo-400">${spend.toLocaleString()}</span>
                                    </div>
                                    <input
                                        type="range" min="1000" max="100000" step="1000"
                                        value={spend} onChange={(e) => setSpend(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2 font-bold">
                                        <label>Current CPA</label>
                                        <span className="text-indigo-400">${cpa}</span>
                                    </div>
                                    <input
                                        type="range" min="10" max="200" step="5"
                                        value={cpa} onChange={(e) => setCpa(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 lg:p-12">
                            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-400" /> Projected Annual Impact
                            </h3>
                            <div className="grid grid-cols-1 gap-8">
                                <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
                                    <div className="text-slate-400 text-sm font-bold uppercase mb-2">Wasted Spend Recovered</div>
                                    <div className="text-4xl font-black text-emerald-400">
                                        ${annualSavings.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-slate-500 mt-2">Based on 32% efficiency gain</div>
                                </div>
                                <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
                                    <div className="text-slate-400 text-sm font-bold uppercase mb-2">Campaigns Launched</div>
                                    <div className="text-4xl font-black text-indigo-400">
                                        {(12 * 4)} <span className="text-lg text-slate-500 font-medium">Auto-generated</span>
                                    </div>
                                    <div className="text-sm text-slate-500 mt-2">Assuming 4 campaigns/mo</div>
                                </div>
                            </div>
                            <button className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30">
                                Start Recovering Budget
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CAPABILITIES GRID --- */}
            <section id="capabilities" className="py-24 px-6 bg-slate-50/50">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm">Capabilities</span>
                        <h2 className="text-4xl font-black text-slate-900 mt-2">One Platform. Infinite Possibilities.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Large Card: AI Agent */}
                        <div className="md:col-span-2 bg-white rounded-3xl p-10 border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                                    <Target className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Autonomous Strategy Agent</h3>
                                <p className="text-slate-500 max-w-md">Our AI doesn't just write copy. It researches your market, defines buyer personas, and builds complete go-to-market strategies.</p>
                            </div>
                            <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-l from-indigo-600 to-transparent"></div>
                        </div>

                        {/* Card: Content Studio */}
                        <div className="md:col-span-1 bg-white rounded-3xl p-10 border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Hyper-Speed Content</h3>
                            <p className="text-slate-500 text-sm">Generate weeks worth of social posts, blogs, and ad copy in minutes. All on-brand.</p>
                        </div>

                        {/* Card: Analytics */}
                        <div className="md:col-span-1 bg-white rounded-3xl p-10 border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Unified Analytics</h3>
                            <p className="text-slate-500 text-sm">Cross-channel reporting that actually makes sense. Track ROI, ROAS, and LTV automatically.</p>
                        </div>

                        {/* Large Card: Automation */}
                        <div className="md:col-span-2 bg-white rounded-3xl p-10 border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Workflow Automation</h3>
                                <p className="text-slate-500 max-w-md">Connect your CRM, Email, and Ad platforms. Trigger actions based on real-time user behavior.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FAQ SECTION --- */}
            <section id="faq" className="py-24 px-6 bg-white border-t border-slate-100">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {[
                            { q: "Is my data safe?", a: "Absolutely. We rely on enterprise-grade encryption and never use your proprietary data to train our public models. Your brand assets remain isolated." },
                            { q: "Can I connect my own Ad Accounts?", a: "Yes. C(AI)DENCE integrates natively with Meta Ads Manager, Google Ads, LinkedIn Campaign Manager, and TikTok Ads. You retain full ownership." },
                            { q: "Do you offer agency white-labeling?", a: "Yes! Our Agency Plan allows you to customize the dashboard with your logo and domain, so your clients see your brand, powered by our AI." },
                            { q: "Can I try it for free?", a: "We offer a 7-day full access trial. No credit card required to explore the platform and generate your first strategy." },
                        ].map((faq, i) => (
                            <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => toggleFaq(i)}
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-bold text-slate-900">{faq.q}</span>
                                    {openFaq === i ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                </button>
                                {openFaq === i && (
                                    <div className="p-6 pt-0 text-slate-500 leading-relaxed bg-slate-50/50">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xl font-black text-slate-900">C(AI)DENCE</span>
                        </div>
                        <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                            The world's first autonomous marketing operating system. Built for agencies and growth teams.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Product</h4>
                        <ul className="space-y-3 text-sm text-slate-500 font-medium">
                            <li><Link href="#" className="hover:text-indigo-600">Features</Link></li>
                            <li><Link href="#" className="hover:text-indigo-600">Integrations</Link></li>
                            <li><Link href="#" className="hover:text-indigo-600">Enterprise</Link></li>
                            <li><Link href="#" className="hover:text-indigo-600">Roadmap</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Company</h4>
                        <ul className="space-y-3 text-sm text-slate-500 font-medium">
                            <li><Link href="#" className="hover:text-indigo-600">About</Link></li>
                            <li><Link href="#" className="hover:text-indigo-600">Careers</Link></li>
                            <li><Link href="#" className="hover:text-indigo-600">Blog</Link></li>
                            <li><Link href="#" className="hover:text-indigo-600">Contact</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200">
                    <div className="text-xs text-slate-400 font-bold">
                        &copy; 2026 C(AI)DENCE Inc.
                    </div>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <Shield className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </footer>
        </div>
    );
}
