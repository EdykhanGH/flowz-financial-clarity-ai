import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { analyticsService } from '@/services/AnalyticsService';
import { format, subDays, subMonths } from 'date-fns';

export interface AnalyticsData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  netProfitMargin: number;
  grossProfit: number;
  grossProfitMargin: number;
  fixedCosts: number;
  variableCosts: number;
  directCosts: number;
  indirectCosts: number;
  contributionMargin: number;
  breakEvenDays: number;
  breakEvenAmount: number;
  marginOfSafetyDays: number;
  marginOfSafetyAmount: number;
}

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  costCenterId?: string;
  profitCenterId?: string;
}

export const useBusinessAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const enhancedAnalytics = useEnhancedAnalytics();

  const calculateAnalytics = async (filters: FilterOptions = {}) => {
    if (!user) return;

    setLoading(true);
    try {
      // Use enhanced analytics data
      const aggregated = enhancedAnalytics.aggregatedAnalytics;
      
      if (aggregated) {
        const analyticsData: AnalyticsData = {
          totalRevenue: aggregated.totalRevenue,
          totalExpenses: aggregated.totalExpenses,
          netProfit: aggregated.netProfit,
          netProfitMargin: aggregated.netProfitMargin,
          grossProfit: aggregated.grossProfit,
          grossProfitMargin: aggregated.grossProfitMargin,
          fixedCosts: aggregated.fixedCosts,
          variableCosts: aggregated.variableCosts,
          directCosts: aggregated.directCosts,
          indirectCosts: aggregated.indirectCosts,
          contributionMargin: aggregated.contributionMargin,
          breakEvenDays: aggregated.breakEvenDays,
          breakEvenAmount: aggregated.fixedCosts, // Using fixed costs as break-even amount
          marginOfSafetyDays: aggregated.marginOfSafetyDays,
          marginOfSafetyAmount: aggregated.marginOfSafety
        };
        
        setAnalytics(analyticsData);
      }

      // Generate analytics for last 3 months if none exist
      if (enhancedAnalytics.analyticsMetrics.length === 0) {
        const endDate = new Date();
        const startDate = subMonths(endDate, 3);
        await enhancedAnalytics.generateAnalytics({ startDate, endDate });
      }
      
    } catch (error: any) {
      console.error('Error calculating analytics:', error);
      toast({
        title: "Error",
        description: "Failed to calculate analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateAnalytics();
  }, [user, enhancedAnalytics.aggregatedAnalytics]);

  // Refresh analytics data on component mount
  useEffect(() => {
    const refreshData = async () => {
      if (user) {
        try {
          await analyticsService.refreshAnalyticsData(user.id);
        } catch (error) {
          console.error('Error refreshing analytics:', error);
        }
      }
    };
    
    refreshData();
  }, [user]);

  return {
    analytics,
    loading: loading || enhancedAnalytics.isLoading,
    calculateAnalytics,
    enhancedAnalytics
  };
};