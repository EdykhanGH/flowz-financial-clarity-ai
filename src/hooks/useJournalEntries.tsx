import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ChartOfAccount } from './useChartOfAccounts';

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  line_number: number;
  created_at: string;
  account?: ChartOfAccount;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference?: string;
  total_debit: number;
  total_credit: number;
  status: 'draft' | 'posted' | 'reversed';
  created_at: string;
  updated_at: string;
  journal_entry_lines?: JournalEntryLine[];
}

export const useJournalEntries = () => {
  return useQuery({
    queryKey: ['journal-entries'],
    queryFn: async (): Promise<JournalEntry[]> => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_lines(
            *,
            account:chart_of_accounts(*)
          )
        `)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return (data || []) as JournalEntry[];
    },
  });
};

export const useCreateJournalEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entryData: {
      entry_date: string;
      description: string;
      reference?: string;
      lines: Array<{
        account_id: string;
        debit_amount: number;
        credit_amount: number;
        description?: string;
      }>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate totals
      const total_debit = entryData.lines.reduce((sum, line) => sum + line.debit_amount, 0);
      const total_credit = entryData.lines.reduce((sum, line) => sum + line.credit_amount, 0);

      // Validate that debits equal credits
      if (Math.abs(total_debit - total_credit) > 0.01) {
        throw new Error('Debits must equal credits');
      }

      // Generate entry number
      const { data: lastEntry } = await supabase
        .from('journal_entries')
        .select('entry_number')
        .eq('user_id', user.id)
        .order('entry_number', { ascending: false })
        .limit(1)
        .single();

      const lastNumber = lastEntry?.entry_number ? parseInt(lastEntry.entry_number.replace('JE', '')) : 0;
      const entry_number = `JE${String(lastNumber + 1).padStart(6, '0')}`;

      // Create journal entry
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          entry_number,
          entry_date: entryData.entry_date,
          description: entryData.description,
          reference: entryData.reference,
          total_debit,
          total_credit,
          status: 'draft',
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Create journal entry lines
      const linesWithNumbers = entryData.lines.map((line, index) => ({
        ...line,
        journal_entry_id: journalEntry.id,
        line_number: index + 1,
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(linesWithNumbers);

      if (linesError) throw linesError;

      return journalEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({
        title: 'Success',
        description: 'Journal entry created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create journal entry',
        variant: 'destructive',
      });
    },
  });
};

export const usePostJournalEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entryId: string) => {
      // Update journal entry status to posted
      const { error: entryError } = await supabase
        .from('journal_entries')
        .update({ status: 'posted' })
        .eq('id', entryId);

      if (entryError) throw entryError;

      // Update account balances
      const { data: lines, error: linesError } = await supabase
        .from('journal_entry_lines')
        .select(`
          *,
          account:chart_of_accounts(
            *,
            account_type:account_types(*)
          )
        `)
        .eq('journal_entry_id', entryId);

      if (linesError) throw linesError;

      for (const line of lines) {
        if (line.account) {
          const balanceChange = line.account.account_type?.normal_balance === 'Debit' 
            ? line.debit_amount - line.credit_amount
            : line.credit_amount - line.debit_amount;

          await supabase
            .from('chart_of_accounts')
            .update({
              current_balance: line.account.current_balance + balanceChange
            })
            .eq('id', line.account_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({
        title: 'Success',
        description: 'Journal entry posted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to post journal entry',
        variant: 'destructive',
      });
    },
  });
};