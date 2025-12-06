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
import { forgotPassword } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

const forgotPasswordSchema = z.object({
    email: z.string().email("Email inválido"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        setIsLoading(true);
        try {
            await forgotPassword(data.email);
            setIsSent(true);
            toast({ title: "Email de recuperação enviado!" });
        } catch (error: any) {
            toast({
                title: "Erro ao enviar solicitacão",
                description: error.message || "Tente novamente mais tarde",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20">
            <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg border border-border">
                <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Login
                </Link>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold">Recuperar Senha</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Digite seu email para receber o link de redefinição.
                    </p>
                </div>

                {isSent ? (
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm">
                            Um email foi enviado para <strong>{form.getValues("email")}</strong> com as instruções.
                        </p>
                        <Button variant="outline" className="w-full" onClick={() => setIsSent(false)}>
                            Enviar novamente
                        </Button>
                    </div>
                ) : (
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
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar Link
                            </Button>
                        </form>
                    </Form>
                )}
            </div>
        </div>
    );
}
