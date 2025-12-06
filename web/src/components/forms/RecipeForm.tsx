import { useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recipeSchema, RecipeFormValues } from "@/lib/schemas";
import { Product, Unit } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { Plus, Trash2, Loader2, ChefHat, ListOrdered, ScrollText } from "lucide-react";
import { RECIPE_CATEGORIES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";

interface RecipeFormProps {
    defaultValues?: Partial<RecipeFormValues>;
    onSubmit: (data: RecipeFormValues) => void;
    isSubmitting?: boolean;
    editMode?: boolean;
    products: Product[];
    units: Unit[];
}

export function RecipeForm({
    defaultValues,
    onSubmit,
    isSubmitting = false,
    editMode = false,
    products,
    units,
}: RecipeFormProps) {
    const form = useForm<RecipeFormValues>({
        resolver: zodResolver(recipeSchema),
        defaultValues: defaultValues || {
            unitId: units.length === 1 ? units[0].id : "",
            name: "",
            category: "Prato Principal",
            yield: 1,
            yieldUnit: "porções",
            prepTime: 30,
            instructions: "",
            ingredients: [],
        },
    });

    useEffect(() => {
        if (!editMode && units.length === 1) {
            form.setValue("unitId", units[0].id);
        }
    }, [units, editMode, form]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "ingredients",
    });

    // Watch ingredients to calculate cost in real-time
    const watchedIngredients = useWatch({
        control: form.control,
        name: "ingredients"
    });

    // Calculate estimated cost
    const estimatedCost = watchedIngredients?.reduce((acc, ing) => {
        const product = products.find(p => p.id === ing.productId);
        if (product) {
            return acc + (parseFloat(product.price) * (ing.grossQty || 0));
        }
        return acc;
    }, 0) || 0;

    const currentYield = useWatch({ control: form.control, name: "yield" }) || 1;
    const estimatedCostPerServing = currentYield > 0 ? estimatedCost / currentYield : 0;

    // Automatic FC calculation for each ingredient
    useEffect(() => {
        if (!watchedIngredients) return;

        watchedIngredients.forEach((ingredient, index) => {
            const grossQty = ingredient.grossQty || 0;
            const netQty = ingredient.netQty || 0;

            // Calculate FC only if both values are greater than 0
            if (grossQty > 0 && netQty > 0) {
                const calculatedFC = Number((grossQty / netQty).toFixed(2));
                const currentFC = form.getValues(`ingredients.${index}.correctionFactor`);

                // Only update if FC has actually changed (avoid infinite loops)
                if (currentFC !== calculatedFC) {
                    form.setValue(`ingredients.${index}.correctionFactor`, calculatedFC, {
                        shouldValidate: false,
                        shouldDirty: true,
                    });
                }
            }
        });
    }, [watchedIngredients, form]);

    // Prepare product options for Combobox
    const productOptions: ComboboxOption[] = products.map(p => ({
        value: p.id,
        label: `${p.name} (${p.unit}) - R$ ${parseFloat(p.price).toFixed(2)}`
    }));

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="resumo" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="resumo" className="gap-2">
                            <ChefHat className="h-4 w-4" />
                            Resumo
                        </TabsTrigger>
                        <TabsTrigger value="ingredientes" className="gap-2">
                            <ListOrdered className="h-4 w-4" />
                            Ingredientes
                        </TabsTrigger>
                        <TabsTrigger value="preparo" className="gap-2">
                            <ScrollText className="h-4 w-4" />
                            Preparo
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab Resumo */}
                    <TabsContent value="resumo" className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="unitId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unidade</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={!editMode && units.length === 1}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a Unidade" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {units.map((unit) => (
                                                <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Receita</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Arroz Branco" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoria</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {RECIPE_CATEGORIES.map((c) => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="yield"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rendimento</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="yieldUnit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unidade</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: porções, kg" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="prepTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tempo (min)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    {/* Tab Ingredientes */}
                    <TabsContent value="ingredientes" className="space-y-4 mt-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm text-muted-foreground">Lista de Ingredientes</h4>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ productId: "", grossQty: 0, netQty: 0, correctionFactor: 1, unit: "kg" })}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Adicionar
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {fields.length === 0 ? (
                                <Card>
                                    <CardContent className="p-6 text-center text-muted-foreground">
                                        Nenhum ingrediente adicionado. Clique em "Adicionar" para começar.
                                    </CardContent>
                                </Card>
                            ) : (
                                fields.map((field, index) => (
                                    <Card key={field.id}>
                                        <CardContent className="p-4">
                                            <div className="flex flex-col gap-4">
                                                {/* Product Selection */}
                                                <FormField
                                                    control={form.control}
                                                    name={`ingredients.${index}.productId`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormLabel>Produto</FormLabel>
                                                            <FormControl>
                                                                <Combobox
                                                                    options={productOptions}
                                                                    value={field.value}
                                                                    onValueChange={field.onChange}
                                                                    placeholder="Busque o insumo..."
                                                                    searchPlaceholder="Digite para buscar..."
                                                                    emptyMessage="Nenhum produto encontrado."
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Quantities and FC */}
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                                                    <FormField
                                                        control={form.control}
                                                        name={`ingredients.${index}.grossQty`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs">Peso Bruto</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.001"
                                                                        {...field}
                                                                        onChange={e => field.onChange(e.target.valueAsNumber)}
                                                                        className="text-sm"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`ingredients.${index}.netQty`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs">Peso Líquido</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.001"
                                                                        {...field}
                                                                        onChange={e => field.onChange(e.target.valueAsNumber)}
                                                                        className="text-sm"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`ingredients.${index}.correctionFactor`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs">FC (Auto)</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        {...field}
                                                                        onChange={e => field.onChange(e.target.valueAsNumber)}
                                                                        className="text-sm bg-muted"
                                                                        title="Calculado automaticamente: Bruto / Líquido"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`ingredients.${index}.unit`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs">Unidade</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} className="text-sm" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => remove(index)}
                                                        className="h-9"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>

                        {/* Cost Summary Card */}
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-foreground">Custo Estimado</span>
                                    <div className="text-right">
                                        <div className="font-bold text-lg text-primary">R$ {estimatedCost.toFixed(2)}</div>
                                        <div className="text-xs text-muted-foreground">Por Porção: R$ {estimatedCostPerServing.toFixed(2)}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tab Preparo */}
                    <TabsContent value="preparo" className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="instructions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Modo de Preparo</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descreva o passo a passo da preparação..."
                                            className="min-h-[300px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    <p className="text-xs text-muted-foreground">
                                        Descreva detalhadamente as etapas de preparo desta receita.
                                    </p>
                                </FormItem>
                            )}
                        />
                    </TabsContent>
                </Tabs>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editMode ? "Salvar Alterações" : "Criar Receita"}
                </Button>
            </form>
        </Form>
    );
}
