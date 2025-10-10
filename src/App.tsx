
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import BusinessDetail from "./pages/BusinessDetail";
import Messages from "./pages/Messages";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import CompleteProfile from "./pages/CompleteProfile";
import RegisterBusiness from "./pages/RegisterBusiness";
import MyBusiness from "./pages/MyBusiness";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import RFQBoard from './pages/RFQBoard';
import RFQs from './pages/RFQs';
import RFQMarketplace from './pages/RFQMarketplace';
import Orders from './pages/Orders';
import LogisticsMarketplace from './pages/LogisticsMarketplace';
import MyLogistics from './pages/MyLogistics';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/business/:id" element={<BusinessDetail />} />
                <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/messages/new/:businessId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<ProtectedRoute><VerifyEmail /></ProtectedRoute>} />
                <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
                <Route path="/register-business" element={<ProtectedRoute><RegisterBusiness /></ProtectedRoute>} />
                <Route path="/my-business" element={<ProtectedRoute><MyBusiness /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/rfqs" element={<ProtectedRoute><RFQs /></ProtectedRoute>} />
                <Route path="/rfq-board" element={<RFQBoard />} />
                <Route path="/rfq-marketplace" element={<RFQMarketplace />} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/logistics" element={<LogisticsMarketplace />} />
                <Route path="/my-logistics" element={<ProtectedRoute><MyLogistics /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
