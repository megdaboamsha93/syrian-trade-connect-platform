
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Header from "./components/Header";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import BusinessDetail from "./pages/BusinessDetail";
import Messages from "./pages/Messages";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompleteProfile from "./pages/CompleteProfile";
import RegisterBusiness from "./pages/RegisterBusiness";
import MyBusiness from "./pages/MyBusiness";
import Analytics from "./pages/Analytics";
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
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/business/:id" element={<BusinessDetail />} />
                  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                  <Route path="/messages/new/:businessId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
                  <Route path="/register-business" element={<ProtectedRoute><RegisterBusiness /></ProtectedRoute>} />
                  <Route path="/my-business" element={<ProtectedRoute><MyBusiness /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
