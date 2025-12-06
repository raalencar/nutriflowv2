import { Hono } from 'hono';
import { db } from '../db';
import { users, teams, teamMembers } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '../middleware/auth';


const userRoutes = new Hono();

// Protect user management - Admin only
userRoutes.use('*', requireRole(['admin']));

userRoutes.get('/', async (c) => {
    try {
        const allUsers = await db.select().from(users);
        const usersWithTeams = await Promise.all(allUsers.map(async (user) => {
            const userTeams = await db.select({
                id: teams.id,
                name: teams.name
            })
                .from(teamMembers)
                .innerJoin(teams, eq(teamMembers.teamId, teams.id))
                .where(eq(teamMembers.userId, user.id));

            return { ...user, teams: userTeams };
        }));
        return c.json(usersWithTeams);
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
