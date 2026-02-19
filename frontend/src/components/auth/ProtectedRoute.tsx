"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasPermission, Permission, UserRole } from "@/lib/permissions";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: Permission;
    requiredRole?: UserRole;
    fallbackPath?: string;
}

function getStoredUser() {
    try {
        const raw = typeof localStorage !== "undefined" ? localStorage.getItem("user") : null;
        if (raw) return JSON.parse(raw);
    } catch {
        // ignore
    }
    return null;
}

/**
 * Wrapper component to protect routes based on permissions or roles.
 * Uses real user data from localStorage (populated at login).
 */
export function ProtectedRoute({
    children,
    requiredPermission,
    requiredRole,
    fallbackPath = "/",
}: ProtectedRouteProps) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            router.replace("/login");
            return;
        }

        const user = getStoredUser();
        if (!user) {
            // No cached user — allow through, real RBAC checks happen in PermissionContext
            setAuthorized(true);
            return;
        }

        // Redirect unapproved users to pending-approval
        if (!user.is_approved) {
            router.replace("/pending-approval");
            return;
        }

        const role = (user.role || "viewer") as UserRole;

        // Check permission if specified
        if (requiredPermission && !hasPermission(role, requiredPermission)) {
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
            const userLevel = roleHierarchy[role] || 0;
            const requiredLevel = roleHierarchy[requiredRole] || 100;

            if (userLevel < requiredLevel) {
                router.replace(fallbackPath);
                return;
            }
        }

        setAuthorized(true);
    }, [requiredPermission, requiredRole, fallbackPath, router]);

    if (!authorized) return null;
    return <>{children}</>;
}

/**
 * Hook to get current user info from localStorage.
 */
export function useCurrentUser() {
    const user = getStoredUser();
    if (user) {
        return {
            id: user.id,
            email: user.email,
            full_name: user.full_name || "",
            role: (user.role || "viewer") as UserRole,
            organization_id: user.organization_id,
            is_authenticated: true,
        };
    }
    return {
        id: 0,
        email: "",
        full_name: "",
        role: "viewer" as UserRole,
        organization_id: 0,
        is_authenticated: false,
    };
}
