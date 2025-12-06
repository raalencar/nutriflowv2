import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Unidades from "./pages/Unidades";
import Insumos from "./pages/Insumos";
import Receitas from "./pages/Receitas";
import Estoque from "./pages/Estoque";
import Compras from "./pages/Compras";
import Producao from "./pages/Producao";
import Colaboradores from "./pages/Colaboradores";
import Equipes from "./pages/Equipes";
import Forbidden from "./pages/Forbidden";
import NotFound from "./pages/NotFound";
import { RoleGuard } from "@/components/RoleGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route path="/*" element={
              <PrivateRoute>
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
              </PrivateRoute>
            } />
            {/* Catch all for unauthenticated trying to access root logic is handled by PrivateRoute above if nested, 
                 but for flat routes outside: */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
