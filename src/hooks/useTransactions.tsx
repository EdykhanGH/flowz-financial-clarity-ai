
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { costClassificationService } from '@/services/CostClassificationService';

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  description: string | null;
  amount: number;
  category: string;
  type: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface TransactionWithClassification extends Transaction {
  classification?: {
    cost_type: 'fixed' | 'variable' | 'mixed';
    cost_nature: 'direct' | 'indirect';
    ai_confidence: number;
    manual_override: boolean;
  };
}

export const useTransactions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch transactions with classifications
  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async (): Promise<TransactionWithClassification[]> => {
      if (!user) return [];

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch classifications for all transactions
      const { data: classificationsData, error: classificationsError } = await supabase
        .from('transaction_classifications')
        .select('*')
        .eq('user_id', user.id);

      if (classificationsError) {
        console.error('Error fetching classifications:', classificationsError);
      }

      // Merge transactions with their classifications
      const transactionsWithClassifications = transactionsData.map(transaction => {
        const classification = classificationsData?.find(
          c => c.transaction_id === transaction.id
        );

        return {
          ...transaction,
          classification: classification ? {
            cost_type: classification.cost_type,
            cost_nature: classification.cost_nature,
            ai_confidence: classification.ai_confidence,
            manual_override: classification.manual_override
          } : undefined
        };
      });

      return transactionsWithClassifications;
    },
    enabled: !!user,
  });

  // Add transaction mutation with automatic classification
  const addTransactionMutation = useMutation({
    mutationFn: async (newTransaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      // Insert transaction
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            ...newTransaction,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Automatically classify the transaction
      if (data && newTransaction.description) {
        try {
          const classification = await costClassificationService.classifyTransaction(
            newTransaction.description,
            newTransaction.amount,
            newTransaction.category,
            user.id
          );

          await costClassificationService.saveClassification(
            data.id,
            user.id,
            classification
          );

          console.log('Transaction classified:', classification);
        } catch (classificationError) {
          console.error('Error classifying transaction:', classificationError);
          // Don't throw here - transaction was saved successfully
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
  });

  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      // Re-classify if description or category changed
      if ((updates.description || updates.category) && user) {
        try {
          const classification = await costClassificationService.classifyTransaction(
            updates.description || data.description || '',
            updates.amount || data.amount,
            updates.category || data.category,
            user.id
          );

          await costClassificationService.saveClassification(
            data.id,
            user.id,
            classification
          );
        } catch (classificationError) {
          console.error('Error re-classifying transaction:', classificationError);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    },
  });

  // Bulk classify existing transactions
  const classifyAllTransactions = async () => {
    if (!user || !transactions.length) return;

    const unclassifiedTransactions = transactions.filter(t => !t.classification);
    
    console.log(`Classifying ${unclassifiedTransactions.length} transactions...`);

    for (const transaction of unclassifiedTransactions) {
      try {
        if (transaction.description) {
          const classification = await costClassificationService.classifyTransaction(
            transaction.description,
            transaction.amount,
            transaction.category,
            user.id
          );

          await costClassificationService.saveClassification(
            transaction.id,
            user.id,
            classification
          );
        }
      } catch (error) {
        console.error(`Error classifying transaction ${transaction.id}:`, error);
      }
    }

    // Refresh the data
    queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
  };

  return {
    transactions,
    isLoading,
    error,
    addTransaction: addTransactionMutation.mutate,
    updateTransaction: updateTransactionMutation.mutate,
    deleteTransaction: deleteTransactionMutation.mutate,
    classifyAllTransactions,
    isAddingTransaction: addTransactionMutation.isPending,
    isUpdatingTransaction: updateTransactionMutation.isPending,
    isDeletingTransaction: deleteTransactionMutation.isPending,
  };
};
