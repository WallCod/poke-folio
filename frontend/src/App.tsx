import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { BackToTop } from "@/components/BackToTop";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AppModal } from "@/components/AppModal";
import { GlobalBackground } from "@/components/GlobalBackground";
import { AuthModal } from "@/components/AuthModal";
import { useRef } from "react";
import Landing from "./pages/Landing.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Collection from "./pages/Collection.tsx";
import Catalog from "./pages/Catalog.tsx";
import Prices from "./pages/Prices.tsx";
import Profile from "./pages/Profile.tsx";
import Pricing from "./pages/Pricing.tsx";
import GuiaTcg from "./pages/GuiaTcg.tsx";
import Sobre from "./pages/Sobre.tsx";
import NotFound from "./pages/NotFound.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import Sets from "./pages/Sets.tsx";
import SetDetail from "./pages/SetDetail.tsx";

import { AdminRoute } from "./admin/AdminRoute";
import { AdminLayout } from "./admin/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminPlans from "./admin/pages/AdminPlans";
import AdminSettings from "./admin/pages/AdminSettings";
import AdminPayments from "./admin/pages/AdminPayments";

const queryClient = new QueryClient();

const ConditionalBackToTop = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return <BackToTop />;
};

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const key = useRef(0);
  const prev = useRef(pathname);
  if (prev.current !== pathname) {
    key.current += 1;
    prev.current = pathname;
  }
  return (
    <div key={key.current} className="animate-fade-in contents">
      {children}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-left" />
      <AppModal />
      <GlobalBackground />
      <AuthModal />
      <BrowserRouter>
        <ScrollToTop />
        <PageTransition>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/sets" element={<Sets />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/guia-tcg" element={<GuiaTcg />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/sets/:setId" element={<SetDetail />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/prices" element={<Prices />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin area — protected via AdminRoute (reads unified session) */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/plans" element={<AdminPlans />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </PageTransition>
        <ConditionalBackToTop />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
