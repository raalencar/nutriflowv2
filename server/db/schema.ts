import { pgTable, text, uuid, pgEnum, numeric } from 'drizzle-orm/pg-core';

export const unitTypeEnum = pgEnum('unit_type', ['hub', 'spoke']);
export const unitStatusEnum = pgEnum('unit_status', ['active', 'inactive']);

export const units = pgTable('units', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    address: text('address'),
    phone: text('phone'),
    manager: text('manager'),
    type: unitTypeEnum('type').notNull(),
    status: unitStatusEnum('status').default('active').notNull(),
});

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
