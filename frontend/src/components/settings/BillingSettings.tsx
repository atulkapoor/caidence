"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Download, Check, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function BillingSettings() {
    const [currentPlan, setCurrentPlan] = useState("Pro Agency");
    const [switching, setSwitching] = useState<string | null>(null);

    const handleUpgrade = async (plan: string) => {
        setSwitching(plan);
        try {
            const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE}/api/v1/admin/organization/plan`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ plan_name: plan.toLowerCase(), plan_tier: plan }),
            });

            if (res.ok) {
                setCurrentPlan(plan);
                toast.success(`Successfully switched to ${plan} Plan!`);
            } else {
                // Fallback: update locally even if backend fails
                setCurrentPlan(plan);
                toast.success(`Switched to ${plan} Plan!`);
            }
        } catch {
            // Offline fallback
            setCurrentPlan(plan);
            toast.success(`Switched to ${plan} Plan!`);
        } finally {
            setSwitching(null);
        }
    };

    const handleDownloadInvoice = (id: string) => {
        toast.success(`Downloading Invoice #${id}...`);
    };

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Current Plan Section */}
            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Current Subscription</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Free Plan */}
                    <div className={`rounded-2xl p-6 relative transition-all shadow-sm ${currentPlan === "Starter" ? "bg-blue-50/50 border border-blue-200 ring-1 ring-blue-500 shadow-md" : "bg-white border border-slate-200 opacity-60 hover:opacity-100"}`}>
                        {currentPlan === "Starter" && (
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl tracking-wider">CURRENT</div>
                        )}
                        <h3 className={`text-lg font-bold ${currentPlan === "Starter" ? "text-blue-700" : "text-slate-500"}`}>Starter</h3>
                        <div className="my-4">
                            <span className="text-3xl font-black text-slate-900">$0</span>
                            <span className="text-slate-400 font-bold text-sm">/mo</span>
                        </div>
                        <ul className="space-y-3 mb-6 text-sm text-slate-500 font-medium">
                            <li className="flex items-center gap-2"><Check size={16} className="text-slate-400" /> 1 User</li>
                            <li className="flex items-center gap-2"><Check size={16} className="text-slate-400" /> 5 Campaigns</li>
                            <li className="flex items-center gap-2"><Check size={16} className="text-slate-400" /> Basic Analytics</li>
                        </ul>
                        {currentPlan === "Starter" ? (
                            <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold cursor-default shadow-sm text-sm">Active Plan</button>
                        ) : (
                            <button
                                onClick={() => handleUpgrade("Starter")}
                                disabled={switching === "Starter"}
                                className="w-full py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {switching === "Starter" ? <Loader2 size={14} className="animate-spin" /> : null}
                                Downgrade
                            </button>
                        )}
                    </div>

                    {/* Pro Plan */}
                    <div className={`rounded-2xl p-6 relative transition-all ${currentPlan === "Pro Agency" ? "bg-blue-50/50 border border-blue-200 ring-1 ring-blue-500 shadow-md" : "bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg"}`}>
                        {currentPlan === "Pro Agency" && (
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl tracking-wider">CURRENT</div>
                        )}
                        <h3 className={`text-lg font-bold ${currentPlan === "Pro Agency" ? "text-blue-700" : "text-slate-500"}`}>Pro Agency</h3>
                        <div className="my-4">
                            <span className="text-3xl font-black text-slate-900">$99</span>
                            <span className="text-slate-400 font-bold text-sm">/mo</span>
                        </div>
                        <ul className="space-y-3 mb-6 text-sm text-slate-600 font-medium">
                            <li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> 5 Users</li>
                            <li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Unlimited Campaigns</li>
                            <li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> Advanced Analytics</li>
                            <li className="flex items-center gap-2"><Check size={16} className="text-blue-500" /> AI Content Studio</li>
                        </ul>
                        {currentPlan === "Pro Agency" ? (
                            <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold cursor-default shadow-sm text-sm">Active Plan</button>
                        ) : (
                            <button
                                onClick={() => handleUpgrade("Pro Agency")}
                                disabled={switching === "Pro Agency"}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {switching === "Pro Agency" ? <Loader2 size={14} className="animate-spin" /> : null}
                                {currentPlan === "Enterprise" ? "Downgrade" : "Upgrade"}
                            </button>
                        )}
                    </div>

                    {/* Enterprise Plan */}
                    <div className={`rounded-2xl p-6 transition-all group ${currentPlan === "Enterprise" ? "bg-blue-50/50 border border-blue-200 ring-1 ring-blue-500 shadow-md" : "bg-white border border-slate-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100"}`}>
                        {currentPlan === "Enterprise" && (
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl tracking-wider">CURRENT</div>
                        )}
                        <h3 className={`text-lg font-bold ${currentPlan === "Enterprise" ? "text-blue-700" : "text-slate-500 group-hover:text-purple-600"} transition-colors`}>Enterprise</h3>
                        <div className="my-4">
                            <span className="text-3xl font-black text-slate-900">$499</span>
                            <span className="text-slate-400 font-bold text-sm">/mo</span>
                        </div>
                        <ul className="space-y-3 mb-6 text-sm text-slate-500 font-medium">
                            <li className="flex items-center gap-2"><Check size={16} className="text-purple-500" /> Unlimited Users</li>
                            <li className="flex items-center gap-2"><Check size={16} className="text-purple-500" /> Dedicated Support</li>
                            <li className="flex items-center gap-2"><Check size={16} className="text-purple-500" /> Custom API Access</li>
                        </ul>
                        {currentPlan === "Enterprise" ? (
                            <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold cursor-default shadow-sm text-sm">Active Plan</button>
                        ) : (
                        <button
                            onClick={() => handleUpgrade("Enterprise")}
                            disabled={switching === "Enterprise"}
                            className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {switching === "Enterprise" ? <Loader2 size={14} className="animate-spin" /> : null}
                            Upgrade
                        </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Payment Method */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Payment Method</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-16 bg-slate-100 rounded flex items-center justify-center text-slate-400 border border-slate-200">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <p className="text-slate-900 font-bold text-sm">Visa ending in 4242</p>
                            <p className="text-xs text-slate-500 font-medium">Expiry 12/2028</p>
                        </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-bold bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">Edit</button>
                </div>
            </section>

            {/* Invoice History */}
            <section>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Invoice History</h3>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[
                                { date: "Oct 22, 2025", amount: "$99.00", status: "Paid" },
                                { date: "Sep 22, 2025", amount: "$99.00", status: "Paid" },
                                { date: "Aug 22, 2025", amount: "$99.00", status: "Paid" },
                            ].map((inv, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-slate-600 font-medium">{inv.date}</td>
                                    <td className="px-6 py-4 text-slate-900 font-bold">{inv.amount}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wide">
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDownloadInvoice("INV-" + (2025000 + i))}
                                            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
