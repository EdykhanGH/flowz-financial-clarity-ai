import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AccountType {
  id: string;
  name: string;
  category: 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';
  normal_balance: 'Debit' | 'Credit';
  created_at: string;
}

export interface ChartOfAccount {
  id: string;
  user_id: string;
  account_code: string;
  account_name: string;
  account_type_id: string;
  parent_account_id?: string;
  is_active: boolean;
  description?: string;
  opening_balance: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
  account_type?: AccountType;
  parent_account?: ChartOfAccount;
  sub_accounts?: ChartOfAccount[];
}

export const useAccountTypes = () => {
  return useQuery({
    queryKey: ['account-types'],
    queryFn: async (): Promise<AccountType[]> => {
      const { data, error } = await supabase
        .from('account_types')
        .select('*')
        .order('category, name');

      if (error) throw error;
      return (data || []) as AccountType[];
    },
  });
};

export const useChartOfAccounts = () => {
  return useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: async (): Promise<ChartOfAccount[]> => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select(`
          *,
          account_type:account_types(*),
          parent_account:chart_of_accounts!parent_account_id(*)
        `)
        .eq('is_active', true)
        .order('account_code');

      if (error) throw error;
      return (data || []) as ChartOfAccount[];
    },
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (accountData: Omit<ChartOfAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('chart_of_accounts')
        .insert({
          ...accountData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({
        title: 'Success',
        description: 'Account created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChartOfAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({
        title: 'Success',
        description: 'Account updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update account',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chart_of_accounts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({
        title: 'Success',
        description: 'Account deactivated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deactivate account',
        variant: 'destructive',
      });
    },
  });
};