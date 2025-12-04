import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ClienteDashboard from "./pages/dashboard/ClienteDashboard";
import AdvogadoDashboard from "./pages/dashboard/AdvogadoDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import Chat from "./pages/dashboard/Chat";
import NotFound from "./pages/NotFound";

// Advogado Premium Pages
import { AdvogadoLayout } from "./components/advogado/AdvogadoLayout";
import AdvogadoHome from "./pages/advogado/AdvogadoHome";
import ClientesPage from "./pages/advogado/ClientesPage";
import ProcessosPage from "./pages/advogado/ProcessosPage";
import DocumentosPage from "./pages/advogado/DocumentosPage";
import CalculosPage from "./pages/advogado/CalculosPage";
import IAJuridicaPage from "./pages/advogado/IAJuridicaPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard/cliente" element={<ClienteDashboard />} />
              <Route path="/dashboard/advogado" element={<AdvogadoDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/chat/:casoId" element={<Chat />} />
              
              {/* Advogado Premium Routes with Sidebar */}
              <Route path="/dashboard/advogado" element={<AdvogadoLayout />}>
                <Route path="home" element={<AdvogadoHome />} />
                <Route path="clientes" element={<ClientesPage />} />
                <Route path="processos" element={<ProcessosPage />} />
                <Route path="documentos" element={<DocumentosPage />} />
                <Route path="calculos" element={<CalculosPage />} />
                <Route path="ia" element={<IAJuridicaPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
