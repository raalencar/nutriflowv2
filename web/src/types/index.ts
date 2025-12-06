export interface Unit {
    id: string;
    name: string;
    type: 'hub' | 'spoke';
    address: string | null;
    fullAddress?: string | null;
    phone: string | null;
    manager: string | null;
    contractNumber?: string | null;
    contractManager?: string | null;
    mealOffers?: string[] | null;
    latitude?: string | null;
    longitude?: string | null;
    status: 'active' | 'inactive';
}

export type CreateUnitDTO = Omit<Unit, 'id' | 'status'>;
export type UpdateUnitDTO = Partial<CreateUnitDTO>;

export interface Product {
    id: string;
    sku: string;
    name: string;
    unit: string;
    category: string | null;
    purchaseType: 'central' | 'local';
    price: string;
    status: 'active' | 'inactive';
}

export type CreateProductDTO = Omit<Product, 'id' | 'status'>;
export type UpdateProductDTO = Partial<CreateProductDTO>;

export interface Ingredient {
    id?: string;
    productId: string;
    name?: string;
    grossQty: number;
    netQty: number;
    unit: string;
    correctionFactor: number;
}

export interface Recipe {
    id: string;
    name: string;
    category: string | null;
    yield: string;
    yieldUnit: string;
    prepTime: string;
    instructions: string | null;
    status: 'active' | 'inactive';
    costPerServing?: number;
    ingredients: Ingredient[];
}

export type CreateRecipeDTO = Omit<Recipe, 'id' | 'status' | 'costPerServing' | 'ingredients'> & { ingredients: Ingredient[] };
export type UpdateRecipeDTO = Partial<CreateRecipeDTO>;

export interface Stock {
    id: string;
    productId: string;
    unitId: string;
    quantity: string;
    productName?: string;
    productUnit?: string;
    minStock?: string;
}

export interface InventoryTransactionDTO {
    productId: string;
    unitId: string;
    type: 'IN' | 'OUT' | 'ADJUST';
    quantity: number;
    reason?: string;
    referenceId?: string;
    cost?: number;
}

export interface InventoryTransaction {
    id: string;
    date: string;
    type: 'IN' | 'OUT' | 'ADJUST';
    productName?: string;
    unitName?: string;
    quantity: string;
    unit?: string;
    cost?: string;
    reason?: string;
}

export interface ProductionPlan {
    id: string;
    unitId: string;
    recipeId: string;
    date: string;
    quantity: string;
    status: 'planned' | 'in_progress' | 'completed';
}

export interface CreateProductionPlanDTO {
    unitId: string;
    recipeId: string;
    date: string;
    quantity: number;
}

export interface PurchaseItem {
    id?: string;
    productId: string;
    quantity: number;
    cost: number;
}

export interface PurchaseOrder {
    id: string;
    unitId: string;
    supplier: string;
    status: 'draft' | 'ordered' | 'received';
    totalValue?: string;
    items?: PurchaseItem[];
    createdAt?: string;
}

export interface CreatePurchaseOrderDTO {
    unitId: string;
    supplier: string;
    items: PurchaseItem[];
}

// User & Access
export interface UserUnit {
    id: string;
    userId: string;
    unitId: string;
}

export interface User {
    id: string;
    imageUrl?: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    primaryEmailAddress?: { emailAddress: string } | null;
    publicMetadata: {
        role?: string[];
    };
}

// Meal Offers
export interface MealOffer {
    id: string;
    name: string;
    description?: string | null;
    status: 'active' | 'inactive';
}

export type CreateMealOfferDTO = Omit<MealOffer, 'id' | 'status'>;
export type UpdateMealOfferDTO = Partial<CreateMealOfferDTO>;
