import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface OptimizedTransaction {
  id: string;
  user_id: string;
  date: string;
  description: string | null;
  amount: number;
  category: string;
  type: string;
  cost_type: string | null;
  cost_nature: string | null;
}

// Lightweight hook for analytics that doesn't load ALL transactions
export const useOptimizedTransactions = (limit: number = 50) => {
  const { user } = useAuth();

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['optimized-transactions', user?.id, limit],
    queryFn: async (): Promise<OptimizedTransaction[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('id, user_id, date, description, amount, category, type, cost_type, cost_nature')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Memoized calculations to prevent re-computation
  const analytics = useMemo(() => {
    if (!transactions.length) return null;

    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');

    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalIncome = income.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const fixedCosts = expenses
      .filter(t => t.cost_type === 'fixed')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const variableCosts = expenses
      .filter(t => t.cost_type === 'variable')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      totalExpenses,
      totalIncome,
      fixedCosts,
      variableCosts,
      netProfit: totalIncome - totalExpenses,
      transactionCount: transactions.length
    };
  }, [transactions]);

  return {
    transactions,
    analytics,
    isLoading,
    error
  };
};