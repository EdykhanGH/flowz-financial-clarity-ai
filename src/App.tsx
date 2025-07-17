
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
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

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
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
