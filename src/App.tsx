import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import SelectUnidadePage from "@/pages/SelectUnidadePage";
import DashboardPage from "@/pages/DashboardPage";
import CriarFichaPage from "@/pages/CriarFichaPage";
import FichaDetalhePage from "@/pages/FichaDetalhePage";
import ClientesPage from "@/pages/ClientesPage";
import ClienteDetalhePage from "@/pages/ClienteDetalhePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/select-unidade"
                element={
                  <ProtectedRoute>
                    <SelectUnidadePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute requireUnidade>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fichas/nova"
                element={
                  <ProtectedRoute requireUnidade>
                    <CriarFichaPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fichas/:id"
                element={
                  <ProtectedRoute requireUnidade>
                    <FichaDetalhePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute requireUnidade>
                    <ClientesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes/:id"
                element={
                  <ProtectedRoute requireUnidade>
                    <ClienteDetalhePage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster
            position="top-center"
            toastOptions={{
              classNames: {
                toast: "bg-card text-card-foreground border border-border shadow-lg",
                error: "border-destructive",
                success: "border-success",
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
