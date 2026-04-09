import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import NewRegistration from "./pages/NewRegistration";
import PreCadastro from "./pages/PreCadastro";
import EditarFicha from "./pages/EditarFicha";
import Clients from "./pages/Clients";
import ClienteDetalhes from "./pages/ClienteDetalhes";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AlterarSenha from "./pages/AlterarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import TesteEnvio from "./pages/TesteEnvio";
import TesteDeVersao from "./pages/TesteDeVersao";
import EditarFichaV3 from "./pages/EditarFichaV3";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route
            path="/alterar-senha"
            element={
              <ProtectedRoute>
                <AlterarSenha />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/novo"
            element={
              <ProtectedRoute>
                <NewRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pre-cadastro"
            element={
              <ProtectedRoute>
                <PreCadastro />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editar-ficha/:id"
            element={
              <ProtectedRoute>
                <EditarFicha />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cliente/:id"
            element={
              <ProtectedRoute>
                <ClienteDetalhes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teste-de-envio"
            element={
              <ProtectedRoute>
                <TesteEnvio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teste-de-versao"
            element={
              <ProtectedRoute requiredRole="master">
                <TesteDeVersao />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editar-ficha-v3/:id"
            element={
              <ProtectedRoute>
                <EditarFichaV3 />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
