import { useState, useEffect } from "react";
import { fetchCampaignAnalytics, CampaignAnalytics } from "@/lib/api";

export function useCampaignAnalytics() {
    const [data, setData] = useState<CampaignAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const stats = await fetchCampaignAnalytics();
                setData(stats);
            } catch (e: any) {
                console.error(e);
                setError(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return { data, loading, error };
}
