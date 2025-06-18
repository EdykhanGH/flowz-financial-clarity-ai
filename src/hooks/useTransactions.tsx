
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer' | 'investment' | 'refund';
  category: string;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Type assertion with validation
      const validatedTransactions = (data || []).map(row => ({
        ...row,
        type: row.type as Transaction['type']
      })) as Transaction[];
      
      setTransactions(validatedTransactions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transactionData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      const newTransaction = {
        ...data,
        type: data.type as Transaction['type']
      } as Transaction;

      // Real-time updates will handle adding to the list
      toast({
        title: "Success",
        description: "Transaction added successfully"
      });

      return { data: newTransaction, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchTransactions();

    // Set up real-time subscription with unique channel name per user
    const channelName = `transactions-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time transaction update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newTransaction = {
              ...payload.new,
              type: payload.new.type as Transaction['type']
            } as Transaction;
            
            setTransactions(prev => [newTransaction, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedTransaction = {
              ...payload.new,
              type: payload.new.type as Transaction['type']
            } as Transaction;
            
            setTransactions(prev => 
              prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
            );
          } else if (payload.eventType === 'DELETE') {
            setTransactions(prev => 
              prev.filter(t => t.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription for channel:', channelName);
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // Only depend on user.id, not the entire user object

  return {
    transactions,
    loading,
    addTransaction,
    refetch: fetchTransactions
  };
};
