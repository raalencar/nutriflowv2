import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { units, products, mealOffers } from './db/schema';
import recipeRoutes from './routes/recipes';
import inventoryRoutes from './routes/inventory';
import productionRoutes from './routes/production';
import purchaseRoutes from './routes/purchases';

import { authMiddleware, requireRole } from './middleware/auth';
import adminRoutes from './routes/admin';
import webhookRoutes from './routes/webhook';
import mealOffersRoutes from './routes/meal-offers';


// ... existing imports ...

const app = new Hono();

app.use('/*', cors({
    origin: 'http://localhost:8080',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'], // Added Authorization
}));

const api = new Hono();

// Apply Auth Middleware to all API routes
app.use('/api/*', authMiddleware);


// Mount Admin Routes
app.route('/api/admin', adminRoutes);
app.route('/api/webhook', webhookRoutes);
app.route('/api/meal-offers', mealOffersRoutes);


// Units
api.get('/units', async (c) => {
    try {
        const allUnits = await db.select().from(units);
        return c.json(allUnits);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

api.post('/units', async (c) => {
    try {
        const body = await c.req.json();
        const result = await db.insert(units).values(body).returning();
        return c.json(result[0], 201);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

api.get('/units/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const unit = await db.select().from(units).where(eq(units.id, id));
        if (unit.length === 0) return c.json({ error: 'Not Found' }, 404);
        return c.json(unit[0]);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

api.put('/units/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const result = await db.update(units).set(body).where(eq(units.id, id)).returning();
        if (result.length === 0) return c.json({ error: 'Not Found' }, 404);
        return c.json(result[0]);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

api.delete('/units/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const result = await db.delete(units).where(eq(units.id, id)).returning();
        if (result.length === 0) return c.json({ error: 'Not Found' }, 404);
        return c.json({ message: 'Deleted' });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// Products
api.get('/products', async (c) => {
    try {
        const allProducts = await db.select().from(products);
        return c.json(allProducts);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

api.post('/products', async (c) => {
    try {
        const body = await c.req.json();
        const result = await db.insert(products).values(body).returning();
        return c.json(result[0], 201);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// Mount Routes
app.route('/api', api);
app.route('/api/recipes', recipeRoutes);
app.route('/api/inventory', inventoryRoutes);
app.route('/api/production', productionRoutes);
app.route('/api/purchases', purchaseRoutes);

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port
});
