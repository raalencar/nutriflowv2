// User Roles
export const ROLES = [
    { value: 'admin', label: 'Admin (Geral)' },
    { value: 'manager', label: 'Gerente' },
    { value: 'operator', label: 'Operacional' },
    { value: 'nutritionist', label: 'Nutricionista' },
    { value: 'chef', label: 'Cozinheiro Chefe' }
];

// Recipe Categories
export const RECIPE_CATEGORIES = [
    "Prato Principal",
    "Acompanhamento",
    "Salada",
    "Sobremesa",
    "Sopa",
    "Entrada"
];

// Product/Ingredient Categories
export const PRODUCT_CATEGORIES = [
    "Grãos",
    "Carnes",
    "Hortifruti",
    "Óleos",
    "Temperos",
    "Laticínios",
    "Bebidas"
];

// Unit Types
export const UNIT_TYPES = [
    { value: 'hub', label: 'Hub (Matriz)' },
    { value: 'spoke', label: 'Spoke (Filial)' }
];

// Measurement Units
export const MEASUREMENT_UNITS = [
    "kg",
    "g",
    "L",
    "mL",
    "unid",
    "porções"
];

// Purchase Types
export const PURCHASE_TYPES = [
    { value: 'central', label: 'Central' },
    { value: 'local', label: 'Local' }
];

// Fallback units if API fails or for static options
export const MOCK_UNITS = [
    { id: '1', name: 'Cozinha Central' },
    { id: '2', name: 'Cozinha Alphaville' },
    { id: '3', name: 'Cozinha Morumbi' }
];
