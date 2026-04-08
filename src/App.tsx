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
import TesteEnvio from "./pages/TesteEnvio";
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
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
