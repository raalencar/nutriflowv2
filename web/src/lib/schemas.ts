import { z } from "zod";

export const unitSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    type: z.enum(["hub", "spoke"], {
        required_error: "Selecione o tipo de unidade",
    }),
    address: z.string().optional(),
    fullAddress: z.string().optional(),
    phone: z.string().optional(),
    manager: z.string().optional(),
    contractNumber: z.string().optional(),
    contractManager: z.string().optional(),
    mealOffers: z.array(z.string()).optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
});

export const mealOfferSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
    description: z.string().optional(),
});

export const productSchema = z.object({
    sku: z.string().min(1, "SKU é obrigatório"),
    name: z.string().min(1, "Nome é obrigatório"),
    unit: z.string().min(1, "Unidade é obrigatória"),
    category: z.string().optional(),
    purchaseType: z.enum(["central", "local"], {
        required_error: "Selecione o tipo de compra",
    }),
    price: z.coerce.number().positive("O preço deve ser positivo"),
});

export type UnitFormValues = z.infer<typeof unitSchema>;
export type ProductFormValues = z.infer<typeof productSchema>;
export type MealOfferFormValues = z.infer<typeof mealOfferSchema>;

export const recipeIngredientSchema = z.object({
    productId: z.string().min(1, "Selecione um insumo"),
    // We handle these as numbers in the form, but they might need coercion
    grossQty: z.coerce.number().positive("Quantidade deve ser positiva"),
    netQty: z.coerce.number().positive("Quantidade deve ser positiva"),
    correctionFactor: z.coerce.number().min(0, "Fator deve ser positivo"),
    unit: z.string().min(1, "Unidade é obrigatória"),
});

export const recipeSchema = z.object({
    unitId: z.string().min(1, "Selecione uma unidade"),
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    category: z.string().optional(),
    yield: z.coerce.number().positive("Rendimento deve ser positivo"),
    yieldUnit: z.string().min(1, "Unidade de rendimento é obrigatória"),
    prepTime: z.coerce.number().min(0, "Tempo de preparo deve ser positivo"),
    instructions: z.string().optional(),
    ingredients: z.array(recipeIngredientSchema).min(1, "Adicione pelo menos 1 ingrediente"),
});

export type RecipeFormValues = z.infer<typeof recipeSchema>;

export const productionPlanSchema = z.object({
    unitId: z.string().min(1, "Selecione uma unidade"),
    recipeId: z.string().min(1, "Selecione uma receita"),
    date: z.date({
        required_error: "Selecione a data de produção",
    }),
    quantity: z.coerce.number().min(1, "Quantidade deve ser pelo menos 1"),
});

export type ProductionPlanFormValues = z.infer<typeof productionPlanSchema>;

export const inviteUserSchema = z.object({
    email: z.string().email("Email inválido"),
    role: z.string().min(1, "Selecione um cargo"),
});

export const updateUserSchema = z.object({
    role: z.string().min(1, "Selecione um cargo"),
    teamIds: z.array(z.string()).optional(),
});

export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const employeeSchema = z.object({
    // Personal
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    cpf: z.string().optional(),
    rg: z.string().optional(),
    birthDate: z.string().optional(),
    phone: z.string().optional(),
    pis: z.string().optional(),

    // Address
    addressZip: z.string().optional(),
    addressStreet: z.string().optional(),
    addressNumber: z.string().optional(),
    addressComp: z.string().optional(),
    addressDistrict: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().optional(),

    // Contract
    role: z.enum(["admin", "manager", "operator"]),
    unitId: z.string().optional(),
    admissionDate: z.string().optional(),
    hourlyRate: z.string().optional(),

    // Schedule
    workSchedule: z.object({
        type: z.enum(["standard", "12x36", "flexible"]),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        workDays: z.array(z.number()).optional(), // 0-6
    }).optional(),

}).refine((data) => {
    if (data.role !== 'admin' && !data.unitId) {
        return false;
    }
    return true;
}, {
    message: "Unidade é obrigatória para este cargo",
    path: ["unitId"],
}).refine((data) => {
    if (data.workSchedule?.type === 'standard') {
        if (!data.workSchedule.startTime || !data.workSchedule.endTime) {
            return false;
        }
    }
    return true;
}, {
    message: "Horários de entrada e saída são obrigatórios para Jornada Padrão",
    path: ["workSchedule"],
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
