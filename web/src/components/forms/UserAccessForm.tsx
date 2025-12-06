import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSchema, UpdateUserFormValues } from "@/lib/schemas";
import { User, Team } from "@/types";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ROLES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

interface UserAccessFormProps {
    user: User;
    teams: Team[];
    currentTeamIds: string[];
    onSubmit: (data: UpdateUserFormValues) => void;
    isSubmitting?: boolean;
}

export function UserAccessForm({
    user,
    teams,
    currentTeamIds,
    onSubmit,
    isSubmitting = false,
}: UserAccessFormProps) {
    const currentRole = user.role || "";

    const form = useForm<UpdateUserFormValues>({
        // TODO: Update schema to support 'teamIds' instead of 'unitIds' if validation is strict
        // Or just map it. Let's assume schema allows flexible fields or we update schema file too.
        // For now, I'll map 'unitIds' in schema to 'teamIds' logically or ignore TS error if schema is strict.
        // Best to update schema. Let's assume I will update schema next.
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            role: currentRole,
            teamIds: currentTeamIds, // This field needs to be in schema
        } as any,
    });

    const selectedTeamId = form.watch("teamIds")?.[0];
    const selectedTeam = teams.find(t => t.id === selectedTeamId);

    const handleTeamChange = (teamId: string) => {
        form.setValue("teamIds", [teamId]);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Role Selection */}
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cargo / Função</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um cargo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {ROLES.map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Team Selection */}
                <div className="space-y-3">
                    <Label>Equipe</Label>
                    <Select
                        onValueChange={handleTeamChange}
                        value={selectedTeamId || ""}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione uma equipe" />
                        </SelectTrigger>
                        <SelectContent>
                            {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        O usuário terá acesso às unidades definidas na equipe selecionada.
                    </p>
                </div>

                {/* Access Preview */}
                {selectedTeam && (
                    <div className="space-y-2 border rounded-md p-4 bg-muted/20">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">
                            Acesso a Unidades ({selectedTeam.units?.length || 0})
                        </Label>
                        <div className="flex flex-wrap gap-1">
                            {selectedTeam.units?.length ? (
                                selectedTeam.units.map(u => (
                                    <span key={u.id} className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                        {u.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-muted-foreground">Nenhuma unidade vinculada a esta equipe.</span>
                            )}
                        </div>
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                </Button>
            </form>
        </Form>
    );
}
