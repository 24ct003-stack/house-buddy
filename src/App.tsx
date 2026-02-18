import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import NotFound from "./pages/NotFound";

import { OwnerDashboard, OwnerProperties, OwnerApplications, OwnerPayments, OwnerMaintenance } from "./pages/OwnerDashboard";
import { TenantDashboard, TenantApplications, TenantPayments, TenantMaintenance } from "./pages/TenantDashboard";
import { AdminDashboard, AdminUsers, AdminProperties, AdminApplications } from "./pages/AdminDashboard";

const queryClient = new QueryClient();

// Pages that don't show the Navbar (have their own layout)
const DASHBOARD_PATHS = ["/owner", "/tenant", "/admin"];

function AppRoutes() {
  const path = window.location.pathname;
  const isDashboard = DASHBOARD_PATHS.some(p => path.startsWith(p));

  return (
    <>
      {!isDashboard && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />

        {/* Owner routes */}
        <Route path="/owner" element={<ProtectedRoute allowedRoles={["owner"]}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/owner/properties" element={<ProtectedRoute allowedRoles={["owner"]}><OwnerProperties /></ProtectedRoute>} />
        <Route path="/owner/applications" element={<ProtectedRoute allowedRoles={["owner"]}><OwnerApplications /></ProtectedRoute>} />
        <Route path="/owner/payments" element={<ProtectedRoute allowedRoles={["owner"]}><OwnerPayments /></ProtectedRoute>} />
        <Route path="/owner/maintenance" element={<ProtectedRoute allowedRoles={["owner"]}><OwnerMaintenance /></ProtectedRoute>} />

        {/* Tenant routes */}
        <Route path="/tenant" element={<ProtectedRoute allowedRoles={["tenant"]}><TenantDashboard /></ProtectedRoute>} />
        <Route path="/tenant/applications" element={<ProtectedRoute allowedRoles={["tenant"]}><TenantApplications /></ProtectedRoute>} />
        <Route path="/tenant/payments" element={<ProtectedRoute allowedRoles={["tenant"]}><TenantPayments /></ProtectedRoute>} />
        <Route path="/tenant/maintenance" element={<ProtectedRoute allowedRoles={["tenant"]}><TenantMaintenance /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/properties" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProperties /></ProtectedRoute>} />
        <Route path="/admin/applications" element={<ProtectedRoute allowedRoles={["admin"]}><AdminApplications /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
