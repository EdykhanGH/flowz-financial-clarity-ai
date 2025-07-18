import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export interface AnalyticsMetrics {
  id: string;
  user_id: string;
  metric_date: string;
  total_revenue: number;
  total_expenses: number;
  gross_profit: number;
  net_profit: number;
  fixed_costs: number;
  variable_costs: number;
  direct_costs: number;
  indirect_costs: number;
  transaction_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductPerformance {
  id: string;
  user_id: string;
  product_id: string;
  period_start: string;
  period_end: string;
  units_sold: number;
  total_revenue: number;
  total_costs: number;
  gross_profit: number;
  avg_selling_price: number;
  avg_cost_price: number;
  inventory_turnover: number;
  created_at: string;
  updated_at: string;
  product?: {
    name: string;
    category: string;
    standard_price: number;
    standard_cost: number;
  };
}

export interface CostCenterPerformance {
  id: string;
  user_id: string;
  cost_center_id: string;
  period_start: string;
  period_end: string;
  total_costs: number;
  transaction_count: number;
  avg_cost_per_transaction: number;
  budget_allocated: number;
  budget_utilized: number;
  variance_amount: number;
  variance_percentage: number;
  created_at: string;
  updated_at: string;
  cost_center?: {
    name: string;
    category_type: string;
  };
}

export interface DateFilter {
  startDate?: Date;
  endDate?: Date;
}

export const useEnhancedAnalytics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState<DateFilter>({});

  // Fetch analytics metrics
  const { data: analyticsMetrics = [], isLoading: isLoadingMetrics, error: metricsError } = useQuery({
    queryKey: ['analyticsMetrics', user?.id, dateFilter],
    queryFn: async (): Promise<AnalyticsMetrics[]> => {
      if (!user) return [];

      let query = supabase
        .from('analytics_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('metric_date', { ascending: false });

      if (dateFilter.startDate) {
        query = query.gte('metric_date', format(dateFilter.startDate, 'yyyy-MM-dd'));
      }
      if (dateFilter.endDate) {
        query = query.lte('metric_date', format(dateFilter.endDate, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch product performance
  const { data: productPerformance = [], isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['productPerformance', user?.id, dateFilter],
    queryFn: async (): Promise<ProductPerformance[]> => {
      if (!user) return [];

      let query = supabase
        .from('product_performance')
        .select(`
          *,
          product:products(name, category, standard_price, standard_cost)
        `)
        .eq('user_id', user.id)
        .order('total_revenue', { ascending: false });

      if (dateFilter.startDate) {
        query = query.gte('period_start', format(dateFilter.startDate, 'yyyy-MM-dd'));
      }
      if (dateFilter.endDate) {
        query = query.lte('period_end', format(dateFilter.endDate, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch cost center performance
  const { data: costCenterPerformance = [], isLoading: isLoadingCostCenters, error: costCentersError } = useQuery({
    queryKey: ['costCenterPerformance', user?.id, dateFilter],
    queryFn: async (): Promise<CostCenterPerformance[]> => {
      if (!user) return [];

      let query = supabase
        .from('cost_center_performance')
        .select(`
          *,
          cost_center:cost_centers(name, category_type)
        `)
        .eq('user_id', user.id)
        .order('total_costs', { ascending: false });

      if (dateFilter.startDate) {
        query = query.gte('period_start', format(dateFilter.startDate, 'yyyy-MM-dd'));
      }
      if (dateFilter.endDate) {
        query = query.lte('period_end', format(dateFilter.endDate, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate aggregated analytics - optimized to prevent excessive recalculations
  const aggregatedAnalytics = useMemo(() => {
    if (!analyticsMetrics || analyticsMetrics.length === 0) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        grossProfit: 0,
        netProfit: 0,
        fixedCosts: 0,
        variableCosts: 0,
        directCosts: 0,
        indirectCosts: 0,
        transactionCount: 0,
        grossProfitMargin: 0,
        netProfitMargin: 0,
        contributionMargin: 0,
        contributionMarginRatio: 0,
        breakEvenDays: 0,
        marginOfSafety: 0,
        marginOfSafetyDays: 0
      };
    }

    const totals = {
      totalRevenue: 0,
      totalExpenses: 0,
      grossProfit: 0,
      netProfit: 0,
      fixedCosts: 0,
      variableCosts: 0,
      directCosts: 0,
      indirectCosts: 0,
      transactionCount: 0
    };

    // Single loop for better performance
    for (const metric of analyticsMetrics) {
      totals.totalRevenue += Number(metric.total_revenue || 0);
      totals.totalExpenses += Number(metric.total_expenses || 0);
      totals.grossProfit += Number(metric.gross_profit || 0);
      totals.netProfit += Number(metric.net_profit || 0);
      totals.fixedCosts += Number(metric.fixed_costs || 0);
      totals.variableCosts += Number(metric.variable_costs || 0);
      totals.directCosts += Number(metric.direct_costs || 0);
      totals.indirectCosts += Number(metric.indirect_costs || 0);
      totals.transactionCount += Number(metric.transaction_count || 0);
    }

    // Calculate derived metrics
    const grossProfitMargin = totals.totalRevenue > 0 ? (totals.grossProfit / totals.totalRevenue) * 100 : 0;
    const netProfitMargin = totals.totalRevenue > 0 ? (totals.netProfit / totals.totalRevenue) * 100 : 0;
    const contributionMargin = totals.totalRevenue - totals.variableCosts;
    const contributionMarginRatio = totals.totalRevenue > 0 ? (contributionMargin / totals.totalRevenue) * 100 : 0;
    
    // Break-even analysis
    const avgDailyRevenue = totals.totalRevenue / Math.max(1, analyticsMetrics.length);
    const breakEvenDays = avgDailyRevenue > 0 ? totals.fixedCosts / avgDailyRevenue : 0;
    const marginOfSafety = totals.totalRevenue - totals.fixedCosts;
    const marginOfSafetyDays = avgDailyRevenue > 0 ? marginOfSafety / avgDailyRevenue : 0;

    return {
      ...totals,
      grossProfitMargin,
      netProfitMargin,
      contributionMargin,
      contributionMarginRatio,
      breakEvenDays,
      marginOfSafety,
      marginOfSafetyDays
    };
  }, [analyticsMetrics]);

  // Calculate trends (comparing current period to previous period)
  const analyticsTrends = useMemo(() => {
    if (analyticsMetrics.length < 2) return null;

    const currentPeriod = analyticsMetrics.slice(0, Math.floor(analyticsMetrics.length / 2));
    const previousPeriod = analyticsMetrics.slice(Math.floor(analyticsMetrics.length / 2));

    const currentTotals = currentPeriod.reduce((acc, metric) => {
      acc.revenue += Number(metric.total_revenue);
      acc.expenses += Number(metric.total_expenses);
      acc.profit += Number(metric.net_profit);
      return acc;
    }, { revenue: 0, expenses: 0, profit: 0 });

    const previousTotals = previousPeriod.reduce((acc, metric) => {
      acc.revenue += Number(metric.total_revenue);
      acc.expenses += Number(metric.total_expenses);
      acc.profit += Number(metric.net_profit);
      return acc;
    }, { revenue: 0, expenses: 0, profit: 0 });

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      revenueGrowth: calculateTrend(currentTotals.revenue, previousTotals.revenue),
      expenseGrowth: calculateTrend(currentTotals.expenses, previousTotals.expenses),
      profitGrowth: calculateTrend(currentTotals.profit, previousTotals.profit),
    };
  }, [analyticsMetrics]);

  // Generate missing analytics for empty days
  const generateAnalyticsMutation = useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate: Date; endDate: Date }) => {
      if (!user) throw new Error('User not authenticated');

      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      for (const day of days) {
        const dateStr = format(day, 'yyyy-MM-dd');
        
        // Check if analytics already exist for this date
        const { data: existing } = await supabase
          .from('analytics_metrics')
          .select('id')
          .eq('user_id', user.id)
          .eq('metric_date', dateStr)
          .single();

        if (!existing) {
          // Get transactions for this date
          const { data: transactions } = await supabase
            .from('transactions')
            .select(`
              *,
              transaction_classifications(cost_type, cost_nature)
            `)
            .eq('user_id', user.id)
            .eq('date', dateStr);

          if (transactions && transactions.length > 0) {
            const revenue = transactions
              .filter(t => t.type === 'income')
              .reduce((sum, t) => sum + Number(t.amount), 0);

            const expenses = transactions
              .filter(t => t.type === 'expense')
              .reduce((sum, t) => sum + Number(t.amount), 0);

            const fixedCosts = transactions
              .filter(t => t.type === 'expense' && t.transaction_classifications?.[0]?.cost_type === 'fixed')
              .reduce((sum, t) => sum + Number(t.amount), 0);

            const variableCosts = transactions
              .filter(t => t.type === 'expense' && t.transaction_classifications?.[0]?.cost_type === 'variable')
              .reduce((sum, t) => sum + Number(t.amount), 0);

            const directCosts = transactions
              .filter(t => t.type === 'expense' && t.transaction_classifications?.[0]?.cost_nature === 'direct')
              .reduce((sum, t) => sum + Number(t.amount), 0);

            const indirectCosts = transactions
              .filter(t => t.type === 'expense' && t.transaction_classifications?.[0]?.cost_nature === 'indirect')
              .reduce((sum, t) => sum + Number(t.amount), 0);

            await supabase
              .from('analytics_metrics')
              .insert({
                user_id: user.id,
                metric_date: dateStr,
                total_revenue: revenue,
                total_expenses: expenses,
                gross_profit: revenue - directCosts,
                net_profit: revenue - expenses,
                fixed_costs: fixedCosts,
                variable_costs: variableCosts,
                direct_costs: directCosts,
                indirect_costs: indirectCosts,
                transaction_count: transactions.length
              });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyticsMetrics'] });
      toast({
        title: "Success",
        description: "Analytics generated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error generating analytics:', error);
      toast({
        title: "Error",
        description: "Failed to generate analytics",
        variant: "destructive"
      });
    }
  });

  const isLoading = isLoadingMetrics || isLoadingProducts || isLoadingCostCenters;
  const error = metricsError || productsError || costCentersError;

  return {
    // Data
    analyticsMetrics,
    productPerformance,
    costCenterPerformance,
    aggregatedAnalytics,
    analyticsTrends,
    
    // State
    isLoading,
    error,
    dateFilter,
    setDateFilter,
    
    // Actions
    generateAnalytics: generateAnalyticsMutation.mutate,
    isGeneratingAnalytics: generateAnalyticsMutation.isPending,
  };
};