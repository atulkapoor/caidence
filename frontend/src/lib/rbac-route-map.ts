export interface RoutePermissionRule {
    prefix: string;
    requireAny: string[];
}

// Centralized route-level RBAC for all dashboard menus.
// Keep prefixes most-specific first.
export const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
    { prefix: "/admin", requireAny: ["admin:read"] },
    { prefix: "/agency", requireAny: ["agency:read"] },
    { prefix: "/ai-agent", requireAny: ["ai_agent:read"] },
    { prefix: "/ai-chat", requireAny: ["ai_chat:read"] },
    { prefix: "/analytics", requireAny: ["analytics:read"] },
    { prefix: "/campaigns", requireAny: ["campaign:read"] },
    { prefix: "/content-studio", requireAny: ["content_studio:read", "content:read"] },
    { prefix: "/creator-portal", requireAny: ["creators:read"] },
    { prefix: "/creators", requireAny: ["creators:read"] },
    { prefix: "/crm", requireAny: ["crm:read"] },
    { prefix: "/design-studio", requireAny: ["design_studio:read"] },
    { prefix: "/discovery", requireAny: ["discovery:read"] },
    { prefix: "/marcom", requireAny: ["marcom:read"] },
    { prefix: "/presentation-studio", requireAny: ["presentation_studio:read"] },
    { prefix: "/workflow", requireAny: ["workflow:read"] },
];

export function getRequiredPermissionsForPath(pathname: string): string[] | null {
    const path = (pathname || "").replace(/\/$/, "") || "/";
    const match = ROUTE_PERMISSION_RULES.find(
        (rule) => path === rule.prefix || path.startsWith(`${rule.prefix}/`)
    );
    return match?.requireAny ?? null;
}
