/**
 * Permission definitions and RBAC utilities for C(AI)DENCE.
 */

export type UserRole =
    | "root"
    | "super_admin"
    | "agency_admin"
    | "agency_member"
    | "brand_admin"
    | "brand_member"
    | "creator"
    | "viewer";

// Role hierarchy levels (higher = more permissions) — matches backend ROLE_HIERARCHY
const ROLE_HIERARCHY: Record<UserRole, number> = {
    root: 110,
    super_admin: 100,
    agency_admin: 80,
    agency_member: 60,
    brand_admin: 50,
    brand_member: 40,
    creator: 20,
    viewer: 10,
};

// Permission actions — unified with backend (resource:action using read/write)
export type Permission =
    | "admin:read"
    | "admin:write"
    | "agency:read"
    | "agency:write"
    | "brand:read"
    | "brand:write"
    | "creators:read"
    | "creators:write"
    | "campaign:read"
    | "campaign:write"
    | "content:read"
    | "content:write"
    | "analytics:read"
    | "analytics:write"
    | "discovery:read"
    | "discovery:write"
    | "crm:read"
    | "crm:write"
    | "design_studio:read"
    | "design_studio:write"
    | "marcom:read"
    | "marcom:write"
    | "workflow:read"
    | "workflow:write"
    | "ai_agent:read"
    | "ai_agent:write"
    | "ai_chat:read"
    | "ai_chat:write"
    | "content_studio:read"
    | "content_studio:write"
    | "presentation_studio:read"
    | "presentation_studio:write";

// Role-to-permissions mapping — matches backend role_permissions_map
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    root: [
        "admin:read", "admin:write",
        "agency:read", "agency:write",
        "brand:read", "brand:write",
        "creators:read", "creators:write",
        "campaign:read", "campaign:write",
        "content:read", "content:write",
        "analytics:read", "analytics:write",
        "discovery:read", "discovery:write",
        "crm:read", "crm:write",
        "design_studio:read", "design_studio:write",
        "marcom:read", "marcom:write",
        "workflow:read", "workflow:write",
        "ai_agent:read", "ai_agent:write",
        "ai_chat:read", "ai_chat:write",
        "content_studio:read", "content_studio:write",
        "presentation_studio:read", "presentation_studio:write",
    ],
    super_admin: [
        "admin:read", "admin:write",
        "agency:read", "agency:write",
        "brand:read", "brand:write",
        "creators:read", "creators:write",
        "campaign:read", "campaign:write",
        "content:read", "content:write",
        "analytics:read", "analytics:write",
        "discovery:read", "discovery:write",
        "crm:read", "crm:write",
        "design_studio:read", "design_studio:write",
        "marcom:read", "marcom:write",
        "workflow:read", "workflow:write",
        "ai_agent:read", "ai_agent:write",
        "ai_chat:read", "ai_chat:write",
        "content_studio:read", "content_studio:write",
        "presentation_studio:read", "presentation_studio:write",
    ],
    agency_admin: [
        "agency:read", "agency:write",
        "brand:read", "brand:write",
        "creators:read", "creators:write",
        "campaign:read", "campaign:write",
        "content:read", "content:write",
        "analytics:read",
        "discovery:read", "discovery:write",
        "crm:read", "crm:write",
        "design_studio:read", "design_studio:write",
        "marcom:read", "marcom:write",
        "workflow:read", "workflow:write",
        "ai_agent:read", "ai_agent:write",
        "ai_chat:read", "ai_chat:write",
        "content_studio:read", "content_studio:write",
        "presentation_studio:read", "presentation_studio:write",
    ],
    agency_member: [
        "agency:read",
        "brand:read",
        "creators:read",
        "campaign:read", "campaign:write",
        "content:read", "content:write",
        "analytics:read",
        "discovery:read",
        "design_studio:read", "design_studio:write",
        "workflow:read",
        "ai_chat:read",
        "content_studio:read",
        "presentation_studio:read",
    ],
    brand_admin: [
        "brand:read", "brand:write",
        "creators:read", "creators:write",
        "campaign:read", "campaign:write",
        "content:read", "content:write",
        "analytics:read",
        "discovery:read",
        "crm:read", "crm:write",
        "design_studio:read", "design_studio:write",
        "ai_chat:read",
        "content_studio:read", "content_studio:write",
    ],
    brand_member: [
        "brand:read",
        "creators:read",
        "campaign:read",
        "content:read", "content:write",
        "analytics:read",
        "discovery:read",
        "design_studio:read",
        "ai_chat:read",
    ],
    creator: [
        "content:read", "content:write",
        "design_studio:read",
        "ai_chat:read",
    ],
    viewer: [
        "campaign:read",
        "content:read",
        "analytics:read",
        "discovery:read",
        "design_studio:read",
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
    return role === "root" || role === "super_admin";
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
        root: "Root",
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
