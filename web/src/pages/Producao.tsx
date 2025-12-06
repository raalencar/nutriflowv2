import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon, ChefHat, Users, Clock, CheckCircle, PlayCircle, Printer, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useProductionPlans, useCreateProductionPlan, useCompleteProductionPlan, useDeleteProductionPlan } from "@/hooks/use-operations";
import { useUnits } from "@/hooks/use-units";
import { useRecipes } from "@/hooks/use-recipes";
import { useProducts } from "@/hooks/use-products";
import { ProductionPlanFormValues } from "@/lib/schemas";
import { ProductionPlanForm } from "@/components/forms/ProductionPlanForm";
import { cn } from "@/lib/utils";
import { useReactToPrint } from "react-to-print";
import { ProductionOrderPrint } from "@/components/reports/ProductionOrderPrint";

const statusConfig = {
  planned: { label: "Planejado", icon: Clock, variant: "secondary" as const },
  in_progress: { label: "Em Produção", icon: PlayCircle, variant: "default" as const },
  completed: { label: "Finalizado", icon: CheckCircle, variant: "outline" as const },
};

export default function Producao() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [unitFilter, setUnitFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: units = [] } = useUnits();
  const { data: recipes = [] } = useRecipes();
  const { data: products = [] } = useProducts();

  const queryUnit = unitFilter === "all" ? undefined : unitFilter;
  const { data: plans = [], isLoading } = useProductionPlans(queryUnit);

  const createPlan = useCreateProductionPlan();
  const completePlan = useCompleteProductionPlan();
  const deletePlan = useDeleteProductionPlan();

  const filteredPlans = plans.filter((plan) => {
    const matchesUnit = unitFilter === "all" || plan.unitId === unitFilter;
    return matchesUnit;
  });

  const stats = {
    total: filteredPlans.length,
    completed: filteredPlans.filter((p) => p.status === "completed").length,
    inProgress: filteredPlans.filter((p) => p.status === "in_progress").length,
    planned: filteredPlans.filter((p) => p.status === "planned").length,
  };

  const handleSubmit = (data: ProductionPlanFormValues) => {
    const payload = {
      unitId: data.unitId,
      recipeId: data.recipeId,
      date: format(data.date, "yyyy-MM-dd"),
      quantity: data.quantity
    };

    createPlan.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Plano de produção criado!" });
        setIsDialogOpen(false);
      },
      onError: () => {
        toast({ title: "Erro ao criar plano", variant: "destructive" });
      }
    });
  };

  const handleCompleteProduction = (id: string) => {
    completePlan.mutate(id, {
      onSuccess: () => {
        toast({ title: "Produção finalizada!", description: "Baixa de estoque realizada." });
      },
      onError: (error: any) => {
        // Display detailed error message from backend
        const errorMsg = error.message || "Erro desconhecido";
        toast({
          title: "Não foi possível finalizar",
          description: errorMsg,
          variant: "destructive"
        });
      }
    });
  };

  const handleDelete = (plan: any) => {
    if (confirm(`Tem certeza que deseja excluir o plano de produção "${plan.recipeName}"?`)) {
      deletePlan.mutate(plan.id, {
        onSuccess: () => {
          toast({ title: "Plano excluído com sucesso!" });
        },
        onError: (error: any) => {
          toast({
            title: "Erro ao excluir",
            description: error.message || "Não foi possível excluir o plano",
            variant: "destructive"
          });
        }
      });
    }
  };

  const handlePrintClick = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Ordem_Producao_${printData?.id?.slice(0, 8) || 'doc'}`,
  });

  const handlePrint = (plan: any) => {
    // Find the recipe to get ingredients
    const recipe = recipes.find(r => r.id === plan.recipeId);

    // Calculate ingredients with product names
    const ingredients = recipe?.ingredients.map(ing => {
      const product = products.find(p => p.id === ing.productId);
      return {
        productName: product?.name || "Produto desconhecido",
        totalNeeded: Number(ing.grossQty) * Number(plan.quantity),
        unit: ing.unit
      };
    }) || [];

    // Set print data
    setPrintData({
      ...plan,
      recipe: {
        ...recipe,
        ingredients: ingredients
      },
      ingredients: ingredients
    });

    // Trigger print after a short delay to ensure state is updated
    setTimeout(() => {
      handlePrintClick();
    }, 100);
  };

  // Helper to join data
  const enrichedPlans = filteredPlans.map(plan => {
    const recipe = recipes.find(r => r.id === plan.recipeId);
    const unit = units.find(u => u.id === plan.unitId);
    return {
      ...plan,
      recipeName: recipe?.name || "Receita desconhecida",
      unitName: unit?.name || "Unidade desconhecida"
    };
  });

  const unitsWithPlans = Array.from(new Set(enrichedPlans.map(p => p.unitName)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produção</h1>
          <p className="text-muted-foreground">Planejamento e controle de produção</p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Plano de Produção</DialogTitle>
              </DialogHeader>
              <ProductionPlanForm
                onSubmit={handleSubmit}
                isSubmitting={createPlan.isPending}
                units={units}
                recipes={recipes}
                products={products}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <ChefHat className="h-8 w-8 text-muted" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Finalizados</p>
                <p className="text-2xl font-bold text-chart-1">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-chart-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Produção</p>
                <p className="text-2xl font-bold text-primary">{stats.inProgress}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Planejados</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.planned}</p>
              </div>
              <Clock className="h-8 w-8 text-muted" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={unitFilter} onValueChange={setUnitFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas as Unidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Unidades</SelectItem>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Production Cards by Unit */}
      {isLoading ? (
        <div className="text-center py-10">Carregando planos...</div>
      ) : (
        <div className="space-y-6">
          {unitsWithPlans.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">Nenhum plano encontrado.</div>
          )}
          {unitsWithPlans.map((unitName) => {
            const plansForUnit = enrichedPlans.filter(p => p.unitName === unitName);
            if (plansForUnit.length === 0) return null;

            return (
              <Card key={unitName}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    {unitName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {plansForUnit.map((plan) => {
                      const status = statusConfig[plan.status];
                      const isCompleted = plan.status === "completed";

                      return (
                        <div
                          key={plan.id}
                          className={cn(
                            "border border-border rounded-lg p-4 space-y-3 transition-opacity",
                            isCompleted && "opacity-60"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{plan.recipeName}</h4>
                              <p className="text-sm text-muted-foreground">{format(new Date(plan.date), 'dd/MM/yyyy')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handlePrint(plan)}
                                title="Imprimir ficha"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Badge
                                variant={status.variant}
                                className={cn(
                                  isCompleted && "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                )}
                              >
                                <status.icon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Qtd:</span>
                              <span className="font-medium">{plan.quantity}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          {!isCompleted && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                variant={plan.status === "planned" ? "outline" : "secondary"}
                                onClick={() => handleCompleteProduction(plan.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Finalizar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="px-3"
                                onClick={() => handleDelete(plan)}
                                title="Excluir plano"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Hidden Print Component */}
      <ProductionOrderPrint ref={componentRef} data={printData} />
    </div>
  );
}
