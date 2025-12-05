import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from './db';
import { units, products } from './db/schema';
import recipeRoutes from './routes/recipes';
import inventoryRoutes from './routes/inventory';
import productionRoutes from './routes/production';
import purchaseRoutes from './routes/purchases';

const app = new Hono();

app.use('/*', cors({
    origin: 'http://localhost:8080',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

const api = new Hono();

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
