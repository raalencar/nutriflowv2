import { Hono } from 'hono';
import { db } from '../db';
import { users, teams, teamMembers } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '../middleware/auth';


import { hash } from 'bcryptjs';
import { userUnits } from '../db/schema';
import { randomUUID } from 'crypto';

const userRoutes = new Hono();

// Protect user management - Admin only
userRoutes.use('*', requireRole(['admin']));

userRoutes.post('/', async (c) => {
    try {
        const {
            name, email, role, unitId,
            cpf, rg, birthDate, phone, pis,
            addressZip, addressStreet, addressNumber, addressComp, addressDistrict, addressCity, addressState,
            admissionDate, hourlyRate, workSchedule
        } = await c.req.json();

        if (!email || !name || !role) {
            return c.json({ error: 'Missing required fields' }, 400);
        }

        // Check existing
        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing.length > 0) {
            return c.json({ error: 'User already exists' }, 409);
        }

        const hashedPassword = await hash('123456', 10);
        const newUserId = randomUUID();

        // Transaction to create user and link unit
        const result = await db.transaction(async (tx) => {
            const [newUser] = await tx.insert(users).values({
                id: newUserId,
                email,
                name,
                role,
                password: hashedPassword,
                status: 'active',
                // HR Data
                cpf, rg, birthDate, phone, pis,
                addressZip, addressStreet, addressNumber, addressComp, addressDistrict, addressCity, addressState,
                admissionDate, hourlyRate, workSchedule
            }).returning();

            if (unitId) {
                await tx.insert(userUnits).values({
                    userId: newUserId,
                    unitId
                });
            }

            return newUser;
        });

        const { password: _, ...userWithoutPassword } = result;
        return c.json(userWithoutPassword, 201);

    } catch (error) {
        console.error("Create User Error:", error);
        return c.json({ error: 'Failed to create user' }, 500);
    }
});

userRoutes.get('/', async (c) => {
    try {
        const allUsers = await db.select().from(users);
        const usersWithDetails = await Promise.all(allUsers.map(async (user) => {
            // Fetch Teams
            const userTeams = await db.select({
                id: teams.id,
                name: teams.name
            })
                .from(teamMembers)
                .innerJoin(teams, eq(teamMembers.teamId, teams.id))
                .where(eq(teamMembers.userId, user.id));

            // Fetch Direct Units (Legacy/Simple assignment)
            const units = await db.select({
                id: userUnits.unitId
            })
                .from(userUnits)
                .where(eq(userUnits.userId, user.id));

            return {
                ...user,
                teams: userTeams,
                unitId: units.length > 0 ? units[0].id : undefined // Return primary unit if exists
            };
        }));

        // Remove passwords
        const safeUsers = usersWithDetails.map(({ password, ...u }) => u);

        return c.json(safeUsers);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

userRoutes.post('/:id/teams', async (c) => {
    const userId = c.req.param('id');
    const { teamId } = await c.req.json();

    try {
        await db.insert(teamMembers).values({ userId, teamId });
        return c.json({ message: 'Added to team' });
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to add to team' }, 500);
    }
});

userRoutes.delete('/:id/teams', async (c) => {
    const userId = c.req.param('id');
    const { teamId } = await c.req.json();

    try {
        await db.delete(teamMembers)
            .where(and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)));
        return c.json({ message: 'Removed from team' });
    } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to remove from team' }, 500);
    }
});

userRoutes.put('/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();

    // Remove sensitive/immutable fields
    const { id: _, password, createdAt, ...updateData } = body;

    try {
        const result = await db.update(users)
            .set(updateData)
            .where(eq(users.id, id))
            .returning();

        if (result.length === 0) return c.json({ error: 'User not found' }, 404);

        // Handle unit update if provided (simplistic approach for now)
        if (body.unitId) {
            // Check if already linked
            const existingLink = await db.select().from(userUnits)
                .where(and(eq(userUnits.userId, id), eq(userUnits.unitId, body.unitId)))
                .limit(1);

            if (existingLink.length === 0) {
                // Insert new link (allow multiple or replace? Prompt implies "Main Unit". I'll just add for now to ensure access)
                await db.insert(userUnits).values({ userId: id, unitId: body.unitId }).onConflictDoNothing();
            }
        }

        const { password: __, ...userWithoutPassword } = result[0];
        return c.json(userWithoutPassword);
    } catch (error) {
        console.error("Update User Error:", error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

userRoutes.put('/:id/role', async (c) => {
    const id = c.req.param('id');
    const { role } = await c.req.json();

    try {
        const result = await db.update(users)
            .set({ role })
            .where(eq(users.id, id))
            .returning();

        if (result.length === 0) return c.json({ error: 'User not found' }, 404);
        return c.json(result[0]);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

export default userRoutes;
