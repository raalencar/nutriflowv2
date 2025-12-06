import { Hono } from 'hono';
import { db } from '../db';
import { teams, teamMembers, teamUnits, users, units } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '../middleware/auth';

const teamRoutes = new Hono();

// Only admin can manage teams
teamRoutes.use('*', requireRole(['admin']));

teamRoutes.get('/', async (c) => {
    try {
        // Fetch all teams
        const allTeams = await db.select().from(teams);

        // Fetch details for each team
        // In a larger system, we might want to optimize this or load on demand
        const teamsWithDetails = await Promise.all(allTeams.map(async (team) => {
            const members = await db.select({
                id: users.id,
                name: users.name,
                email: users.email
            })
                .from(teamMembers)
                .innerJoin(users, eq(teamMembers.userId, users.id))
                .where(eq(teamMembers.teamId, team.id));

            const teamUnitsList = await db.select({
                id: units.id,
                name: units.name
            })
                .from(teamUnits)
                .innerJoin(units, eq(teamUnits.unitId, units.id))
                .where(eq(teamUnits.teamId, team.id));

            return { ...team, members, units: teamUnitsList };
        }));

        return c.json(teamsWithDetails);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

teamRoutes.post('/', async (c) => {
    try {
        const { name, description, unitIds, memberIds } = await c.req.json();

        return await db.transaction(async (tx) => {
            const [newTeam] = await tx.insert(teams).values({ name, description }).returning();

            if (unitIds && unitIds.length > 0) {
                await tx.insert(teamUnits).values(
                    unitIds.map((uid: string) => ({ teamId: newTeam.id, unitId: uid }))
                );
            }

            if (memberIds && memberIds.length > 0) {
                await tx.insert(teamMembers).values(
                    memberIds.map((uid: string) => ({ teamId: newTeam.id, userId: uid }))
                );
            }

            return c.json(newTeam, 201);
        });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

teamRoutes.put('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const { name, description, unitIds, memberIds } = await c.req.json();

        return await db.transaction(async (tx) => {
            const [updatedTeam] = await tx.update(teams)
                .set({ name, description })
                .where(eq(teams.id, id))
                .returning();

            if (!updatedTeam) return c.json({ error: 'Team not found' }, 404);

            // Update units
            await tx.delete(teamUnits).where(eq(teamUnits.teamId, id));
            if (unitIds && unitIds.length > 0) {
                await tx.insert(teamUnits).values(
                    unitIds.map((uid: string) => ({ teamId: id, unitId: uid }))
                );
            }

            // Update members
            await tx.delete(teamMembers).where(eq(teamMembers.teamId, id));
            if (memberIds && memberIds.length > 0) {
                await tx.insert(teamMembers).values(
                    memberIds.map((uid: string) => ({ teamId: id, userId: uid }))
                );
            }

            return c.json(updatedTeam);
        });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

teamRoutes.delete('/:id', async (c) => {
    try {
        const id = c.req.param('id');

        return await db.transaction(async (tx) => {
            await tx.delete(teamUnits).where(eq(teamUnits.teamId, id));
            await tx.delete(teamMembers).where(eq(teamMembers.teamId, id));
            const [deleted] = await tx.delete(teams).where(eq(teams.id, id)).returning();

            if (!deleted) return c.json({ error: 'Team not found' }, 404);
            return c.json({ message: 'Team deleted' });
        });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

export default teamRoutes;
