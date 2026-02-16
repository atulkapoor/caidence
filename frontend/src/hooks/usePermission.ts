"use client";

import { useMemo } from "react";
import { usePermissionContext } from "@/contexts/PermissionContext";

/**
 * Hook to check a single permission.
 *
 * Usage:
 *   const canEditCampaign = usePermission("campaign:write");
 *   const canViewAnalytics = usePermission("analytics:read");
 */
export function usePermission(permission: string): boolean {
    const { hasPermission, loading } = usePermissionContext();
    return !loading && hasPermission(permission);
}

/**
 * Hook to check multiple permissions at once.
 *
 * Usage:
 *   const { canRead, canWrite } = usePermissions({
 *     canRead: "campaign:read",
 *     canWrite: "campaign:write",
 *   });
 */
export function usePermissions<T extends Record<string, string>>(
    permissionMap: T
): Record<keyof T, boolean> {
    const { hasPermission, loading } = usePermissionContext();

    return useMemo(() => {
        const result = {} as Record<keyof T, boolean>;
        for (const [key, perm] of Object.entries(permissionMap)) {
            result[key as keyof T] = !loading && hasPermission(perm);
        }
        return result;
    }, [permissionMap, hasPermission, loading]);
}

/**
 * Hook to get the user's role and admin status.
 *
 * Usage:
 *   const { role, isSuperAdmin } = useUserRole();
 */
export function useUserRole() {
    const { role, isSuperAdmin, loading } = usePermissionContext();
    return { role, isSuperAdmin, loading };
}
