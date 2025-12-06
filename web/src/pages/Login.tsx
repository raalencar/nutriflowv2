import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { login as loginApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { ChefHat, Loader2 } from "lucide-react";

const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "A senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
    const { login } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        try {
            const response = await loginApi(data);
            login(response.token, response.user);
            toast({ title: "Login realizado com sucesso!" });
            navigate("/");
        } catch (error: any) {
            toast({
                title: "Erro ao fazer login",
                description: error.message || "Verifique suas credenciais",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20">
            <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg border border-border">
                <div className="flex flex-col items-center mb-8 space-y-2">
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                        <ChefHat className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold">NutriFlow ERP</h1>
                    <p className="text-sm text-muted-foreground">Entre com suas credenciais</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="seu@email.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Senha</FormLabel>
                                        <Link
                                            to="/forgot-password"
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Esqueceu a senha?
                                        </Link>
                                    </div>
                                    <FormControl>
                                        <Input type="password" placeholder="******" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
