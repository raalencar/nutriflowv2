import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useUnits } from "@/hooks/use-units";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/constants";

const createUserSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    role: z.enum(["admin", "manager", "operator"]),
    unitId: z.string().optional(),
}).refine((data) => {
    // If role is NOT admin, unitId is required (unless it's a global manager? prompt says "Obrigatório se cargo não for Admin")
    if (data.role !== 'admin' && !data.unitId) {
        return false;
    }
    return true;
}, {
    message: "Unidade é obrigatória para este cargo",
    path: ["unitId"],
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { data: units = [] } = useUnits();

    const form = useForm<CreateUserFormValues>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            name: "",
            email: "",
            role: "operator",
            unitId: "",
        },
    });

    const selectedRole = form.watch("role");

    // Logic: If logged user is Manager, he can only create for his units?
    // Prompt: "Se o usuário logado for Gerente... campo Unidade deve vir pré-fixado... ou só pode criar para a unidade dele"
    // Assuming Manager has `unitId` or we check allowed units.
    // For simplicity and prompt adherence: "Se for Gerente, pré-fixar".
    // If useAuth user has `unitId` (we added it to type), we use it.
    // Note: user from useAuth matches `User` interface update.

    const isManager = user?.role === 'manager';

    useEffect(() => {
        if (open) {
            form.reset({
                name: "",
                email: "",
                role: "operator",
                unitId: ""
            });

            if (isManager && user?.unitId) {
                form.setValue("unitId", user.unitId);
            }
        }
    }, [open, isManager, user, form]);

    const mutation = useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            toast({ title: "Usuário criado com sucesso!" });
            queryClient.invalidateQueries({ queryKey: ["users"] });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao criar usuário",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: CreateUserFormValues) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Colaborador</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome completo" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="email@exemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cargo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o cargo" />
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

                        {selectedRole !== 'admin' && (
                            <FormField
                                control={form.control}
                                name="unitId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unidade</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={isManager && !!user?.unitId} // Lock if manager has unit
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a unidade" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {units.map((unit) => (
                                                    <SelectItem key={unit.id} value={unit.id}>
                                                        {unit.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Usuário
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
