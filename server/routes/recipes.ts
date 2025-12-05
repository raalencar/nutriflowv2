import { Hono } from 'hono';
import { db } from '../db';
import { recipes, recipeIngredients, products } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

const api = new Hono();

// GET /recipes
api.get('/', async (c) => {
    try {
        const allRecipes = await db.select().from(recipes);

        // For each recipe, fetch ingredients and calculate cost
        // This could be optimized with a complex join query, but loop is simpler for logic clarity for now
        // and given we need to sum(product.price * recipeIngredient.grossQty)

        const detailedRecipes = await Promise.all(allRecipes.map(async (recipe) => {
            const ingredients = await db
                .select({
                    id: recipeIngredients.id,
                    productId: recipeIngredients.productId,
                    name: products.name,
                    grossQty: recipeIngredients.grossQty,
                    netQty: recipeIngredients.netQty,
                    unit: recipeIngredients.unit, // unit from recipe details
                    correctionFactor: recipeIngredients.correctionFactor,
                    productPrice: products.price,
                    productUnit: products.unit // unit from product base
                })
                .from(recipeIngredients)
                .leftJoin(products, eq(recipeIngredients.productId, products.id))
                .where(eq(recipeIngredients.recipeId, recipe.id));

            const costPerServing = ingredients.reduce((acc, ing) => {
                // Simple cost calc: price * grossQty
                // Note: Assuming unit conversion is handled or units match. 
                // Real ERPs have unit conversion tables. For simplicty we assume matching units for now
                // or that price is "per base unit" and grossQty is in that same unit.
                const price = parseFloat(ing.productPrice || '0');
                const qty = parseFloat(ing.grossQty || '0');
                return acc + (price * qty);
            }, 0) / parseFloat(recipe.yield || '1'); // Cost is total / yield? Or per recipe?
            // Requirement says "costPerServing". So Total Cost / Yield.

            return {
                ...recipe,
                ingredients,
                costPerServing
            };
        }));

        return c.json(detailedRecipes);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

// POST /recipes
api.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const { ingredients, ...recipeData } = body;

        // Transaction
        const result = await db.transaction(async (tx) => {
            // 1. Create Recipe
            const [newRecipe] = await tx.insert(recipes).values(recipeData).returning();

            // 2. Create Ingredients
            if (ingredients && ingredients.length > 0) {
                const ingredientsWithId = ingredients.map((ing: any) => ({
                    ...ing,
                    recipeId: newRecipe.id,
                    // Ensure numeric fields are strings for Drizzle
                    grossQty: ing.grossQty.toString(),
                    netQty: ing.netQty.toString(),
                    correctionFactor: ing.correctionFactor.toString()
                }));
                await tx.insert(recipeIngredients).values(ingredientsWithId);
            }

            return newRecipe;
        });

        // Fetch full object to return
        return c.json({ ...result, message: 'Recipe created successfully' }, 201);

    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to create recipe' }, 500);
    }
});

// PUT /recipes/:id
api.put('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const body = await c.req.json();
        const { ingredients, ...recipeData } = body;

        await db.transaction(async (tx) => {
            // 1. Update Recipe
            await tx.update(recipes).set(recipeData).where(eq(recipes.id, id));

            // 2. Sync Ingredients (Delete all and recreate - simplest for now)
            await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));

            if (ingredients && ingredients.length > 0) {
                const ingredientsWithId = ingredients.map((ing: any) => ({
                    ...ing,
                    recipeId: id, // use existing ID
                    grossQty: ing.grossQty.toString(),
                    netQty: ing.netQty.toString(),
                    correctionFactor: ing.correctionFactor.toString()
                }));
                await tx.insert(recipeIngredients).values(ingredientsWithId);
            }
        });

        return c.json({ message: 'Recipe updated successfully' });

    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to update recipe' }, 500);
    }
});

// DELETE /recipes/:id
api.delete('/:id', async (c) => {
    const id = c.req.param('id');
    try {
        await db.transaction(async (tx) => {
            // Delete ingredients first (FK constraint)
            await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
            // Delete recipe
            await tx.delete(recipes).where(eq(recipes.id, id));
        });
        return c.json({ message: 'Recipe deleted' });
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to delete recipe' }, 500);
    }
});


export default api;
