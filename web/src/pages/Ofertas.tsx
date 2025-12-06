import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMealOffers, useCreateMealOffer, useUpdateMealOffer, useDeleteMealOffer } from "@/hooks/use-meal-offers";
import { mealOfferSchema, MealOfferFormValues } from "@/lib/schemas";
import { MealOffer } from "@/lib/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Utensils, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Ofertas() {
    const { data: offers = [], isLoading } = useMealOffers();
    const createOffer = useCreateMealOffer();
    const updateOffer = useUpdateMealOffer();
    const deleteOffer = useDeleteMealOffer();
    const { toast } = useToast();

    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<MealOffer | null>(null);
    const [offerToDelete, setOfferToDelete] = useState<MealOffer | null>(null);

    const form = useForm<MealOfferFormValues>({
        resolver: zodResolver(mealOfferSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const filteredOffers = offers.filter((offer) =>
        offer.name.toLowerCase().includes(search.toLowerCase())
    );

    const onSubmit = (data: MealOfferFormValues) => {
        if (editingOffer) {
            updateOffer.mutate(
                { id: editingOffer.id, data },
                {
                    onSuccess: () => {
                        toast({ title: "Oferta atualizada com sucesso!" });
                        handleCloseDialog();
                    },
                    onError: () => {
                        toast({ title: "Erro ao atualizar oferta", variant: "destructive" });
                    },
                }
            );
        } else {
            createOffer.mutate(data, {
                onSuccess: () => {
                    toast({ title: "Oferta cadastrada com sucesso!" });
                    handleCloseDialog();
                },
                onError: () => {
                    toast({ title: "Erro ao cadastrar oferta", variant: "destructive" });
                },
            });
        }
    };

    const handleEdit = (offer: MealOffer) => {
        setEditingOffer(offer);
        form.reset({
            name: offer.name,
            description: offer.description || "",
        });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingOffer(null);
        form.reset({ name: "", description: "" });
    };

    const confirmDelete = () => {
        if (offerToDelete) {
            deleteOffer.mutate(offerToDelete.id, {
                onSuccess: () => {
                    toast({ title: "Oferta removida com sucesso!" });
                    setOfferToDelete(null);
                },
                onError: () => {
                    toast({ title: "Erro ao remover oferta", variant: "destructive" });
                },
            });
        }
    };

    const isSubmitting = createOffer.isPending || updateOffer.isPending;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Ofertas de Refeições</h1>
                    <p className="text-muted-foreground">Gerencie as ofertas disponíveis nos contratos</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Nova Oferta
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingOffer ? "Editar Oferta" : "Nova Oferta"}
                            </DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome da Oferta</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Lanche Manhã, Almoço, Lanche Tarde" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição (Opcional)</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Descreva a oferta..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingOffer ? "Salvar Alterações" : "Cadastrar Oferta"}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar ofertas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[150px] w-full" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOffers.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            Nenhuma oferta encontrada.
                        </div>
                    ) : (
                        filteredOffers.map((offer) => (
                            <Card key={offer.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Utensils className="h-5 w-5 text-primary" />
                                            </div>
                                            <CardTitle className="text-base">{offer.name}</CardTitle>
                                        </div>
                                        <div
                                            className={`h-2 w-2 rounded-full ${offer.status === "active" ? "bg-chart-1" : "bg-muted"
                                                }`}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {offer.description && (
                                        <p className="text-sm text-muted-foreground">{offer.description}</p>
                                    )}
                                    <div className="flex gap-1 pt-2 border-t border-border">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(offer)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setOfferToDelete(offer)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            <AlertDialog open={!!offerToDelete} onOpenChange={() => setOfferToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a oferta "
                            {offerToDelete?.name}".
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
