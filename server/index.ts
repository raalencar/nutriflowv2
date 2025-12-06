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

// Importe getUserAllowedUnits aqui se ele for exportado deste arquivo
import { authMiddleware, requireRole, getUserAllowedUnits } from './middleware/auth';
import adminRoutes from './routes/admin';
import webhookRoutes from './routes/webhook';
import mealOffersRoutes from './routes/meal-offers';
import userRoutes from './routes/users';
import teamRoutes from './routes/teams';
import authRoutes from './routes/auth';

const app = new Hono();

// 1. CORS deve ser a PRIMEIRA coisa
app.use('/*', cors({
    origin: [
        'http://localhost:8080', // Desenvolvimento Local
        'http://localhost:5173', // Vite Padrão
        'https://app.rd7solucoes.com.br', // Seu domínio de Produção
        'https://nutriflowv2-production.up.railway.app' // Próprio domínio (opcional)
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
    credentials: true,
}));

// Global Error Handler
app.onError((err, c) => {
    console.error(`[ERROR] ${err.message}`, err);
    // O middleware de CORS acima já deve tratar os headers, mas em caso de erro fatal
    // garantimos que o cliente receba JSON e não fique pendurado.
    return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

const api = new Hono();

// Apply Auth Middleware to all API routes
app.use('/api/*', authMiddleware);

// Mount Admin & Other Routes
app.route('/api/admin', adminRoutes);
app.route('/api/webhook', webhookRoutes);
app.route('/api/meal-offers', mealOffersRoutes);
app.route('/api/users', userRoutes);
app.route('/api/teams', teamRoutes);
app.route('/api/auth', authRoutes);

// --- ROTAS DE UNIDADES (Mantidas no index por enquanto) ---

api.get('/units', async (c) => {
    try {
        const user = c.get('user' as any) as any;
        const isAdmin = user.role === 'admin';

        let query = db.select().from(units);

        if (!isAdmin) {
            // Agora usando o import do topo
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
        if (error.code === '23503') {
            return c.json({
                error: 'Esta unidade não pode ser excluída pois está sendo utilizada no sistema.'
            }, 409);
        }
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// --- ROTAS DE PRODUTOS (Mantidas no index por enquanto) ---

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