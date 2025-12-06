import { useState } from "react";
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/use-units";
import { useMealOffers } from "@/hooks/use-meal-offers";
import { UnitFormValues } from "@/lib/schemas";
import { Unit } from "@/lib/api";
import { UnitForm } from "@/components/forms/UnitForm";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building2, MapPin, Phone, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function Unidades() {
  const { data: units = [], isLoading } = useUnits();
  const { data: mealOffers = [] } = useMealOffers();
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);

  const filteredUnits = units.filter(
    (unit) =>
      unit.name.toLowerCase().includes(search.toLowerCase()) ||
      (unit.address && unit.address.toLowerCase().includes(search.toLowerCase()))
  );

  const onSubmit = (data: UnitFormValues) => {
    if (editingUnit) {
      updateUnit.mutate(
        { id: editingUnit.id, data },
        {
          onSuccess: () => {
            toast({ title: "Unidade atualizada com sucesso!" });
            setIsDialogOpen(false);
            setEditingUnit(null);
          },
          onError: () => {
            toast({ title: "Erro ao atualizar unidade", variant: "destructive" });
          },
        }
      );
    } else {
      createUnit.mutate(
        data,
        {
          onSuccess: () => {
            toast({ title: "Unidade cadastrada com sucesso!" });
            setIsDialogOpen(false);
          },
          onError: () => {
            toast({ title: "Erro ao cadastrar unidade", variant: "destructive" });
          },
        }
      );
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUnit(null);
  };


  const confirmDelete = () => {
    if (unitToDelete) {
      deleteUnit.mutate(unitToDelete.id, {
        onSuccess: () => {
          toast({ title: "Unidade removida com sucesso!" });
          setUnitToDelete(null);
        },
        onError: () => {
          toast({ title: "Erro ao remover unidade", variant: "destructive" });
        },
      });
    }
  };

  const isSubmitting = createUnit.isPending || updateUnit.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Unidades</h1>
          <p className="text-muted-foreground">Gerencie as cozinhas da rede</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova Unidade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUnit ? "Editar Unidade" : "Nova Unidade"}
              </DialogTitle>
            </DialogHeader>
            <UnitForm
              defaultValues={editingUnit ? {
                name: editingUnit.name,
                type: editingUnit.type,
                address: editingUnit.address || "",
                fullAddress: editingUnit.fullAddress || "",
                phone: editingUnit.phone || "",
                manager: editingUnit.manager || "",
                contractNumber: editingUnit.contractNumber || "",
                contractManager: editingUnit.contractManager || "",
                mealOffers: editingUnit.mealOffers || [],
                latitude: editingUnit.latitude || "",
                longitude: editingUnit.longitude || "",
              } : undefined}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              editMode={!!editingUnit}
              mealOffers={mealOffers}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar unidades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUnits.length === 0 ? (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              Nenhuma unidade encontrada.
            </div>
          ) : (
            filteredUnits.map((unit) => (
              <Card key={unit.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{unit.name}</CardTitle>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${unit.type === "hub"
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {unit.type === "hub" ? "Matriz" : "Filial"}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full ${unit.status === "active" ? "bg-chart-1" : "bg-muted"
                        }`}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{unit.address || "Sem endereço"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{unit.phone || "Sem telefone"}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      Resp: {unit.manager || "N/A"}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(unit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setUnitToDelete(unit)}
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
      )}

      <AlertDialog open={!!unitToDelete} onOpenChange={() => setUnitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a unidade
              "{unitToDelete?.name}".
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
