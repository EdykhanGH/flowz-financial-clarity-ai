import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

  const calculateAnalytics = async (filters: FilterOptions = {}) => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters.costCenterId) {
        query = query.eq('cost_center_id', filters.costCenterId);
      }
      if (filters.profitCenterId) {
        query = query.eq('profit_center_id', filters.profitCenterId);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;

      // Calculate analytics
      const revenues = transactions?.filter(t => t.type === 'income') || [];
      const expenses = transactions?.filter(t => t.type === 'expense') || [];

      const totalRevenue = revenues.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
      const netProfit = totalRevenue - totalExpenses;
      const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Cost analysis
      const fixedCosts = expenses
        .filter(t => t.cost_nature === 'fixed')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const variableCosts = expenses
        .filter(t => t.cost_nature === 'variable')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const directCosts = expenses
        .filter(t => t.cost_type === 'direct')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const indirectCosts = expenses
        .filter(t => t.cost_type === 'indirect')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const grossProfit = totalRevenue - directCosts;
      const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const contributionMargin = totalRevenue - variableCosts;

      // Break-even analysis (simplified)
      const avgDailyRevenue = totalRevenue / 30; // Assuming 30 days
      const breakEvenAmount = fixedCosts;
      const breakEvenDays = avgDailyRevenue > 0 ? fixedCosts / avgDailyRevenue : 0;

      // Margin of safety
      const marginOfSafetyAmount = totalRevenue - breakEvenAmount;
      const marginOfSafetyDays = avgDailyRevenue > 0 ? marginOfSafetyAmount / avgDailyRevenue : 0;

      const analyticsData: AnalyticsData = {
        totalRevenue,
        totalExpenses,
        netProfit,
        netProfitMargin,
        grossProfit,
        grossProfitMargin,
        fixedCosts,
        variableCosts,
        directCosts,
        indirectCosts,
        contributionMargin,
        breakEvenDays,
        breakEvenAmount,
        marginOfSafetyDays,
        marginOfSafetyAmount
      };

      setAnalytics(analyticsData);
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
  }, [user]);

  return {
    analytics,
    loading,
    calculateAnalytics
  };
};