"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasPermission, Permission, UserRole } from "@/lib/permissions";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: Permission;
    requiredRole?: UserRole;
    fallbackPath?: string;
}

/**
 * Wrapper component to protect routes based on permissions or roles.
 * For now, uses mock user data. Will integrate with real auth later.
 */
export function ProtectedRoute({
    children,
    requiredPermission,
    requiredRole,
    fallbackPath = "/",
}: ProtectedRouteProps) {
    const router = useRouter();

    // Mock current user - in production, this would come from auth context
    const mockUser = {
        id: 1,
        email: "admin@cadence.ai",
        role: "super_admin" as UserRole,
        organization_id: 1,
    };

    useEffect(() => {
        // Check permission if specified
        if (requiredPermission && !hasPermission(mockUser.role, requiredPermission)) {
            router.replace(fallbackPath);
            return;
        }

        // Check role if specified
        if (requiredRole) {
            const roleHierarchy: Record<UserRole, number> = {
                root: 110,
                super_admin: 100,
                agency_admin: 80,
                agency_member: 60,
                brand_admin: 50,
                brand_member: 40,
                creator: 20,
                viewer: 10,
            };
            const userLevel = roleHierarchy[mockUser.role] || 0;
            const requiredLevel = roleHierarchy[requiredRole] || 100;

            if (userLevel < requiredLevel) {
                router.replace(fallbackPath);
                return;
            }
        }
    }, [requiredPermission, requiredRole, fallbackPath, router]);

    // For now, always render children (mock auth)
    return <>{children}</>;
}

/**
 * Hook to get current user info.
 * In production, this would come from auth context/JWT.
 */
export function useCurrentUser() {
    // Mock user for development
    return {
        id: 1,
        email: "admin@cadence.ai",
        full_name: "Admin User",
        role: "super_admin" as UserRole,
        organization_id: 1,
        is_authenticated: true,
    };
}
