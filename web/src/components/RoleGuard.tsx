import { useUser } from "@clerk/clerk-react";
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
    const { user, isLoaded } = useUser();

    if (!isLoaded) {
        return null; // Or a spinner
    }

    if (!user) {
        // If inline mode and no user, just hide the content
        if (mode === 'inline') return null;
        return <Navigate to="/sign-in" />;
    }

    const userRoles = (user.publicMetadata.role as string[]) || [];
    const hasAccess = userRoles.some(role => allowedRoles.includes(role)) || userRoles.includes('admin');

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
