import { SignIn } from "@clerk/clerk-react";

export default function Login() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20">
            <div className="w-full max-w-md flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">NutriFlow ERP</h1>
                    <p className="text-sm text-muted-foreground mt-2">Faça login para acessar o sistema</p>
                </div>
                <SignIn />
            </div>
        </div>
    );
}
