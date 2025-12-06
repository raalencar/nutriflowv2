import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getTeams, createTeam, updateTeam, deleteTeam, getUnits } from "@/lib/api";
import { Team, CreateTeamDTO, Unit } from "@/types";

const teamSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    description: z.string().optional(),
    unitIds: z.array(z.string()).min(1, "Selecione pelo menos uma unidade"),
});

type TeamFormValues = z.infer<typeof teamSchema>;

export default function Equipes() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const queryClient = useQueryClient();

    const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
        queryKey: ["teams"],
        queryFn: getTeams,
    });

    const { data: units = [], isLoading: isLoadingUnits } = useQuery({
        queryKey: ["units"],
        queryFn: getUnits,
    });

    const createMutation = useMutation({
        mutationFn: createTeam,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            toast.success("Equipe criada com sucesso");
            setIsDialogOpen(false);
        },
        onError: (error) => {
            toast.error(`Erro ao criar equipe: ${error.message}`);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateTeamDTO }) =>
            updateTeam(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            toast.success("Equipe atualizada com sucesso");
            setIsDialogOpen(false);
            setEditingTeam(null);
        },
        onError: (error) => {
            toast.error(`Erro ao atualizar equipe: ${error.message}`);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTeam,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            toast.success("Equipe removida com sucesso");
        },
        onError: (error) => {
            toast.error(`Erro ao remover equipe: ${error.message}`);
        },
    });

    const handleSubmit = (data: TeamFormValues) => {
        const teamData: CreateTeamDTO = {
            name: data.name,
            description: data.description,
            unitIds: data.unitIds,
        };

        if (editingTeam) {
            updateMutation.mutate({ id: editingTeam.id, data: teamData });
        } else {
            createMutation.mutate(teamData);
        }
    };

    const handleEdit = (team: Team) => {
        setEditingTeam(team);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Tem certeza que deseja remover esta equipe?")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Equipes</h1>
                    <p className="text-muted-foreground">
                        Gerencie as equipes e seus acessos às unidades.
                    </p>
                </div>
                <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setEditingTeam(null);
                    }}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Equipe
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingTeam ? "Editar Equipe" : "Nova Equipe"}
                            </DialogTitle>
                        </DialogHeader>
                        <TeamForm
                            defaultValues={
                                editingTeam
                                    ? {
                                        name: editingTeam.name,
                                        description: editingTeam.description || "",
                                        unitIds: editingTeam.units?.map((u) => u.id) || [],
                                    }
                                    : { name: "", description: "", unitIds: [] }
                            }
                            onSubmit={handleSubmit}
                            units={units}
                            isLoading={createMutation.isPending || updateMutation.isPending}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Unidades de Acesso</TableHead>
                            <TableHead>Membros</TableHead>
                            <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingTeams ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : teams.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Nenhuma equipe cadastrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            teams.map((team) => (
                                <TableRow key={team.id}>
                                    <TableCell className="font-medium">{team.name}</TableCell>
                                    <TableCell>{team.description}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {team.units?.slice(0, 3).map((unit) => (
                                                <Badge key={unit.id} variant="outline">
                                                    {unit.name}
                                                </Badge>
                                            ))}
                                            {(team.units?.length || 0) > 3 && (
                                                <Badge variant="secondary">
                                                    +{team.units!.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span>{team.members?.length || 0}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(team)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(team.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function TeamForm({
    defaultValues,
    onSubmit,
    units,
    isLoading,
}: {
    defaultValues: TeamFormValues;
    onSubmit: (data: TeamFormValues) => void;
    units: Unit[];
    isLoading: boolean;
}) {
    const form = useForm<TeamFormValues>({
        resolver: zodResolver(teamSchema),
        defaultValues,
    });

    const handleCheckboxChange = (unitId: string, checked: boolean) => {
        const currentIds = form.getValues("unitIds") || [];
        if (checked) {
            form.setValue("unitIds", [...currentIds, unitId]);
        } else {
            form.setValue("unitIds", currentIds.filter((id) => id !== unitId));
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Equipe</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Produção - Manhã" {...field} />
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
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Detalhes sobre a equipe..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="space-y-3">
                    <Label>Unidades de Acesso</Label>
                    <div className="grid gap-2 border rounded-md p-4 bg-muted/20 max-h-60 overflow-y-auto">
                        {units.map((unit) => {
                            const isChecked = (form.watch("unitIds") || []).includes(unit.id);
                            return (
                                <div key={unit.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`unit-${unit.id}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) =>
                                            handleCheckboxChange(unit.id, checked as boolean)
                                        }
                                    />
                                    <Label
                                        htmlFor={`unit-${unit.id}`}
                                        className="cursor-pointer font-normal"
                                    >
                                        {unit.name}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                    {form.formState.errors.unitIds && (
                        <p className="text-sm font-medium text-destructive">
                            {form.formState.errors.unitIds.message}
                        </p>
                    )}
                </div>
                <div className="flex justify-end space-x-2">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </Button>
                </div>
            </form>
        </Form>
    );
}
