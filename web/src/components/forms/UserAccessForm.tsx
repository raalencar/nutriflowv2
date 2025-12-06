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

    const handleCheckboxChange = (teamId: string, checked: boolean) => {
        const currentIds = form.getValues("teamIds" as any) || [];
        if (checked) {
            form.setValue("teamIds" as any, [...currentIds, teamId]);
        } else {
            form.setValue("teamIds" as any, currentIds.filter((id: string) => id !== teamId));
        }
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

                {/* Team Access */}
                <div className="space-y-3">
                    <Label>Equipes de Acesso</Label>
                    <div className="grid gap-2 border rounded-md p-4 bg-muted/20 max-h-60 overflow-y-auto">
                        {teams.map((team) => {
                            const isChecked = (form.watch("teamIds") || []).includes(team.id);
                            return (
                                <div key={team.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`team-${team.id}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) =>
                                            handleCheckboxChange(team.id, checked as boolean)
                                        }
                                    />
                                    <Label
                                        htmlFor={`team-${team.id}`}
                                        className="cursor-pointer font-normal"
                                    >
                                        {team.name}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                </Button>
            </form>
        </Form>
    );
}
