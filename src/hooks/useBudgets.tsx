import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  start_date: string;
  end_date: string;
  period: string;
  budget_type?: string;
  cost_center_id?: string;
  profit_center_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetVariance {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'favorable' | 'unfavorable' | 'on-track';
}

export const useBudgets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch budgets
  const { data: budgets = [], isLoading, error } = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: async (budgetData: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .insert({
          ...budgetData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      toast({
        title: "Success",
        description: "Budget created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create budget",
        variant: "destructive",
      });
    },
  });

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Budget> }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      toast({
        title: "Success",
        description: "Budget updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update budget",
        variant: "destructive",
      });
    },
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
      toast({
        title: "Success",
        description: "Budget deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete budget",
        variant: "destructive",
      });
    },
  });

  // Calculate budget variance with actual transactions
  const calculateBudgetVariance = async (period: 'current-month' | 'last-month' | 'quarter' | 'year' = 'current-month'): Promise<BudgetVariance[]> => {
    if (!user) return [];

    try {
      // Get date range based on period
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (period) {
        case 'current-month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'last-month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'quarter':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
          endDate = new Date(now.getFullYear(), quarterStart + 3, 0);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      // Get actual spending from transactions
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (transactionError) throw transactionError;

      // Group actual spending by category
      const actualSpending = (transactions || []).reduce((acc, transaction) => {
        const category = transaction.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + Number(transaction.amount);
        return acc;
      }, {} as Record<string, number>);

      // Get budgets for the period
      const activeBudgets = budgets.filter(budget => {
        const budgetStart = new Date(budget.start_date);
        const budgetEnd = new Date(budget.end_date);
        return budgetStart <= endDate && budgetEnd >= startDate;
      });

      // Calculate variance for each budget category
      const variance: BudgetVariance[] = [];

      // Add budgets with actual spending
      activeBudgets.forEach(budget => {
        const actual = actualSpending[budget.category] || 0;
        const budgeted = budget.allocated_amount;
        const varianceAmount = budgeted - actual;
        const variancePercent = budgeted > 0 ? (varianceAmount / budgeted) * 100 : 0;

        variance.push({
          category: budget.category,
          budgeted,
          actual,
          variance: varianceAmount,
          variancePercent,
          status: variancePercent > 10 ? 'favorable' : variancePercent < -10 ? 'unfavorable' : 'on-track'
        });
      });

      // Add categories with spending but no budget
      Object.entries(actualSpending).forEach(([category, actual]) => {
        if (!activeBudgets.find(b => b.category === category)) {
          variance.push({
            category,
            budgeted: 0,
            actual,
            variance: -actual,
            variancePercent: -100,
            status: 'unfavorable'
          });
        }
      });

      return variance.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
    } catch (error) {
      console.error('Error calculating budget variance:', error);
      return [];
    }
  };

  // Update spent amounts based on actual transactions
  const updateBudgetSpending = async () => {
    if (!user || !budgets.length) return;

    try {
      for (const budget of budgets) {
        const startDate = new Date(budget.start_date);
        const endDate = new Date(budget.end_date);

        // Get actual spending for this budget period and category
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('type', 'expense')
          .eq('category', budget.category)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);

        if (error) continue;

        const actualSpent = (transactions || []).reduce((sum, t) => sum + Number(t.amount), 0);

        // Update budget with actual spent amount
        if (actualSpent !== budget.spent_amount) {
          await supabase
            .from('budgets')
            .update({ spent_amount: actualSpent })
            .eq('id', budget.id);
        }
      }

      // Refresh budgets
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] });
    } catch (error) {
      console.error('Error updating budget spending:', error);
    }
  };

  return {
    budgets,
    isLoading,
    error,
    createBudget: createBudgetMutation.mutate,
    updateBudget: updateBudgetMutation.mutate,
    deleteBudget: deleteBudgetMutation.mutate,
    isCreating: createBudgetMutation.isPending,
    isUpdating: updateBudgetMutation.isPending,
    isDeleting: deleteBudgetMutation.isPending,
    calculateBudgetVariance,
    updateBudgetSpending,
  };
};