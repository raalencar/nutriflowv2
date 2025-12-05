import { Hono } from 'hono';
import { db } from '../db';
import { productionPlans, recipes, recipeIngredients, stocks, inventoryTransactions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const api = new Hono();

// GET /production/plans
api.get('/', async (c) => {
    try {
        const unitId = c.req.query('unitId');
        let query = db.select().from(productionPlans);
        if (unitId) {
            query.where(eq(productionPlans.unitId, unitId));
        }
        const result = await query;
        return c.json(result);
    } catch (error) {
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// POST /production
api.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const result = await db.insert(productionPlans).values(body).returning();
        return c.json(result[0], 201);
    } catch (error) {
        return c.json({ error: 'Failed to create plan' }, 500);
    }
});

// POST /production/:id/complete
api.post('/:id/complete', async (c) => {
    const id = c.req.param('id');
    try {
        await db.transaction(async (tx) => {
            // 1. Get Plan
            const [plan] = await tx.select().from(productionPlans).where(eq(productionPlans.id, id));
            if (!plan) throw new Error('Plan not found');
            if (plan.status === 'completed') throw new Error('Plan already completed');

            const planQty = parseFloat(plan.quantity);

            // 2. Get Recipe Ingredients
            const ingredients = await tx.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, plan.recipeId));

            // 3. Process Ingredients Deductions
            for (const ing of ingredients) {
                const requiredGross = parseFloat(ing.grossQty) * planQty;

                // Deduct from Stock
                const [stock] = await tx.select().from(stocks).where(
                    and(eq(stocks.productId, ing.productId), eq(stocks.unitId, plan.unitId))
                );

                const currentQty = stock ? parseFloat(stock.quantity || '0') : 0;

                if (currentQty < requiredGross) {
                    // Get product name for better error
                    throw new Error(`Insufficient stock for ingredient (Product ID: ${ing.productId}). Required: ${requiredGross}, Available: ${currentQty}`);
                }

                if (stock) {
                    await tx.update(stocks)
                        .set({ quantity: (currentQty - requiredGross).toString() })
                        .where(eq(stocks.id, stock.id));
                }

                // Record Transaction
                await tx.insert(inventoryTransactions).values({
                    productId: ing.productId,
                    unitId: plan.unitId,
                    type: 'OUT',
                    quantity: requiredGross.toString(),
                    reason: 'Production',
                    referenceId: plan.id,
                });
            }

            // 4. Update Plan Status
            await tx.update(productionPlans)
                .set({ status: 'completed' })
                .where(eq(productionPlans.id, id));
        });

        return c.json({ message: 'Production completed successfully' });

    } catch (error: any) {
        console.error(error);
        return c.json({ error: error.message || 'Failed to complete production' }, 400);
    }
});

// DELETE /production/:id
api.delete('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        // Check if plan exists and is not completed
        const [plan] = await db.select().from(productionPlans).where(eq(productionPlans.id, id));

        if (!plan) {
            return c.json({ error: 'Plano de produção não encontrado' }, 404);
        }

        if (plan.status === 'completed') {
            return c.json({ error: 'Não é possível excluir planos já finalizados' }, 400);
        }

        // Delete the plan
        await db.delete(productionPlans).where(eq(productionPlans.id, id));

        return c.json({ message: 'Plano excluído com sucesso' }, 200);
    } catch (error: any) {
        console.error(error);
        return c.json({ error: error.message || 'Erro ao excluir plano' }, 500);
    }
});

export default api;
