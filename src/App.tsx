
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
        console.log('Processing auth callback from URL hash');
        
        // Check if this is a signup confirmation
        const isSignupConfirmation = location.hash.includes('type=signup');
        
        // Get the current session after the auth callback
        const { data: sessionData, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          // Clear the hash and redirect to login on error
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/login', { replace: true });
          return;
        }

        if (sessionData.session?.user) {
          console.log('User authenticated via callback');
          // Clear the URL hash
          window.history.replaceState(null, '', window.location.pathname);
          
          if (isSignupConfirmation) {
            // For new signups, redirect to onboarding
            console.log('Redirecting new user to onboarding');
            navigate('/onboarding', { replace: true });
          } else {
            // For existing users, redirect to dashboard
            console.log('Redirecting existing user to dashboard');
            navigate('/dashboard', { replace: true });
          }
        } else {
          // No session, clear hash and redirect to login
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Auth callback handling error:', err);
        // Clear the hash and redirect to login on error
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/login', { replace: true });
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
