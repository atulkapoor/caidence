/**
 * Permission definitions and RBAC utilities for C(AI)DENCE.
 */

export type UserRole =
    | "super_admin"
    | "agency_admin"
    | "agency_member"
    | "brand_admin"
    | "brand_member"
    | "creator"
    | "viewer";

// Role hierarchy levels (higher = more permissions)
const ROLE_HIERARCHY: Record<UserRole, number> = {
    super_admin: 100,
    agency_admin: 80,
    agency_member: 60,
    brand_admin: 50,
    brand_member: 40,
    creator: 20,
    viewer: 10,
};

// Permission actions
export type Permission =
    | "admin:access"
    | "admin:manage_users"
    | "admin:manage_billing"
    | "agency:view"
    | "agency:manage"
    | "brand:view"
    | "brand:manage"
    | "brand:create"
    | "creator:view"
    | "creator:manage"
    | "creator:add"
    | "campaign:view"
    | "campaign:manage"
    | "content:view"
    | "content:create";

// Role-to-permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    super_admin: [
        "admin:access",
        "admin:manage_users",
        "admin:manage_billing",
        "agency:view",
        "agency:manage",
        "brand:view",
        "brand:manage",
        "brand:create",
        "creator:view",
        "creator:manage",
        "creator:add",
        "campaign:view",
        "campaign:manage",
        "content:view",
        "content:create",
    ],
    agency_admin: [
        "agency:view",
        "agency:manage",
        "brand:view",
        "brand:manage",
        "brand:create",
        "creator:view",
        "creator:manage",
        "creator:add",
        "campaign:view",
        "campaign:manage",
        "content:view",
        "content:create",
    ],
    agency_member: [
        "agency:view",
        "brand:view",
        "creator:view",
        "campaign:view",
        "content:view",
        "content:create",
    ],
    brand_admin: [
        "brand:view",
        "brand:manage",
        "creator:view",
        "creator:manage",
        "creator:add",
        "campaign:view",
        "campaign:manage",
        "content:view",
        "content:create",
    ],
    brand_member: [
        "brand:view",
        "creator:view",
        "campaign:view",
        "content:view",
        "content:create",
    ],
    creator: [
        "content:view",
        "content:create",
    ],
    viewer: [
        "content:view",
    ],
};

/**
 * Check if a user role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
}

/**
 * Check if a user role meets or exceeds a required role level.
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 100;
    return userLevel >= requiredLevel;
}

/**
 * Check if user is a super admin.
 */
export function isSuperAdmin(role: UserRole): boolean {
    return role === "super_admin";
}

/**
 * Check if user has agency-level access.
 */
export function isAgencyLevel(role: UserRole): boolean {
    return ["super_admin", "agency_admin", "agency_member"].includes(role);
}

/**
 * Check if user has brand-level access.
 */
export function isBrandLevel(role: UserRole): boolean {
    return ["super_admin", "agency_admin", "agency_member", "brand_admin", "brand_member"].includes(role);
}

/**
 * Get display name for a role.
 */
export function getRoleDisplayName(role: UserRole): string {
    const names: Record<UserRole, string> = {
        super_admin: "Super Admin",
        agency_admin: "Agency Admin",
        agency_member: "Agency Member",
        brand_admin: "Brand Admin",
        brand_member: "Brand Member",
        creator: "Creator",
        viewer: "Viewer",
    };
    return names[role] || role;
}

/**
 * Get all available roles (for dropdowns).
 */
export function getAllRoles(): { value: UserRole; label: string }[] {
    return Object.keys(ROLE_HIERARCHY).map((role) => ({
        value: role as UserRole,
        label: getRoleDisplayName(role as UserRole),
    }));
}
