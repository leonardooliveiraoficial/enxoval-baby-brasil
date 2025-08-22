import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Enxoval from "./pages/Enxoval";
import Story from "./pages/Story";
import Messages from "./pages/Messages";
import { ThankYou } from "./pages/ThankYou";
import Auth from "./pages/Auth";
import Sucesso from "./pages/Sucesso";
import Erro from "./pages/Erro";
import Pendente from "./pages/Pendente";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "@/components/admin/AdminLayout";

// Lazy load admin pages for better performance
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminTransactions = lazy(() => import("./pages/admin/AdminTransactions"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/enxoval" element={<Enxoval />} />
                <Route path="/nossa-historia" element={<Story />} />
                <Route path="/mensagens" element={<Messages />} />
                <Route path="/obrigado" element={<ThankYou />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Mercado Pago Checkout Routes */}
                <Route path="/sucesso" element={<Sucesso />} />
                <Route path="/erro" element={<Erro />} />
                <Route path="/pendente" element={<Pendente />} />
                
                {/* Admin Routes - Lazy Loaded */}
                <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
                <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
                <Route path="/admin/categories" element={<AdminLayout><AdminCategories /></AdminLayout>} />
                <Route path="/admin/content" element={<AdminLayout><AdminContent /></AdminLayout>} />
                <Route path="/admin/transactions" element={<AdminLayout><AdminTransactions /></AdminLayout>} />
                <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
                <Route path="/admin/story" element={<AdminLayout><AdminContent /></AdminLayout>} />
                <Route path="/admin/thankyou-template" element={<AdminLayout><AdminContent /></AdminLayout>} />
                <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
                <Route path="/admin/messages" element={<AdminLayout><AdminContent /></AdminLayout>} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
