import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Unidades from "./pages/Unidades";
import Insumos from "./pages/Insumos";
import Receitas from "./pages/Receitas";
import Estoque from "./pages/Estoque";
import Compras from "./pages/Compras";
import Producao from "./pages/Producao";
import Colaboradores from "./pages/Colaboradores";
import Equipes from "./pages/Equipes";
import { AuthSync } from "@/components/AuthSync";
import Forbidden from "./pages/Forbidden";
import NotFound from "./pages/NotFound";
import { RoleGuard } from "@/components/RoleGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={
            <SignedOut>
              <Login />
            </SignedOut>
          } />
          <Route path="/*" element={
            <>
              <SignedIn>
                <AuthSync />
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/unidades" element={<Unidades />} />
                    <Route path="/insumos" element={<Insumos />} />
                    <Route path="/receitas" element={<Receitas />} />
                    <Route path="/estoque" element={<Estoque />} />
                    <Route path="/compras" element={<Compras />} />
                    <Route path="/producao" element={<Producao />} />
                    <Route path="/colaboradores" element={
                      <RoleGuard allowedRoles={['admin', 'manager']} redirectTo="/forbidden" showForbidden={true}>
                        <Colaboradores />
                      </RoleGuard>
                    } />
                    <Route path="/equipes" element={
                      <RoleGuard allowedRoles={['admin']} redirectTo="/forbidden" showForbidden={true}>
                        <Equipes />
                      </RoleGuard>
                    } />
                    <Route path="/forbidden" element={<Forbidden />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </SignedIn>
              <SignedOut>
                <Navigate to="/login" replace />
              </SignedOut>
            </>
          } />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
