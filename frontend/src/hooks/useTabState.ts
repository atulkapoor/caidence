"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

export function useTabState(defaultTab: string, queryKey: string = "tab") {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Initialize state from URL or default
    const [activeTab, setActiveTabState] = useState(searchParams.get(queryKey) || defaultTab);

    // Sync state when URL updates (e.g. browser back button)
    useEffect(() => {
        const currentTab = searchParams.get(queryKey);
        if (currentTab) {
            setActiveTabState(currentTab);
        }
    }, [searchParams, queryKey]);

    // Update URL when tab changes
    const setActiveTab = useCallback((tab: string) => {
        setActiveTabState(tab);

        // Create new params object
        const params = new URLSearchParams(searchParams.toString());
        params.set(queryKey, tab);

        // Push new route (shallow update to avoid full reload)
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, router, searchParams, queryKey]);

    return [activeTab, setActiveTab] as const;
}
