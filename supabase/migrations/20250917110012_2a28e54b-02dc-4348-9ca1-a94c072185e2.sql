-- Create Chart of Accounts system
CREATE TABLE public.account_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses')),
  normal_balance TEXT NOT NULL CHECK (normal_balance IN ('Debit', 'Credit')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type_id UUID NOT NULL REFERENCES public.account_types(id),
  parent_account_id UUID REFERENCES public.chart_of_accounts(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  opening_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, account_code)
);

-- Enable RLS on chart_of_accounts
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for chart_of_accounts
CREATE POLICY "Users can view their own accounts" 
ON public.chart_of_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts" 
ON public.chart_of_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" 
ON public.chart_of_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" 
ON public.chart_of_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create Journal Entries system
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  total_debit NUMERIC NOT NULL DEFAULT 0,
  total_credit NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_number)
);

CREATE TABLE public.journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  debit_amount NUMERIC DEFAULT 0,
  credit_amount NUMERIC DEFAULT 0,
  description TEXT,
  line_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on journal entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- Create policies for journal entries
CREATE POLICY "Users can view their own journal entries" 
ON public.journal_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries" 
ON public.journal_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" 
ON public.journal_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" 
ON public.journal_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policy for journal entry lines (through journal entries)
CREATE POLICY "Users can view journal entry lines for their entries" 
ON public.journal_entry_lines 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.journal_entries 
  WHERE journal_entries.id = journal_entry_lines.journal_entry_id 
  AND journal_entries.user_id = auth.uid()
));

CREATE POLICY "Users can create journal entry lines for their entries" 
ON public.journal_entry_lines 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.journal_entries 
  WHERE journal_entries.id = journal_entry_lines.journal_entry_id 
  AND journal_entries.user_id = auth.uid()
));

CREATE POLICY "Users can update journal entry lines for their entries" 
ON public.journal_entry_lines 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.journal_entries 
  WHERE journal_entries.id = journal_entry_lines.journal_entry_id 
  AND journal_entries.user_id = auth.uid()
));

CREATE POLICY "Users can delete journal entry lines for their entries" 
ON public.journal_entry_lines 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.journal_entries 
  WHERE journal_entries.id = journal_entry_lines.journal_entry_id 
  AND journal_entries.user_id = auth.uid()
));

-- Insert default account types
INSERT INTO public.account_types (name, category, normal_balance) VALUES
('Current Assets', 'Assets', 'Debit'),
('Non-Current Assets', 'Assets', 'Debit'),
('Current Liabilities', 'Liabilities', 'Credit'),
('Non-Current Liabilities', 'Liabilities', 'Credit'),
('Owner''s Equity', 'Equity', 'Credit'),
('Sales Revenue', 'Revenue', 'Credit'),
('Other Revenue', 'Revenue', 'Credit'),
('Cost of Goods Sold', 'Expenses', 'Debit'),
('Operating Expenses', 'Expenses', 'Debit'),
('Financial Expenses', 'Expenses', 'Debit');

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_chart_of_accounts_updated_at
BEFORE UPDATE ON public.chart_of_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();