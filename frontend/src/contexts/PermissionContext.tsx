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
        if (typeof localStorage !== "undefined" && !localStorage.getItem("token")) {
            setData(null);
            setLoading(false);
            return;
        }
        try {
            // Prevent stale permissions from previous session/user while reloading.
            setData(null);
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

    useEffect(() => {
        const handleAuthChanged = () => {
            fetchPermissions();
        };
        const handleStorage = (event: StorageEvent) => {
            if (!event.key || ["token", "refresh_token", "user"].includes(event.key)) {
                fetchPermissions();
            }
        };
        window.addEventListener("auth-session-changed", handleAuthChanged as EventListener);
        window.addEventListener("storage", handleStorage);
        return () => {
            window.removeEventListener("auth-session-changed", handleAuthChanged as EventListener);
            window.removeEventListener("storage", handleStorage);
        };
    }, [fetchPermissions]);

    const hasPermission = useCallback(
        (permission: string): boolean => {
            if (!data) return false;
            if (data.is_super_admin) return true;
            const granted = new Set(data.permissions || []);
            if (granted.has("*:*")) return true;
            if (granted.has(permission)) return true;

            const [resource, action] = permission.split(":");
            if (!resource || !action) return granted.has(permission);
            if (granted.has(`${resource}:*`)) return true;

            // Action compatibility:
            // create => create (+read implied separately)
            // write => update existing (legacy alias)
            // update => update OR legacy write
            // delete => delete only
            // read => read OR create OR update/write
            if (action === "create") return granted.has(`${resource}:create`);
            if (action === "write") return granted.has(`${resource}:write`) || granted.has(`${resource}:update`);
            if (action === "update") return granted.has(`${resource}:update`) || granted.has(`${resource}:write`);
            if (action === "delete") return granted.has(`${resource}:delete`);
            if (action === "read") {
                return (
                    granted.has(`${resource}:read`) ||
                    granted.has(`${resource}:create`) ||
                    granted.has(`${resource}:update`) ||
                    granted.has(`${resource}:write`)
                );
            }
            return false;
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
