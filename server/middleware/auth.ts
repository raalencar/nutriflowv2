import { createMiddleware } from 'hono/factory';
import { verifyToken } from '@clerk/backend';
import { db } from '../db';
import { users, userUnits } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

type AuthVariables = {
    auth: {
        userId: string;
        sessionId: string;
        roles: string[];
    };
    user: {
        id: string;
        email: string;
        name: string | null;
        role: string;
    }
};

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    try {
        if (!process.env.CLERK_SECRET_KEY) {
            console.error("CRITICAL: CLERK_SECRET_KEY is missing in environment variables.");
        }
        const authHeader = c.req.header('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return c.json({ error: 'Unauthorized: Missing token' }, 401);
        }

        const token = authHeader.split(' ')[1];

        // Verify token with Clerk
        const verifiedToken = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        });

        const payload = verifiedToken as any;
        const userId = payload.sub;

        // Check if user exists in local DB
        let localUser = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);

        if (!localUser) {
            // Fetch user details from Clerk to populate initial data
            try {
                const clerkUser = await clerkClient.users.getUser(userId);
                const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;

                if (primaryEmail) {
                    const newUser = await db.insert(users).values({
                        id: userId,
                        email: primaryEmail,
                        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
                        role: 'operator', // Default role
                        status: 'active'
                    }).returning();
                    localUser = newUser[0];
                }
            } catch (err) {
                console.error("Error syncing user from Clerk:", err);
            }
        }

        const roles = localUser ? [localUser.role] : [];

        c.set('auth', {
            userId: payload.sub,
            sessionId: payload.sid,
            roles: roles // Use local DB role
        });

        if (localUser) {
            c.set('user', localUser);
        }

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
