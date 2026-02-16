"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getMyPermissions, type EffectivePermissions } from "@/lib/api/rbac";
import type { UserRole } from "@/lib/permissions";

interface PermissionContextValue {
    /** The raw permissions data from the API */
    data: EffectivePermissions | null;
    /** Whether permissions are still loading */
    loading: boolean;
    /** Check if the user has a specific permission (e.g. "campaign:write") */
    hasPermission: (permission: string) => boolean;
    /** The user's role */
    role: UserRole | null;
    /** Whether the user is super admin or root */
    isSuperAdmin: boolean;
    /** Refresh permissions from the API */
    refresh: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue>({
    data: null,
    loading: true,
    hasPermission: () => false,
    role: null,
    isSuperAdmin: false,
    refresh: async () => {},
});

export function PermissionProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<EffectivePermissions | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPermissions = useCallback(async () => {
        try {
            setLoading(true);
            const perms = await getMyPermissions();
            setData(perms);
        } catch {
            // If fetching fails (e.g. not authenticated), set defaults
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    const hasPermission = useCallback(
        (permission: string): boolean => {
            if (!data) return false;
            if (data.is_super_admin) return true;
            if (data.permissions.includes("*:*")) return true;
            return data.permissions.includes(permission);
        },
        [data]
    );

    const value: PermissionContextValue = {
        data,
        loading,
        hasPermission,
        role: (data?.role as UserRole) || null,
        isSuperAdmin: data?.is_super_admin ?? false,
        refresh: fetchPermissions,
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
}

/**
 * Hook to access the permission context.
 * Must be used within a PermissionProvider.
 */
export function usePermissionContext() {
    return useContext(PermissionContext);
}
