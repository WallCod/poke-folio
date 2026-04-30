import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { BackToTop } from "@/components/BackToTop";
import Landing from "./pages/Landing.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Collection from "./pages/Collection.tsx";
import Catalog from "./pages/Catalog.tsx";
import Prices from "./pages/Prices.tsx";
import Profile from "./pages/Profile.tsx";
import Pricing from "./pages/Pricing.tsx";
import NotFound from "./pages/NotFound.tsx";

import { AdminGuard } from "./admin/AdminGuard";
import { AdminLayout } from "./admin/AdminLayout";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminForgotPassword from "./admin/pages/AdminForgotPassword";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminPlans from "./admin/pages/AdminPlans";
import AdminSettings from "./admin/pages/AdminSettings";

const queryClient = new QueryClient();

const ConditionalBackToTop = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return <BackToTop />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/prices" element={<Prices />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin area — fully separate */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          <Route element={<AdminGuard />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/plans" element={<AdminPlans />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ConditionalBackToTop />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
