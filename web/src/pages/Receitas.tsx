import { useState } from "react";
import { useRecipes, useCreateRecipe, useUpdateRecipe, useDeleteRecipe } from "@/hooks/use-recipes";
import { useProducts } from "@/hooks/use-products";
import { RecipeFormValues } from "@/lib/schemas";
import { Recipe } from "@/lib/api";
import { RecipeForm } from "@/components/forms/RecipeForm";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, ChefHat, Clock, Users, Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RoleGuard } from "@/components/RoleGuard";


export default function Receitas() {
  const { data: recipes = [], isLoading } = useRecipes();
  const { data: products = [] } = useProducts();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(search.toLowerCase()) ||
      (recipe.category && recipe.category.toLowerCase().includes(search.toLowerCase()))
  );

  const onSubmit = (data: RecipeFormValues) => {
    const apiPayload: any = {
      ...data,
      yield: data.yield.toString(),
      prepTime: data.prepTime.toString(),
      ingredients: data.ingredients.map(ing => ({
        ...ing,
      }))
    };

    if (editingRecipe) {
      updateRecipe.mutate(
        { id: editingRecipe.id, data: apiPayload },
        {
          onSuccess: () => {
            toast({ title: "Receita atualizada com sucesso!" });
            handleCloseDialog();
          },
          onError: () => {
            toast({ title: "Erro ao atualizar receita", variant: "destructive" });
          },
        }
      );
    } else {
      createRecipe.mutate(
        apiPayload,
        {
          onSuccess: () => {
            toast({ title: "Receita criada com sucesso!" });
            handleCloseDialog();
          },
          onError: () => {
            toast({ title: "Erro ao criar receita", variant: "destructive" });
          },
        }
      );
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRecipe(null);
  };

  const handleView = (recipe: Recipe) => {
    setViewingRecipe(recipe);
    setIsViewDialogOpen(true);
  }

  const confirmDelete = () => {
    if (recipeToDelete) {
      deleteRecipe.mutate(recipeToDelete.id, {
        onSuccess: () => {
          toast({ title: "Receita removida com sucesso!" });
          setRecipeToDelete(null);
        },
        onError: () => {
          toast({ title: "Erro ao remover receita", variant: "destructive" });
        },
      });
    }
  };

  const isSubmitting = createRecipe.isPending || updateRecipe.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fichas Técnicas</h1>
          <p className="text-muted-foreground">Engenharia de cardápio e receitas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova Receita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRecipe ? "Editar Receita" : "Nova Receita"}
              </DialogTitle>
            </DialogHeader>
            <RecipeForm
              defaultValues={editingRecipe ? {
                name: editingRecipe.name,
                category: editingRecipe.category || "Prato Principal",
                yield: parseFloat(editingRecipe.yield),
                yieldUnit: editingRecipe.yieldUnit,
                prepTime: parseFloat(editingRecipe.prepTime),
                instructions: editingRecipe.instructions || "",
                ingredients: editingRecipe.ingredients.map(ing => ({
                  productId: ing.productId,
                  grossQty: Number(ing.grossQty),
                  netQty: Number(ing.netQty),
                  correctionFactor: Number(ing.correctionFactor),
                  unit: ing.unit
                })),
              } : undefined}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              editMode={!!editingRecipe}
              products={products}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar receitas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[250px] w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.length === 0 ? (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              Nenhuma receita encontrada.
            </div>
          ) : (
            filteredRecipes.map((recipe) => (
              <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ChefHat className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{recipe.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {recipe.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{recipe.yield} {recipe.yieldUnit}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{recipe.prepTime} min</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Ingredientes: </span>
                    <span className="font-medium text-foreground">{recipe.ingredients.length} itens</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <span className="text-xs text-muted-foreground">Custo/Porção</span>
                      <p className="text-lg font-bold text-primary">
                        R$ {(recipe.costPerServing || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleView(recipe)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(recipe)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <RoleGuard allowedRoles={['admin', 'manager']}>
                        <Button variant="ghost" size="icon" onClick={() => setRecipeToDelete(recipe)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </RoleGuard>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {viewingRecipe && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                {viewingRecipe.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <Badge variant="secondary">{viewingRecipe.category}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{viewingRecipe.yield} {viewingRecipe.yieldUnit}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{viewingRecipe.prepTime} min</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3">Ingredientes</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium text-muted-foreground">Produto</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Peso Bruto</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Peso Líquido</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">FC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingRecipe.ingredients.map((ing, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="py-2">{ing.name || "Insumo " + i}</td>
                          <td className="text-right py-2">{ing.grossQty} {ing.unit}</td>
                          <td className="text-right py-2">{ing.netQty} {ing.unit}</td>
                          <td className="text-right py-2">{ing.correctionFactor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Modo de Preparo</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {viewingRecipe.instructions || "Sem instruções."}
                </p>
              </div>

              <div className="bg-primary/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Custo por porção:</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {(viewingRecipe.costPerServing || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!recipeToDelete} onOpenChange={() => setRecipeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a receita
              "{recipeToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
