import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Edit, Trash2, Users, Tent } from "lucide-react"; // Tent as Unit icon placeholder
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    getUnits,
} from "@/lib/api";
import { Team, CreateTeamDTO, Unit } from "@/types";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

export default function Equipes() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);

    // Queries
    const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
        queryKey: ["teams"],
        queryFn: getTeams,
    });

    const { data: units = [] } = useQuery({
        queryKey: ["units"],
        queryFn: getUnits,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: createTeam,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            toast({ title: "Equipe criada com sucesso!" });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            toast({ title: "Erro ao criar equipe", description: error.message, variant: "destructive" });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Team> }) =>
            updateTeam(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            toast({ title: "Equipe atualizada com sucesso!" });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            toast({ title: "Erro ao atualizar equipe", description: error.message, variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTeam,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            toast({ title: "Equipe removida com sucesso!" });
        },
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;

        // Manual handling of checkboxes (simplified)
        // In a real form library use context, but raw form data works for checkboxes if named same
        // But controlled is easier for multi-select logic mapping
        // Let's use controlled state for units inside the dialog or simple ref
        // For now, let's extract from form elements manually if needed or use state.
        // Actually, let's use a simple local state for selectedUnitIds in the form component 
        // BUT since I am inline, I'll need to capture it.
        // See TeamForm component below.
    };

    const openNew = () => {
        setEditingTeam(null);
        setIsDialogOpen(true);
    };

    const openEdit = (team: Team) => {
        setEditingTeam(team);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir esta equipe?")) {
            deleteMutation.mutate(id);
        }
    }

    const filteredTeams = teams.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Equipes</h1>
                    <p className="text-muted-foreground">Grupos de acesso e permissões</p>
                </div>
                <Button className="gap-2" onClick={openNew}>
                    <Plus className="h-4 w-4" />
                    Nova Equipe
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar equipes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Unidades</TableHead>
                                <TableHead>Membros</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingTeams ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredTeams.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Nenhuma equipe encontrada
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTeams.map((team) => (
                                    <TableRow key={team.id}>
                                        <TableCell className="font-medium">{team.name}</TableCell>
                                        <TableCell>{team.description}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {team.units?.map(u => (
                                                    <Badge key={u.id} variant="secondary" className="text-xs">
                                                        {u.name}
                                                    </Badge>
                                                ))}
                                                {(!team.units || team.units.length === 0) && <span className="text-muted-foreground text-xs">-</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Users className="h-3 w-3" />
                                                <span className="text-sm">{team.members?.length || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(team)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(team.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTeam ? "Editar Equipe" : "Nova Equipe"}
                        </DialogTitle>
                        <DialogDescription>
                            Configure o acesso para este grupo.
                        </DialogDescription>
                    </DialogHeader>
                    <TeamForm
                        team={editingTeam}
                        units={units}
                        onSubmit={async (data) => {
                            if (editingTeam) {
                                await updateMutation.mutateAsync({ id: editingTeam.id, data });
                            } else {
                                await createMutation.mutateAsync(data as CreateTeamDTO);
                            }
                        }}
                        isSubmitting={createMutation.isPending || updateMutation.isPending}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function TeamForm({ team, units, onSubmit, isSubmitting }: {
    team: Team | null,
    units: Unit[],
    onSubmit: (data: any) => Promise<void>,
    isSubmitting: boolean
}) {
    // Simple controlled form state
    const [name, setName] = useState(team?.name || "");
    const [description, setDescription] = useState(team?.description || "");
    const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(
        team?.units?.map(u => u.id) || []
    );

    const toggleUnit = (unitId: string, checked: boolean) => {
        if (checked) {
            setSelectedUnitIds(prev => [...prev, unitId]);
        } else {
            setSelectedUnitIds(prev => prev.filter(id => id !== unitId));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            description,
            unitIds: selectedUnitIds
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome da Equipe</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Ex: Gerentes SP"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descrição das responsabilidades..."
                />
            </div>

            <div className="space-y-2">
                <Label>Acesso às Unidades</Label>
                <div className="grid gap-2 border rounded-md p-4 bg-muted/20 max-h-60 overflow-y-auto">
                    {units.map((unit) => {
                        const isChecked = selectedUnitIds.includes(unit.id);
                        return (
                            <div key={unit.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`unit-${unit.id}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) =>
                                        toggleUnit(unit.id, checked as boolean)
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
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                </Button>
            </div>
        </form>
    );
}
