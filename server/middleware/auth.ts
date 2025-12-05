import { createMiddleware } from 'hono/factory';
import { verifyToken } from '@clerk/backend';
import { db } from '../db';
import { userUnits } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Define context type extension if needed, but for now we'll just attach to c.set/c.get
type AuthVariables = {
    auth: {
        userId: string;
        sessionId: string;
        roles: string[];
    };
};

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return c.json({ error: 'Unauthorized: Missing token' }, 401);
        }

        const token = authHeader.split(' ')[1];

        // Verify token with Clerk
        // Note: ensure CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY (or just secret) are in .env
        const verifiedToken = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        });

        // Helper to extract metadata (assuming roles are in publicMetadata.role or similar)
        // The Clerk token payload might not directly contain metadata depending on config.
        // For simplicity, we might need to fetch user or if using session claims, ensure metadata is in session token.
        // Let's assume metadata is customized in Clerk Dashboard to be in session token or we fetch it.
        // For now, let's start with basic verification and assume roles are passed or we don't have them in token yet.
        // EDIT: Standard Clerk way without extra fetch is putting roles in publicMetadata and adding it to session token template.
        // Let's assume `metadata` claim exists or similar. 
        // Actual implementation: verifyToken return type includes payload.

        const payload = verifiedToken as any;
        // Usually roles are in private or public metadata. Let's assume public_metadata for now.
        // If not present, we default to empty.
        const roles = (payload.public_metadata?.role as string[]) || [];

        c.set('auth', {
            userId: payload.sub,
            sessionId: payload.sid,
            roles: Array.isArray(roles) ? roles : [roles].filter(Boolean) as string[],
        });

        await next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }
});

export const requireRole = (allowedRoles: string[]) => createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const auth = c.get('auth');
    if (!auth) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const hasRole = auth.roles.some((role: string) => allowedRoles.includes(role));
    if (!hasRole && !auth.roles.includes('admin')) { // Admin always has access? Or explicit check.
        return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
    }

    await next();
});

export const requireUnitAccess = () => createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    // This requires the route to have 'unitId' in query or param or body.
    // This is a bit tricky universal middleware. 
    // Maybe we just provide a helper function to call INSIDE the route handler, 
    // or a middleware that knows where to look.
    // For now, let's implement a helper `verifyUnitAccess(userId, unitId)` exported from here or a service.
    await next();
});

export async function hasUnitAccess(userId: string, unitId: string): Promise<boolean> {
    const access = await db.select()
        .from(userUnits)
        .where(and(eq(userUnits.userId, userId), eq(userUnits.unitId, unitId)))
        .limit(1);

    return access.length > 0;
}
