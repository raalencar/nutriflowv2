import { Hono } from 'hono';
import { db } from '../db';
import { purchaseOrders, purchaseItems, stocks, inventoryTransactions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const api = new Hono();

// GET /purchases
api.get('/', async (c) => {
    const unitId = c.req.query('unitId');
    let query = db.select().from(purchaseOrders);
    if (unitId) {
        query.where(eq(purchaseOrders.unitId, unitId));
    }
    const result = await query;
    return c.json(result);
});

// POST /purchases
api.post('/', async (c) => {
    try {
        const { items, ...orderData } = await c.req.json();

        const result = await db.transaction(async (tx) => {
            const [order] = await tx.insert(purchaseOrders).values(orderData).returning();

            if (items && items.length > 0) {
                const itemsWithId = items.map((item: any) => ({
                    ...item,
                    orderId: order.id,
                    quantity: item.quantity.toString(),
                    cost: item.cost.toString()
                }));
                await tx.insert(purchaseItems).values(itemsWithId);
            }
            return order;
        });

        return c.json(result, 201);
    } catch (error) {
        return c.json({ error: 'Failed to create order' }, 500);
    }
});

// POST /purchases/:id/receive
api.post('/:id/receive', async (c) => {
    const id = c.req.param('id');
    try {
        await db.transaction(async (tx) => {
            const [order] = await tx.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
            if (!order) throw new Error('Order not found');
            if (order.status === 'received') throw new Error('Order already received');

            const items = await tx.select().from(purchaseItems).where(eq(purchaseItems.orderId, id));

            for (const item of items) {
                const qty = parseFloat(item.quantity);

                // Add to Stock
                const [stock] = await tx.select().from(stocks).where(
                    and(eq(stocks.productId, item.productId), eq(stocks.unitId, order.unitId))
                );

                if (stock) {
                    const currentQty = parseFloat(stock.quantity || '0');
                    await tx.update(stocks)
                        .set({ quantity: (currentQty + qty).toString() })
                        .where(eq(stocks.id, stock.id));
                } else {
                    await tx.insert(stocks).values({
                        productId: item.productId,
                        unitId: order.unitId,
                        quantity: qty.toString(),
                    });
                }

                // Record Transaction
                await tx.insert(inventoryTransactions).values({
                    productId: item.productId,
                    unitId: order.unitId,
                    type: 'IN',
                    quantity: qty.toString(),
                    reason: 'Purchase Order',
                    referenceId: order.id,
                    cost: item.cost,
                });
            }

            // Update Order Status
            await tx.update(purchaseOrders)
                .set({ status: 'received' })
                .where(eq(purchaseOrders.id, id));
        });

        return c.json({ message: 'Order received successfully' });
    } catch (error: any) {
        console.error(error);
        return c.json({ error: error.message }, 400);
    }
});

export default api;
