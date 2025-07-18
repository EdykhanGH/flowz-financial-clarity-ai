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
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, metric_date)
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

-- Create indexes for better performance
CREATE INDEX idx_analytics_metrics_user_date ON public.analytics_metrics(user_id, metric_date);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX idx_transactions_user_type ON public.transactions(user_id, type);

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