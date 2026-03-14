import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CRMProvider } from "@/contexts/CRMContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageGuard } from "@/components/auth/PageGuard";
import { Login } from "@/pages/auth/Login";
import { Signup } from "@/pages/auth/Signup";
import { ForgotPassword } from "@/pages/auth/ForgotPassword";
import { ResetPassword } from "@/pages/auth/ResetPassword";
import { ClientDashboard } from "@/pages/clients/ClientDashboard";
import { NewClient } from "@/pages/clients/NewClient";
import { EditClient } from "@/pages/clients/EditClient";
import { ClientDetail } from "@/pages/clients/ClientDetail";
import { CRMKanban } from "@/pages/crm/CRMKanban";
import { CRMDashboard } from "@/pages/crm/CRMDashboard";
import { NewBudget } from "@/pages/crm/NewBudget";
import { BudgetDetail } from "@/pages/crm/BudgetDetail";
import { ServiceCategories } from "@/pages/crm/ServiceCategories";
import { UsersPage } from "@/pages/users/UsersPage";
import { ServiceItemsPage } from "@/pages/crm/ServiceItemsPage";
import { ProspectionPage } from "@/pages/prospection/ProspectionPage";
import { AboutPage } from "@/pages/about/AboutPage";
import { ProspectionProvider } from "@/contexts/ProspectionContext";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CRMProvider>
            <ProspectionProvider>
            <Routes>
              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                {/* Redirect root to clients dashboard */}
                <Route path="/" element={<Navigate to="/crm" replace />} />
                
                {/* App routes with sidebar layout */}
                <Route element={<AppLayout />}>
                  {/* Prospecção */}
                  <Route path="/prospeccao" element={<PageGuard pageKey="prospeccao"><ProspectionPage /></PageGuard>} />
                  
                  {/* Clients */}
                  <Route path="/clientes" element={<PageGuard pageKey="clientes"><ClientDashboard /></PageGuard>} />
                  <Route path="/clientes/novo" element={<PageGuard pageKey="clientes"><NewClient /></PageGuard>} />
                  <Route path="/clientes/:id" element={<PageGuard pageKey="clientes"><ClientDetail /></PageGuard>} />
                  <Route path="/clientes/:id/editar" element={<PageGuard pageKey="clientes"><EditClient /></PageGuard>} />
                  
                  {/* CRM */}
                  <Route path="/crm" element={<PageGuard pageKey="crm"><CRMKanban /></PageGuard>} />
                  <Route path="/crm/dashboard" element={<PageGuard pageKey="crm"><CRMDashboard /></PageGuard>} />
                  <Route path="/crm/orcamento/novo" element={<PageGuard pageKey="crm"><NewBudget /></PageGuard>} />
                  <Route path="/crm/orcamento/:id" element={<PageGuard pageKey="crm"><BudgetDetail /></PageGuard>} />
                  
                  {/* Service Categories */}
                  <Route path="/categorias" element={<PageGuard pageKey="categorias"><ServiceCategories /></PageGuard>} />
                  
                  {/* Service Items */}
                  <Route path="/itens-servico" element={<PageGuard pageKey="itens-servico"><ServiceItemsPage /></PageGuard>} />
                  
                  {/* Users */}
                  <Route path="/usuarios" element={<PageGuard pageKey="usuarios"><UsersPage /></PageGuard>} />
                  
                  {/* About */}
                  <Route path="/sobre" element={<AboutPage />} />
                </Route>
              </Route>
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </ProspectionProvider>
          </CRMProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
