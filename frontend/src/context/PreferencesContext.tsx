"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface CapabilitiesVisibility {
    "Real Estate & Construction": boolean;
    "AI-Powered Intelligence": boolean;
    "Process Automation": boolean;
    "Performance Optimization": boolean;
}

interface PreferencesContextType {
    visibleCapabilities: CapabilitiesVisibility;
    toggleCapability: (key: keyof CapabilitiesVisibility) => void;
    industry: string;
    setIndustry: (industry: string) => void;
}

const defaultCapabilities: CapabilitiesVisibility = {
    "Real Estate & Construction": true,
    "AI-Powered Intelligence": true,
    "Process Automation": true,
    "Performance Optimization": true,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
    const [visibleCapabilities, setVisibleCapabilities] = useState<CapabilitiesVisibility>(defaultCapabilities);
    const [industry, setIndustryState] = useState("Technology");
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const savedPrefs = localStorage.getItem("dashboard_preferences");
        const savedIndustry = localStorage.getItem("user_industry");

        if (savedPrefs) {
            try {
                setVisibleCapabilities(JSON.parse(savedPrefs));
            } catch (e) {
                console.error("Failed to parse preferences", e);
            }
        }
        if (savedIndustry) {
            setIndustryState(savedIndustry);
        }
        setLoaded(true);
    }, []);

    const toggleCapability = (key: keyof CapabilitiesVisibility) => {
        setVisibleCapabilities(prev => {
            const next = { ...prev, [key]: !prev[key] };
            localStorage.setItem("dashboard_preferences", JSON.stringify(next));
            return next;
        });
    };

    const setIndustry = (ind: string) => {
        setIndustryState(ind);
        localStorage.setItem("user_industry", ind);
    };

    return (
        <PreferencesContext.Provider value={{ visibleCapabilities, toggleCapability, industry, setIndustry }}>
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (context === undefined) {
        throw new Error("usePreferences must be used within a PreferencesProvider");
    }
    return context;
}
