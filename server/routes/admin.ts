import { Hono } from 'hono';
import { db } from '../db';
import { userUnits } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '../middleware/auth';
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const admin = new Hono();

// Protect all admin routes
// admin.use('*', requireRole(['admin'])); 
// Commented out for now to allow testing without role setup, 
// BUT per plan we should protect it. Let's protect it.
// If I can't easily get a token with 'admin' role during manual verification, I'll have to momentarily disable it or mock it.
// For production code, it MUST be there.
admin.use('*', requireRole(['admin']));

// List users and their units (simplified - normally fetching users from Clerk + local units)
// Since we don't have Clerk Secret Key setup confirmed for fetching users list vs Clerk API,
// We will just list users who HAVE units assigned or implement a way to "register" them in our query.
// Realistically, to list ALL users, we need Clerk API.
// For now, I'll return a placeholder or just the local assignments.
// Let's implement storing a sync'd user list or just fetching from Clerk if env var is present.
// Given constraints, I'll implement "Manage Access" based on email lookup? 
// No, the frontend "Invite" flow usually handles user creation.
// Let's assume the frontend passes the Clerk User ID for now.
// I will create endpoints to just manage the `user_units` table.

admin.post('/user-units', async (c) => {
    try {
        const { userId, unitId } = await c.req.json();

        if (!userId || !unitId) {
            return c.json({ error: 'Missing userId or unitId' }, 400);
        }

        // Check if already exists
        const existing = await db.select().from(userUnits)
            .where(and(eq(userUnits.userId, userId), eq(userUnits.unitId, unitId)))
            .limit(1);

        if (existing.length > 0) {
            return c.json({ message: 'Access already granted' });
        }

        await db.insert(userUnits).values({ userId, unitId });
        return c.json({ message: 'Access granted' });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

admin.delete('/user-units', async (c) => {
    try {
        const { userId, unitId } = await c.req.json();
        if (!userId || !unitId) {
            return c.json({ error: 'Missing userId or unitId' }, 400);
        }

        await db.delete(userUnits)
            .where(and(eq(userUnits.userId, userId), eq(userUnits.unitId, unitId)));

        return c.json({ message: 'Access revoked' });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// Get units for a specific user (admin view)
admin.get('/users/:userId/units', async (c) => {
    const userId = c.req.param('userId');
    try {
        const units = await db.select().from(userUnits).where(eq(userUnits.userId, userId));
        return c.json(units);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// List all users (Mocked or simple implementation)
// In a real app with Clerk, we would use clerkClient.users.getUserList()
admin.get('/users', async (c) => {
    try {
        const response = await clerkClient.users.getUserList({ limit: 100 });
        // Map users to include primaryEmailAddress for frontend compatibility
        const users = response.data.map(user => {
            const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
            return {
                ...user,
                primaryEmailAddress: primaryEmail
            };
        });
        return c.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return c.json({ error: 'Failed to fetch users' }, 500);
    }
});

// Update user role
admin.put('/users/:userId/role', async (c) => {
    const userId = c.req.param('userId');
    const { role } = await c.req.json();

    try {
        await clerkClient.users.updateUser(userId, {
            publicMetadata: {
                role: role // Clerk expects an object for metadata updates
            }
        });
        return c.json({ success: true });
    } catch (error) {
        console.error('Error updating user role:', error);
        return c.json({ error: 'Failed to update role' }, 500);
    }
});

export default admin;
