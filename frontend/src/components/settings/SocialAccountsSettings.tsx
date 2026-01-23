"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Facebook, Instagram, Linkedin, Twitter, Check } from "lucide-react";

export default function SocialAccountsSettings() {
    const [accounts, setAccounts] = useState([
        { id: 'instagram', name: 'Instagram', icon: Instagram, connected: true, handle: '@alex_designs' },
        { id: 'facebook', name: 'Facebook', icon: Facebook, connected: true, handle: 'Alex Rivera Design' },
        { id: 'twitter', name: 'X (Twitter)', icon: Twitter, connected: false, handle: '' },
        { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, connected: false, handle: '' },
    ]);

    const toggleConnection = (id: string) => {
        setAccounts(prev => prev.map(acc => {
            if (acc.id === id) {
                const newState = !acc.connected;
                if (newState) {
                    toast.success(`Connected to ${acc.name}`);
                    return { ...acc, connected: true, handle: '@demo_user' };
                } else {
                    toast.success(`Disconnected from ${acc.name}`);
                    return { ...acc, connected: false, handle: '' };
                }
            }
            return acc;
        }));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map((account) => (
                <div key={account.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${account.connected ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                            <account.icon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{account.name}</h3>
                            <p className="text-sm text-slate-500 font-medium">
                                {account.connected ? account.handle : "Not connected"}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => toggleConnection(account.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${account.connected
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                    >
                        {account.connected ? 'Disconnect' : 'Connect'}
                    </button>
                </div>
            ))}
        </div>
    );
}
