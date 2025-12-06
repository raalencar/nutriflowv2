export * from '../types';
import {
    Unit, CreateUnitDTO, UpdateUnitDTO,
    Product, CreateProductDTO, UpdateProductDTO,
    Recipe, CreateRecipeDTO, UpdateRecipeDTO,
    Stock, InventoryTransactionDTO, InventoryTransaction,
    ProductionPlan, CreateProductionPlanDTO,
    PurchaseOrder, CreatePurchaseOrderDTO,
    User, UserUnit,
    MealOffer, CreateMealOfferDTO, UpdateMealOfferDTO,
    Team, CreateTeamDTO, UpdateTeamDTO
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
    authToken = token;
}

// Helper for requests
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers || {});
    headers.set('Content-Type', 'application/json');
    if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
    } else {
        console.warn('Making request without AuthToken to', endpoint);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized');
        if (response.status === 403) throw new Error('Forbidden');

        // Try to parse error message from response body
        try {
            const errorData = await response.json();
            const errorMessage = errorData.error || errorData.message || response.statusText;
            throw new Error(errorMessage);
        } catch (e) {
            if (e instanceof Error && e.message !== response.statusText) {
                throw e; // Re-throw if we successfully parsed an error
            }
            throw new Error(`API Request failed: ${response.statusText}`);
        }
    }

    // Handle empty response for DELETE or void
    if (response.status === 204) return {} as T;

    // Try parse JSON, else return null/text
    try {
        const text = await response.text();
        return text ? JSON.parse(text) : {} as T;
    } catch {
        return {} as T;
    }
}

// Units
export async function getUnits(): Promise<Unit[]> {
    return request<Unit[]>('/units');
}

export async function createUnit(data: CreateUnitDTO): Promise<Unit> {
    return request<Unit>('/units', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateUnit(id: string, data: UpdateUnitDTO): Promise<Unit> {
    return request<Unit>(`/units/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteUnit(id: string): Promise<void> {
    return request<void>(`/units/${id}`, {
        method: 'DELETE',
    });
}

// Products
export async function getProducts(): Promise<Product[]> {
    return request<Product[]>('/products');
}

export async function createProduct(data: CreateProductDTO): Promise<Product> {
    return request<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateProduct(id: string, data: UpdateProductDTO): Promise<Product> {
    return request<Product>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteProduct(id: string): Promise<void> {
    return request<void>(`/products/${id}`, {
        method: 'DELETE',
    });
}

// Recipes
export async function getRecipes(): Promise<Recipe[]> {
    return request<Recipe[]>('/recipes');
}

export async function createRecipe(data: CreateRecipeDTO): Promise<Recipe> {
    return request<Recipe>('/recipes', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateRecipe(id: string, data: UpdateRecipeDTO): Promise<Recipe> {
    return request<Recipe>(`/recipes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteRecipe(id: string): Promise<void> {
    return request<void>(`/recipes/${id}`, {
        method: 'DELETE',
    });
}

// Inventory
export async function getStocks(unitId?: string): Promise<Stock[]> {
    const url = unitId ? `/inventory/stocks?unitId=${unitId}` : '/inventory/stocks';
    return request<Stock[]>(url);
}

export async function createMovement(data: InventoryTransactionDTO): Promise<any> {
    return request('/inventory/movement', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getInventoryTransactions(unitId?: string): Promise<InventoryTransaction[]> {
    const url = unitId ? `/inventory/transactions?unitId=${unitId}` : '/inventory/transactions';
    return request<InventoryTransaction[]>(url);
}

// Production
export async function getProductionPlans(unitId?: string): Promise<ProductionPlan[]> {
    const url = unitId ? `/production?unitId=${unitId}` : '/production';
    return request<ProductionPlan[]>(url);
}

export async function createProductionPlan(data: CreateProductionPlanDTO): Promise<ProductionPlan> {
    return request<ProductionPlan>('/production', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function completeProductionPlan(id: string): Promise<void> {
    return request<void>(`/production/${id}/complete`, {
        method: 'POST',
    });
}

export async function deleteProductionPlan(id: string): Promise<void> {
    return request<void>(`/production/${id}`, {
        method: 'DELETE',
    });
}

// Purchases
export async function getPurchaseOrders(unitId?: string): Promise<PurchaseOrder[]> {
    const url = unitId ? `/purchases?unitId=${unitId}` : '/purchases';
    return request<PurchaseOrder[]>(url);
}

export async function createPurchaseOrder(data: CreatePurchaseOrderDTO): Promise<PurchaseOrder> {
    return request<PurchaseOrder>('/purchases', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function receivePurchaseOrder(id: string): Promise<void> {
    return request<void>(`/purchases/${id}/receive`, {
        method: 'POST',
    });
}

// Admin / Users
export async function getUsers(): Promise<User[]> {
    return request<User[]>('/users');
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
    return request<void>(`/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
    });
}

export async function addUserTeam(userId: string, teamId: string): Promise<void> {
    return request<void>(`/users/${userId}/teams`, {
        method: 'POST',
        body: JSON.stringify({ teamId }),
    });
}

export async function removeUserTeam(userId: string, teamId: string): Promise<void> {
    return request<void>(`/users/${userId}/teams`, {
        method: 'DELETE',
        body: JSON.stringify({ teamId }),
    });
}

// Teams
export async function getTeams(): Promise<Team[]> {
    return request<Team[]>('/teams');
}

export async function createTeam(data: CreateTeamDTO): Promise<Team> {
    return request<Team>('/teams', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateTeam(id: string, data: UpdateTeamDTO): Promise<Team> {
    return request<Team>(`/teams/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteTeam(id: string): Promise<void> {
    return request<void>(`/teams/${id}`, {
        method: 'DELETE',
    });
}

/* Legacy Unit Assignment - Deprecated by Teams? 
   Keeping specifically if needed for direct assignment or for reference until refactor is complete.
   But Plan suggests Teams is the way. I'll keep them but might not use them.
*/
export async function getUserUnits(userId: string): Promise<UserUnit[]> {
    return request<UserUnit[]>(`/admin/users/${userId}/units`);
}

export async function addUserUnit(userId: string, unitId: string): Promise<void> {
    return request<void>('/admin/user-units', {
        method: 'POST',
        body: JSON.stringify({ userId, unitId }),
    });
}

export async function removeUserUnit(userId: string, unitId: string): Promise<void> {
    return request<void>('/admin/user-units', {
        method: 'DELETE',
        body: JSON.stringify({ userId, unitId }),
    });
}

// Meal Offers
export async function getMealOffers(): Promise<MealOffer[]> {
    return request<MealOffer[]>('/meal-offers');
}

export async function createMealOffer(data: CreateMealOfferDTO): Promise<MealOffer> {
    return request<MealOffer>('/meal-offers', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateMealOffer(id: string, data: UpdateMealOfferDTO): Promise<MealOffer> {
    return request<MealOffer>(`/meal-offers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteMealOffer(id: string): Promise<void> {
    return request<void>(`/meal-offers/${id}`, {
        method: 'DELETE',
    });
}
