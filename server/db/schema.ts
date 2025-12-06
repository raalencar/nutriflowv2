import { pgTable, text, uuid, pgEnum, numeric, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const unitTypeEnum = pgEnum('unit_type', ['hub', 'spoke']);
export const unitStatusEnum = pgEnum('unit_status', ['active', 'inactive']);
export const mealOfferStatusEnum = pgEnum('meal_offer_status', ['active', 'inactive']);

export const mealOffers = pgTable('meal_offers', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    status: mealOfferStatusEnum('status').default('active').notNull(),
});

export const units = pgTable('units', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    address: text('address'),
    fullAddress: text('full_address'),
    phone: text('phone'),
    manager: text('manager'),
    contractNumber: text('contract_number'),
    contractManager: text('contract_manager'),
    mealOffers: text('meal_offers').array(),
    latitude: numeric('latitude'),
    longitude: numeric('longitude'),
    type: unitTypeEnum('type').notNull(),
    status: unitStatusEnum('status').default('active').notNull(),
});

export const userUnits = pgTable('user_units', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(), // Clerk User ID
    unitId: uuid('unit_id').references(() => units.id).notNull(),
}, (t) => ({
    unq: unique().on(t.userId, t.unitId),
}));

export const purchaseTypeEnum = pgEnum('purchase_type', ['central', 'local']);
export const productStatusEnum = pgEnum('product_status', ['active', 'inactive']);

export const products = pgTable('products', {
    id: uuid('id').defaultRandom().primaryKey(),
    sku: text('sku').unique().notNull(),
    name: text('name').notNull(),
    unit: text('unit').notNull(),
    category: text('category'),
    purchaseType: purchaseTypeEnum('purchase_type').notNull(),
    price: numeric('price').notNull(),
    status: productStatusEnum('status').default('active').notNull(),
});

export const recipeStatusEnum = pgEnum('recipe_status', ['active', 'inactive']);

export const recipes = pgTable('recipes', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    category: text('category'),
    yield: numeric('yield').notNull(), // using numeric for yield as it can be decimal
    yieldUnit: text('yield_unit').notNull(),
    prepTime: numeric('prep_time').notNull(), // keeping as numeric (minutes)
    instructions: text('instructions'),
    status: recipeStatusEnum('status').default('active').notNull(),
});

export const recipeIngredients = pgTable('recipe_ingredients', {
    id: uuid('id').defaultRandom().primaryKey(),
    recipeId: uuid('recipe_id').references(() => recipes.id).notNull(),
    productId: uuid('product_id').references(() => products.id).notNull(),
    grossQty: numeric('gross_qty').notNull(),
    netQty: numeric('net_qty').notNull(),
    correctionFactor: numeric('correction_factor').notNull(),
    unit: text('unit').notNull(), // unit used in recipe (e.g. kg, g)
});

export const stockTransactionTypeEnum = pgEnum('stock_transaction_type', ['IN', 'OUT', 'ADJUST']);

export const stocks = pgTable('stocks', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').references(() => products.id).notNull(),
    unitId: uuid('unit_id').references(() => units.id).notNull(),
    quantity: numeric('quantity').notNull().default('0'),
    minStock: numeric('min_stock').default('0'),
    avgCost: numeric('avg_cost').default('0'),
}, (t) => ({
    unq: unique().on(t.productId, t.unitId),
}));

export const inventoryTransactions = pgTable('inventory_transactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').references(() => products.id).notNull(),
    unitId: uuid('unit_id').references(() => units.id).notNull(),
    type: stockTransactionTypeEnum('type').notNull(),
    quantity: numeric('quantity').notNull(),
    cost: numeric('cost').default('0'),
    referenceId: text('reference_id'), // ID of ProductionPlan or PurchaseOrder
    reason: text('reason'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const productionPlanStatusEnum = pgEnum('production_plan_status', ['planned', 'in_progress', 'completed']);

export const productionPlans = pgTable('production_plans', {
    id: uuid('id').defaultRandom().primaryKey(),
    unitId: uuid('unit_id').references(() => units.id).notNull(),
    recipeId: uuid('recipe_id').references(() => recipes.id).notNull(),
    date: text('date').notNull(),
    quantity: numeric('quantity').notNull(),
    status: productionPlanStatusEnum('status').default('planned').notNull(),
});

export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', ['draft', 'ordered', 'received']);

export const purchaseOrders = pgTable('purchase_orders', {
    id: uuid('id').defaultRandom().primaryKey(),
    unitId: uuid('unit_id').references(() => units.id).notNull(),
    supplier: text('supplier').notNull(),
    status: purchaseOrderStatusEnum('status').default('draft').notNull(),
    totalValue: numeric('total_value').default('0'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const purchaseItems = pgTable('purchase_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').references(() => purchaseOrders.id).notNull(),
    productId: uuid('product_id').references(() => products.id).notNull(),
    quantity: numeric('quantity').notNull(),
    cost: numeric('cost').notNull(),
});

export const userStatusEnum = pgEnum('user_status', ['active', 'inactive']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'operator', 'nutritionist', 'chef']);

export const users = pgTable('users', {
    id: text('id').primaryKey(), // Clerk User ID
    email: text('email').notNull().unique(),
    name: text('name'),
    role: userRoleEnum('role').default('operator').notNull(),
    status: userStatusEnum('status').default('active').notNull(),
    password: text('password'), // Hashed password
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const teams = pgTable('teams', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
});

export const teamMembers = pgTable('team_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id').references(() => teams.id).notNull(),
    userId: text('user_id').references(() => users.id).notNull(),
}, (t) => ({
    unq: unique().on(t.teamId, t.userId),
}));

export const teamUnits = pgTable('team_units', {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id').references(() => teams.id).notNull(),
    unitId: uuid('unit_id').references(() => units.id).notNull(),
}, (t) => ({
    unq: unique().on(t.teamId, t.unitId),
}));
