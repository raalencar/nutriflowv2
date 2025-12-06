import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSchema, UpdateUserFormValues } from "@/lib/schemas";
import { User, Unit } from "@/types";

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
    units: Unit[];
    currentUnitIds: string[];
    onSubmit: (data: UpdateUserFormValues) => void;
    isSubmitting?: boolean;
}

export function UserAccessForm({
    user,
    units,
    currentUnitIds,
    onSubmit,
    isSubmitting = false,
}: UserAccessFormProps) {
    const currentRole = user.publicMetadata?.role?.[0] || "";

    const form = useForm<UpdateUserFormValues>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            role: currentRole,
            unitIds: currentUnitIds,
        },
    });

    const handleCheckboxChange = (unitId: string, checked: boolean) => {
        const currentIds = form.getValues("unitIds") || [];
        if (checked) {
            form.setValue("unitIds", [...currentIds, unitId]);
        } else {
            form.setValue("unitIds", currentIds.filter(id => id !== unitId));
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

                {/* Unit Access */}
                <div className="space-y-3">
                    <Label>Acesso às Unidades</Label>
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
                                        {unit.name}{" "}
                                        <span className="text-xs text-muted-foreground">
                                            ({unit.type})
                                        </span>
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
