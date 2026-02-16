"use client";

import React from "react";
import { usePermissionContext } from "@/contexts/PermissionContext";
import type { UserRole } from "@/lib/permissions";

interface PermissionGateProps {
    /** Permission string to check, e.g. "campaign:write" */
    require?: string;
    /** Multiple permissions — user must have ALL of them */
    requireAll?: string[];
    /** Multiple permissions — user must have ANY of them */
    requireAny?: string[];
    /** Required minimum role level */
    requireRole?: UserRole;
    /** Content to render when access is denied (optional) */
    fallback?: React.ReactNode;
    /** Children to render when access is granted */
    children: React.ReactNode;
}

/**
 * Conditionally renders children based on the user's permissions.
 *
 * Usage:
 *   <PermissionGate require="campaign:write">
 *     <CreateCampaignButton />
 *   </PermissionGate>
 *
 *   <PermissionGate requireAny={["campaign:read", "analytics:read"]}>
 *     <Dashboard />
 *   </PermissionGate>
 *
 *   <PermissionGate require="admin:write" fallback={<p>Access denied</p>}>
 *     <AdminPanel />
 *   </PermissionGate>
 */
export function PermissionGate({
    require,
    requireAll,
    requireAny,
    requireRole,
    fallback = null,
    children,
}: PermissionGateProps) {
    const { hasPermission, role, isSuperAdmin, loading } = usePermissionContext();

    // While loading, render nothing (prevents flash of unauthorized content)
    if (loading) return null;

    // Super admins pass all gates
    if (isSuperAdmin) return <>{children}</>;

    // Check single permission
    if (require && !hasPermission(require)) {
        return <>{fallback}</>;
    }

    // Check ALL permissions required
    if (requireAll && !requireAll.every(hasPermission)) {
        return <>{fallback}</>;
    }

    // Check ANY permission required
    if (requireAny && !requireAny.some(hasPermission)) {
        return <>{fallback}</>;
    }

    // Check minimum role
    if (requireRole && role) {
        const hierarchy: Record<string, number> = {
            root: 110,
            super_admin: 100,
            agency_admin: 80,
            agency_member: 60,
            brand_admin: 50,
            brand_member: 40,
            creator: 20,
            viewer: 10,
        };
        const userLevel = hierarchy[role] || 0;
        const requiredLevel = hierarchy[requireRole] || 100;
        if (userLevel < requiredLevel) {
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
}
