import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productionPlanSchema, ProductionPlanFormValues } from "@/lib/schemas";
import { Recipe, Unit, Product } from "@/types";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";

interface ProductionPlanFormProps {
    defaultValues?: Partial<ProductionPlanFormValues>;
    onSubmit: (data: ProductionPlanFormValues) => void;
    isSubmitting?: boolean;
    units: Unit[];
    recipes: Recipe[];
    products: Product[];
}

export function ProductionPlanForm({
    defaultValues,
    onSubmit,
    isSubmitting = false,
    units,
    recipes,
    products,
}: ProductionPlanFormProps) {
    const form = useForm<ProductionPlanFormValues>({
        resolver: zodResolver(productionPlanSchema),
        defaultValues: defaultValues || {
            unitId: "",
            recipeId: "",
            date: new Date(),
            quantity: 1,
        },
    });

    // Watch for recipe and quantity changes to show ingredient forecast
    const watchedRecipeId = useWatch({ control: form.control, name: "recipeId" });
    const watchedQuantity = useWatch({ control: form.control, name: "quantity" });

    // Find the selected recipe
    const selectedRecipe = recipes.find(r => r.id === watchedRecipeId);

    // Calculate ingredient needs
    const ingredientForecast = selectedRecipe && watchedQuantity > 0 && products
        ? selectedRecipe.ingredients
            .map(ing => {
                const totalNeeded = ing.grossQty * watchedQuantity;
                const product = products.find(p => p.id === ing.productId);
                return {
                    ...ing,
                    productName: product?.name || "Produto desconhecido",
                    totalNeeded,
                };
            })
            // Sort by total needed (descending) and take top 5
            .sort((a, b) => Number(b.totalNeeded) - Number(a.totalNeeded))
            .slice(0, 5)
        : [];

    // Prepare recipe options for Combobox
    const recipeOptions: ComboboxOption[] = recipes.map(r => ({
        value: r.id,
        label: `${r.name} (${r.category || "Sem categoria"})`
    }));

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Unit Selection */}
                    <FormField
                        control={form.control}
                        name="unitId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unidade</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a unidade" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {units.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Date Picker */}
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data de Produção</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? (
                                                    format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                                ) : (
                                                    <span>Selecione a data</span>
                                                )}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            locale={ptBR}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Recipe Search */}
                <FormField
                    control={form.control}
                    name="recipeId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Receita</FormLabel>
                            <FormControl>
                                <Combobox
                                    options={recipeOptions}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    placeholder="Busque a receita..."
                                    searchPlaceholder="Digite para buscar..."
                                    emptyMessage="Nenhuma receita encontrada."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Quantity */}
                <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quantidade Estimada (porções)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="0"
                                    {...field}
                                    onChange={e => field.onChange(e.target.valueAsNumber)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Ingredient Forecast Card */}
                {selectedRecipe && watchedQuantity > 0 && ingredientForecast.length > 0 && (
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                Previsão de Insumos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm text-muted-foreground mb-3">
                                Para produzir <span className="font-bold text-foreground">{watchedQuantity} {selectedRecipe.yieldUnit}</span>, você precisará de:
                            </p>
                            <div className="space-y-2">
                                {ingredientForecast.map((ing, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0">
                                        <span className="text-foreground font-medium">{ing.productName || "Produto desconhecido"}</span>
                                        <span className="text-muted-foreground">
                                            {Number(ing.totalNeeded).toFixed(3)} {ing.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {selectedRecipe.ingredients.length > 5 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    + {selectedRecipe.ingredients.length - 5} outros ingredientes
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Plano de Produção
                </Button>
            </form>
        </Form>
    );
}
