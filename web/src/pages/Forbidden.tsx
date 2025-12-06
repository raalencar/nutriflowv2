import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Forbidden() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-6 max-w-md px-4">
                <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-destructive/10">
                        <ShieldAlert className="h-12 w-12 text-destructive" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter">Acesso Negado</h1>
                    <p className="text-muted-foreground">
                        Você não tem permissão para acessar esta página. Entre em contato com seu administrador se acredita que isso é um erro.
                    </p>
                </div>

                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Voltar
                    </Button>
                    <Button onClick={() => navigate("/")}>
                        Ir para Início
                    </Button>
                </div>
            </div>
        </div>
    );
}
