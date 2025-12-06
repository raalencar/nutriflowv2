import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: string[];
    redirectTo?: string;
    showForbidden?: boolean;
    mode?: 'route' | 'inline'; // 'route' for page protection, 'inline' for button/component hiding
}

export function RoleGuard({
    children,
    allowedRoles,
    redirectTo,
    showForbidden = false,
    mode = 'route'
}: RoleGuardProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return null; // Or a spinner
    }

    if (!user) {
        // If inline mode and no user, just hide the content
        if (mode === 'inline') return null;
        return <Navigate to="/login" />;
    }

    const userRole = user.role;
    const hasAccess = allowedRoles.includes(userRole) || userRole === 'admin';

    if (!hasAccess) {
        // Inline mode: simply hide children when no access
        if (mode === 'inline') return null;

        // Route mode: redirect or show forbidden page
        if (showForbidden) {
            if (redirectTo) return <Navigate to={redirectTo} />;
            return <Navigate to="/forbidden" />;
        }
        return null; // Just hide content
    }

    return <>{children}</>;
}
