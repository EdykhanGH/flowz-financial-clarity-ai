import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTransactions } from '@/hooks/useTransactions';

export interface EnhancedAnalyticsData {
  // Financial Overview
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  grossProfit: number;
  
  // Margins
  netProfitMargin: number;
  grossProfitMargin: number;
  
  // Cost Analysis
  fixedCosts: number;
  variableCosts: number;
  directCosts: number;
  indirectCosts: number;
  
  // Break-even Analysis
  contributionMargin: number;
  breakEvenRevenue: number;
  breakEvenDays: number;
  marginOfSafetyAmount: number;
  marginOfSafetyDays: number;
  
  // Trends and Growth
  monthlyGrowthRate: number;
  revenueGrowthRate: number;
  expenseGrowthRate: number;
  
  // Product Performance
  topProducts: Array<{
    name: string;
    revenue: number;
    profit: number;
    margin: number;
    units: number;
  }>;
  
  // Category Analysis
  expenseByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  
  revenueByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  
  // Time-based Analysis
  monthlyData: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    growthRate: number;
  }>;
  
  // Cost Behavior
  costBehaviorData: Array<{
    month: string;
    fixed: number;
    variable: number;
    mixed: number;
  }>;
  
  // Variance Analysis
  budgetVariance: Array<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
    variancePercent: number;
    status: 'favorable' | 'unfavorable' | 'on-track';
  }>;
  
  // Key Performance Indicators
  kpis: {
    customerAcquisitionCost: number;
    averageTransactionValue: number;
    transactionFrequency: number;
    cashConversionCycle: number;
    workingCapitalRatio: number;
  };
}

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  costCenterId?: string;
  profitCenterId?: string;
  category?: string;
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export const useEnhancedAnalytics = (filters: FilterOptions = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const [isCalculating, setIsCalculating] = useState(false);

  // Helper functions (moved before useMemo to avoid temporal dead zone)
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const calculateCategoryBreakdown = (transactions: any[], total: number) => {
    const categoryTotals: Record<string, number> = {};
    
    transactions.forEach(t => {
      const category = t.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + Number(t.amount);
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const calculateProductPerformance = (transactions: any[]) => {
    const productData: Record<string, {
      revenue: number;
      costs: number;
      units: number;
    }> = {};

    transactions.forEach(t => {
      const product = t.product_name || 'Other';
      if (!productData[product]) {
        productData[product] = { revenue: 0, costs: 0, units: 0 };
      }

      if (t.type === 'income') {
        productData[product].revenue += Number(t.amount);
        productData[product].units += t.quantity || 1;
      } else if (t.type === 'expense' && t.cost_type === 'direct') {
        productData[product].costs += Number(t.amount);
      }
    });

    return Object.entries(productData)
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        profit: data.revenue - data.costs,
        margin: data.revenue > 0 ? ((data.revenue - data.costs) / data.revenue) * 100 : 0,
        units: data.units
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);
  };

  const calculateMonthlyData = (transactions: any[]) => {
    const monthlyTotals: Record<string, {
      revenue: number;
      expenses: number;
    }> = {};

    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = { revenue: 0, expenses: 0 };
      }

      if (t.type === 'income') {
        monthlyTotals[monthKey].revenue += Number(t.amount);
      } else {
        monthlyTotals[monthKey].expenses += Number(t.amount);
      }
    });

    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, data], index, array) => {
        const profit = data.revenue - data.expenses;
        const prevProfit = index > 0 ? array[index - 1][1].revenue - array[index - 1][1].expenses : profit;
        const growthRate = prevProfit > 0 ? ((profit - prevProfit) / prevProfit) * 100 : 0;

        return {
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: data.revenue,
          expenses: data.expenses,
          profit,
          growthRate
        };
      });
  };

  const calculateCostBehaviorData = (expenses: any[]) => {
    const monthlyData: Record<string, {
      fixed: number;
      variable: number;
      mixed: number;
    }> = {};

    expenses.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { fixed: 0, variable: 0, mixed: 0 };
      }

      const amount = Number(t.amount);
      switch (t.cost_nature) {
        case 'fixed':
          monthlyData[monthKey].fixed += amount;
          break;
        case 'variable':
          monthlyData[monthKey].variable += amount;
          break;
        default:
          monthlyData[monthKey].mixed += amount;
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        ...data
      }));
  };

  const calculateGrowthRates = (monthlyData: any[]) => {
    if (monthlyData.length < 2) {
      return { monthlyGrowthRate: 0, revenueGrowthRate: 0, expenseGrowthRate: 0 };
    }

    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];

    const monthlyGrowthRate = previous.profit > 0 ? 
      ((current.profit - previous.profit) / previous.profit) * 100 : 0;
    
    const revenueGrowthRate = previous.revenue > 0 ? 
      ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0;
    
    const expenseGrowthRate = previous.expenses > 0 ? 
      ((current.expenses - previous.expenses) / previous.expenses) * 100 : 0;

    return { monthlyGrowthRate, revenueGrowthRate, expenseGrowthRate };
  };

  const calculateKPIs = (transactions: any[]) => {
    const revenues = transactions.filter(t => t.type === 'income');
    const uniqueCustomers = new Set(revenues.map(t => t.description)).size;
    const totalTransactions = revenues.length;
    
    return {
      customerAcquisitionCost: 0, // Would need marketing expense data
      averageTransactionValue: totalTransactions > 0 ? revenues.reduce((sum, t) => sum + Number(t.amount), 0) / totalTransactions : 0,
      transactionFrequency: uniqueCustomers > 0 ? totalTransactions / uniqueCustomers : 0,
      cashConversionCycle: 0, // Would need accounts receivable/payable data
      workingCapitalRatio: 0, // Would need balance sheet data
    };
  };

  // Calculate analytics data
  const analyticsData = useMemo((): EnhancedAnalyticsData | null => {
    if (!transactions.length) return null;

    setIsCalculating(true);

    try {
      // Apply filters
      const filteredTransactions = transactions.filter(transaction => {
        // Date filters
        if (filters.startDate && transaction.date < filters.startDate) return false;
        if (filters.endDate && transaction.date > filters.endDate) return false;
        if (filters.costCenterId && transaction.cost_center_id !== filters.costCenterId) return false;
        if (filters.profitCenterId && transaction.profit_center_id !== filters.profitCenterId) return false;
        if (filters.category && transaction.category !== filters.category) return false;
        
        // Period filter
        if (filters.period && filters.period !== 'custom') {
          const now = new Date();
          const transactionDate = new Date(transaction.date);
          
          switch (filters.period) {
            case 'today':
              if (!isSameDay(transactionDate, now)) return false;
              break;
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              if (transactionDate < weekAgo) return false;
              break;
            case 'month':
              if (transactionDate.getMonth() !== now.getMonth() || 
                  transactionDate.getFullYear() !== now.getFullYear()) return false;
              break;
            case 'quarter':
              const quarterStart = Math.floor(now.getMonth() / 3) * 3;
              const quarterStartDate = new Date(now.getFullYear(), quarterStart, 1);
              if (transactionDate < quarterStartDate) return false;
              break;
            case 'year':
              if (transactionDate.getFullYear() !== now.getFullYear()) return false;
              break;
          }
        }
        
        return true;
      });

      // Basic calculations
      const revenues = filteredTransactions.filter(t => t.type === 'income');
      const expenses = filteredTransactions.filter(t => t.type === 'expense');

      const totalRevenue = revenues.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

      // Cost type analysis
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

      // Profit calculations
      const grossProfit = totalRevenue - directCosts;
      const netProfit = totalRevenue - totalExpenses;
      const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Break-even analysis
      const contributionMargin = totalRevenue - variableCosts;
      const contributionMarginRatio = totalRevenue > 0 ? contributionMargin / totalRevenue : 0;
      const breakEvenRevenue = contributionMarginRatio > 0 ? fixedCosts / contributionMarginRatio : 0;
      
      // Assuming 30-day period for daily calculations
      const avgDailyRevenue = totalRevenue / 30;
      const breakEvenDays = avgDailyRevenue > 0 ? breakEvenRevenue / avgDailyRevenue : 0;
      const marginOfSafetyAmount = totalRevenue - breakEvenRevenue;
      const marginOfSafetyDays = avgDailyRevenue > 0 ? marginOfSafetyAmount / avgDailyRevenue : 0;

      // Category analysis
      const expenseByCategory = calculateCategoryBreakdown(expenses, totalExpenses);
      const revenueByCategory = calculateCategoryBreakdown(revenues, totalRevenue);

      // Product performance
      const topProducts = calculateProductPerformance(filteredTransactions);

      // Monthly data and trends
      const monthlyData = calculateMonthlyData(filteredTransactions);
      const costBehaviorData = calculateCostBehaviorData(expenses);

      // Growth rates
      const { monthlyGrowthRate, revenueGrowthRate, expenseGrowthRate } = calculateGrowthRates(monthlyData);

      // KPIs
      const kpis = calculateKPIs(filteredTransactions);

      const result: EnhancedAnalyticsData = {
        totalRevenue,
        totalExpenses,
        netProfit,
        grossProfit,
        netProfitMargin,
        grossProfitMargin,
        fixedCosts,
        variableCosts,
        directCosts,
        indirectCosts,
        contributionMargin,
        breakEvenRevenue,
        breakEvenDays,
        marginOfSafetyAmount,
        marginOfSafetyDays,
        monthlyGrowthRate,
        revenueGrowthRate,
        expenseGrowthRate,
        topProducts,
        expenseByCategory,
        revenueByCategory,
        monthlyData,
        costBehaviorData,
        budgetVariance: [], // Will be populated separately
        kpis
      };

      return result;
    } finally {
      setIsCalculating(false);
    }
  }, [transactions, filters]);

  return {
    analyticsData,
    isLoading: transactionsLoading || isCalculating,
    error: null,
    refreshData: () => {
      // Trigger recalculation by updating a state or calling query invalidation
    }
  };
};