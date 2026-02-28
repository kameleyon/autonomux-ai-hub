import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import DashboardLayout from "./components/DashboardLayout";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import AgentDetail from "./pages/AgentDetail";
import DeployWizard from "./pages/DeployWizard";
import Pricing from "./pages/Pricing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Overview from "./pages/dashboard/Overview";
import MyAgents from "./pages/dashboard/MyAgents";
import RunHistory from "./pages/dashboard/RunHistory";
import Billing from "./pages/dashboard/Billing";
import Credentials from "./pages/dashboard/Credentials";
import DashboardSettings from "./pages/dashboard/DashboardSettings";
import Analytics from "./pages/dashboard/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/:slug" element={<AgentDetail />} />
                <Route path="/deploy/:agentId" element={
                  <ProtectedRoute><DeployWizard /></ProtectedRoute>
                } />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
              </Route>
              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Overview />} />
                <Route path="/dashboard/agents" element={<MyAgents />} />
                <Route path="/dashboard/runs" element={<RunHistory />} />
                <Route path="/dashboard/analytics" element={<Analytics />} />
                <Route path="/dashboard/billing" element={<Billing />} />
                <Route path="/dashboard/credentials" element={<Credentials />} />
                <Route path="/dashboard/settings" element={<DashboardSettings />} />
              </Route>
              <Route element={<Layout />}>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
