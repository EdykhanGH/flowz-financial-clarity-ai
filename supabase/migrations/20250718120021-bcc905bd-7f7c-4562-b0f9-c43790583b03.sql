-- Create comprehensive analytics views and enhanced relationships

-- First, add missing foreign key constraints to transactions table for better data relationships
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_cost_center_id_fkey 
FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id);

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_profit_center_id_fkey 
FOREIGN KEY (profit_center_id) REFERENCES public.profit_centers(id);

-- Create analytics aggregation table for pre-computed metrics
CREATE TABLE public.analytics_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_date DATE NOT NULL,
  total_revenue NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  gross_profit NUMERIC DEFAULT 0,
  net_profit NUMERIC DEFAULT 0,
  fixed_costs NUMERIC DEFAULT 0,
  variable_costs NUMERIC DEFAULT 0,
  direct_costs NUMERIC DEFAULT 0,
  indirect_costs NUMERIC DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on analytics_metrics
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for analytics_metrics
CREATE POLICY "Users can view their own analytics metrics" 
ON public.analytics_metrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics metrics" 
ON public.analytics_metrics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics metrics" 
ON public.analytics_metrics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics metrics" 
ON public.analytics_metrics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_analytics_metrics_user_date ON public.analytics_metrics(user_id, metric_date);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX idx_transactions_user_type ON public.transactions(user_id, type);

-- Create product performance tracking table
CREATE TABLE public.product_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  units_sold INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_costs NUMERIC DEFAULT 0,
  gross_profit NUMERIC DEFAULT 0,
  avg_selling_price NUMERIC DEFAULT 0,
  avg_cost_price NUMERIC DEFAULT 0,
  inventory_turnover NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on product_performance
ALTER TABLE public.product_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_performance
CREATE POLICY "Users can view their own product performance" 
ON public.product_performance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own product performance" 
ON public.product_performance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product performance" 
ON public.product_performance 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product performance" 
ON public.product_performance 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create cost center performance table
CREATE TABLE public.cost_center_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_costs NUMERIC DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  avg_cost_per_transaction NUMERIC DEFAULT 0,
  budget_allocated NUMERIC DEFAULT 0,
  budget_utilized NUMERIC DEFAULT 0,
  variance_amount NUMERIC DEFAULT 0,
  variance_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cost_center_performance
ALTER TABLE public.cost_center_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cost_center_performance
CREATE POLICY "Users can view their own cost center performance" 
ON public.cost_center_performance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cost center performance" 
ON public.cost_center_performance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cost center performance" 
ON public.cost_center_performance 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cost center performance" 
ON public.cost_center_performance 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create analytics calculation function
CREATE OR REPLACE FUNCTION public.calculate_daily_analytics(p_user_id UUID, p_date DATE)
RETURNS VOID AS $$
DECLARE
  v_total_revenue NUMERIC := 0;
  v_total_expenses NUMERIC := 0;
  v_fixed_costs NUMERIC := 0;
  v_variable_costs NUMERIC := 0;
  v_direct_costs NUMERIC := 0;
  v_indirect_costs NUMERIC := 0;
  v_transaction_count INTEGER := 0;
BEGIN
  -- Calculate revenue
  SELECT COALESCE(SUM(amount), 0), COUNT(*)
  INTO v_total_revenue, v_transaction_count
  FROM public.transactions 
  WHERE user_id = p_user_id 
    AND date = p_date 
    AND type = 'income';

  -- Calculate total expenses
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_expenses
  FROM public.transactions t
  LEFT JOIN public.transaction_classifications tc ON t.id = tc.transaction_id
  WHERE t.user_id = p_user_id 
    AND t.date = p_date 
    AND t.type = 'expense';

  -- Calculate cost breakdowns
  SELECT 
    COALESCE(SUM(CASE WHEN tc.cost_type = 'fixed' THEN t.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tc.cost_type = 'variable' THEN t.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tc.cost_nature = 'direct' THEN t.amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tc.cost_nature = 'indirect' THEN t.amount ELSE 0 END), 0)
  INTO v_fixed_costs, v_variable_costs, v_direct_costs, v_indirect_costs
  FROM public.transactions t
  LEFT JOIN public.transaction_classifications tc ON t.id = tc.transaction_id
  WHERE t.user_id = p_user_id 
    AND t.date = p_date 
    AND t.type = 'expense';

  -- Insert or update analytics metrics
  INSERT INTO public.analytics_metrics (
    user_id, metric_date, total_revenue, total_expenses, 
    gross_profit, net_profit, fixed_costs, variable_costs, 
    direct_costs, indirect_costs, transaction_count
  ) VALUES (
    p_user_id, p_date, v_total_revenue, v_total_expenses,
    v_total_revenue - v_direct_costs, v_total_revenue - v_total_expenses,
    v_fixed_costs, v_variable_costs, v_direct_costs, v_indirect_costs,
    v_transaction_count
  )
  ON CONFLICT (user_id, metric_date) 
  DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_expenses = EXCLUDED.total_expenses,
    gross_profit = EXCLUDED.gross_profit,
    net_profit = EXCLUDED.net_profit,
    fixed_costs = EXCLUDED.fixed_costs,
    variable_costs = EXCLUDED.variable_costs,
    direct_costs = EXCLUDED.direct_costs,
    indirect_costs = EXCLUDED.indirect_costs,
    transaction_count = EXCLUDED.transaction_count,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-calculate analytics when transactions change
CREATE OR REPLACE FUNCTION public.trigger_calculate_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate analytics for the transaction date
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.calculate_daily_analytics(NEW.user_id, NEW.date::DATE);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_daily_analytics(OLD.user_id, OLD.date::DATE);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on transactions table
CREATE TRIGGER trigger_transaction_analytics
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_calculate_analytics();

-- Create trigger on transaction_classifications table
CREATE TRIGGER trigger_classification_analytics
  AFTER INSERT OR UPDATE OR DELETE ON public.transaction_classifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_analytics();

-- Function to recalculate analytics when classifications change
CREATE OR REPLACE FUNCTION public.trigger_recalculate_analytics()
RETURNS TRIGGER AS $$
DECLARE
  v_transaction_date DATE;
  v_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Get transaction details
    SELECT t.date::DATE, t.user_id 
    INTO v_transaction_date, v_user_id
    FROM public.transactions t 
    WHERE t.id = NEW.transaction_id;
    
    PERFORM public.calculate_daily_analytics(v_user_id, v_transaction_date);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Get transaction details
    SELECT t.date::DATE, t.user_id 
    INTO v_transaction_date, v_user_id
    FROM public.transactions t 
    WHERE t.id = OLD.transaction_id;
    
    PERFORM public.calculate_daily_analytics(v_user_id, v_transaction_date);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint to analytics_metrics to prevent duplicates
ALTER TABLE public.analytics_metrics 
ADD CONSTRAINT analytics_metrics_user_date_unique 
UNIQUE (user_id, metric_date);

-- Add updated_at trigger to all performance tables
CREATE TRIGGER update_analytics_metrics_updated_at
  BEFORE UPDATE ON public.analytics_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_performance_updated_at
  BEFORE UPDATE ON public.product_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cost_center_performance_updated_at
  BEFORE UPDATE ON public.cost_center_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();