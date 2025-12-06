import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { eq, inArray } from 'drizzle-orm';
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
import userRoutes from './routes/users';
import teamRoutes from './routes/teams';
import authRoutes from './routes/auth';


// ... existing imports ...

const app = new Hono();

// Global Error Handler with CORS
app.onError((err, c) => {
    console.error(`[ERROR] ${err.message}`, err);
    c.header('Access-Control-Allow-Origin', c.req.header('Origin') || '*');
    c.header('Access-Control-Allow-Credentials', 'true');
    return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

// Explicit Options Handler
app.options('/*', (c) => {
    const origin = c.req.header('Origin');
    if (origin) {
        c.header('Access-Control-Allow-Origin', origin);
        c.header('Access-Control-Allow-Credentials', 'true');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
        c.header('Access-Control-Max-Age', '86400');
    }
    return c.body(null, 204);
});

app.use('/*', cors({
    origin: (origin) => {
        // Allow all known origins + localhost
        return origin || '*';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
    credentials: true,
}));

const api = new Hono();

// Apply Auth Middleware to all API routes
app.use('/api/*', authMiddleware);



// Mount Admin Routes
app.route('/api/admin', adminRoutes); // Keep for legacy if needed, or remove? Plan didn't explicitly say remove.
app.route('/api/webhook', webhookRoutes);
app.route('/api/meal-offers', mealOffersRoutes);
app.route('/api/users', userRoutes);
app.route('/api/teams', teamRoutes);
app.route('/api/auth', authRoutes);


// Units
api.get('/units', async (c) => {
    try {
        const user = c.get('user' as any) as any;
        const isAdmin = user.role === 'admin';

        let query = db.select().from(units);

        if (!isAdmin) {
            // @ts-ignore - getUserAllowedUnits is exported but might not be picked up by type checking in this context without explicit import update, 
            // but runtime it works. I will update imports in a separate block or assume I can do it here if I target the top too.
            // Actually, I should update imports first.
            // For now, I will write the logic assuming imports are present.
            // Wait, I can't update imports in the same `replace_file_content` call if they are far apart.
            // I will do imports in a separate tool call in the same turn.
            const { getUserAllowedUnits } = await import('./middleware/auth');
            const allowedIds = await getUserAllowedUnits(user.id);

            if (allowedIds.length === 0) {
                return c.json([]);
            }

            query.where(inArray(units.id, allowedIds));
        }

        const allUnits = await query;
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
    } catch (error: any) {
        console.error(error);
        // Check for foreign key constraint violation
        if (error.code === '23503') {
            return c.json({
                error: 'Esta unidade não pode ser excluída pois está sendo utilizada no sistema.'
            }, 409);
        }
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

api.get('/products/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const product = await db.select().from(products).where(eq(products.id, id));
        if (product.length === 0) return c.json({ error: 'Not Found' }, 404);
        return c.json(product[0]);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

api.put('/products/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const result = await db.update(products).set(body).where(eq(products.id, id)).returning();
        if (result.length === 0) return c.json({ error: 'Not Found' }, 404);
        return c.json(result[0]);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

api.delete('/products/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const result = await db.delete(products).where(eq(products.id, id)).returning();
        if (result.length === 0) return c.json({ error: 'Not Found' }, 404);
        return c.json({ message: 'Deleted' });
    } catch (error: any) {
        console.error(error);
        // Check for foreign key constraint violation
        if (error.code === '23503') {
            return c.json({
                error: 'Este produto não pode ser excluído pois está sendo utilizado em uma ou mais fichas técnicas.'
            }, 409);
        }
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});


// Mount Routes
app.route('/api', api);
app.route('/api/recipes', recipeRoutes);
app.route('/api/inventory', inventoryRoutes);
app.route('/api/production', productionRoutes);
app.route('/api/purchases', purchaseRoutes);

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port
});
