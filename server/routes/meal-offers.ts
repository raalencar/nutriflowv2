import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { mealOffers } from '../db/schema';

const mealOffersRoute = new Hono();

// GET all meal offers
mealOffersRoute.get('/', async (c) => {
    try {
        const allOffers = await db.select().from(mealOffers);
        return c.json(allOffers);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// POST create meal offer
mealOffersRoute.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const result = await db.insert(mealOffers).values(body).returning();
        return c.json(result[0], 201);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// GET meal offer by ID
mealOffersRoute.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const offer = await db.select().from(mealOffers).where(eq(mealOffers.id, id));
        if (offer.length === 0) return c.json({ error: 'Not Found' }, 404);
        return c.json(offer[0]);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// PUT update meal offer
mealOffersRoute.put('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const result = await db.update(mealOffers).set(body).where(eq(mealOffers.id, id)).returning();
        if (result.length === 0) return c.json({ error: 'Not Found' }, 404);
        return c.json(result[0]);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// DELETE meal offer
mealOffersRoute.delete('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const result = await db.delete(mealOffers).where(eq(mealOffers.id, id)).returning();
        if (result.length === 0) return c.json({ error: 'Not Found' }, 404);
        return c.json({ message: 'Deleted' });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

export default mealOffersRoute;
