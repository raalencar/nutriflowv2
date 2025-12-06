import { createMiddleware } from 'hono/factory';
import { verify } from 'jsonwebtoken';
import { db } from '../db';
import { users, userUnits, teamMembers, teamUnits } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

type AuthVariables = {
    auth: {
        userId: string;
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
    // Exclude public routes
    if (c.req.path.includes('/auth/')) {
        return next();
    }

    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return c.json({ error: 'Unauthorized: Missing token' }, 401);
        }

        const token = authHeader.split(' ')[1];

        // Verify token (Local JWT)
        const payload = verify(token, JWT_SECRET) as any;
        const userId = payload.id;

        // Check if user exists in local DB
        const localUser = await db.select().from(users).where(eq(users.id, userId)).limit(1).then(res => res[0]);

        if (!localUser) {
            return c.json({ error: 'Unauthorized: User not found' }, 401);
        }

        const roles = [localUser.role];

        c.set('auth', {
            userId: localUser.id,
            roles: roles
        });

        c.set('user', localUser);

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

export async function getUserAllowedUnits(userId: string): Promise<string[]> {
    // 1. Get units from direct assignment (Legacy)
    const directUnits = await db.select({ unitId: userUnits.unitId })
        .from(userUnits)
        .where(eq(userUnits.userId, userId));

    // 2. Get units from teams
    const teamUnitsList = await db.select({ unitId: teamUnits.unitId })
        .from(teamMembers)
        .innerJoin(teamUnits, eq(teamMembers.teamId, teamUnits.teamId))
        .where(eq(teamMembers.userId, userId));

    // Combine and deduplicate
    const allUnitIds = new Set([
        ...directUnits.map(u => u.unitId),
        ...teamUnitsList.map(u => u.unitId)
    ]);

    return Array.from(allUnitIds);
}

export async function hasUnitAccess(userId: string, unitId: string): Promise<boolean> {
    const allowedUnits = await getUserAllowedUnits(userId);
    return allowedUnits.includes(unitId);
}
