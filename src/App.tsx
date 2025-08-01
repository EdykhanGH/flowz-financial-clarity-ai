
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import CheckEmail from "./pages/CheckEmail";
import ProtectedRoute from "./components/ProtectedRoute";
import OnboardingCheck from "./components/OnboardingCheck";
import ErrorBoundary from "./components/ErrorBoundary";

console.log('App.tsx: React version check', React.version);
console.log('App.tsx: React hooks check', { useState: React.useState, useEffect: React.useEffect });

const queryClient = new QueryClient();

// Component to handle auth redirects
const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle auth callback from email verification
    const handleAuthCallback = async () => {
      try {
        // This will process the tokens from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          return;
        }

        if (data.session?.user) {
          console.log('User authenticated via callback, redirecting to dashboard');
          // Clear the URL hash and navigate to dashboard
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Auth callback handling error:', err);
      }
    };

    // Check if we have auth hash parameters
    if (location.hash.includes('access_token') || location.hash.includes('refresh_token') || location.hash.includes('type=signup')) {
      console.log('Detected auth tokens in URL, processing...');
      handleAuthCallback();
    }
  }, [navigate, location]);

  return null;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthHandler />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/check-email" element={<CheckEmail />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <OnboardingCheck>
                      <Dashboard />
                    </OnboardingCheck>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
