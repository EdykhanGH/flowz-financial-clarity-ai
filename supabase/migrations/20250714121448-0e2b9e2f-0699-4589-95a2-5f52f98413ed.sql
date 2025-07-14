-- Create comprehensive business analytics schema

-- 1. Cost Centers table (replacing business_cost_centers)
DROP TABLE IF EXISTS business_cost_centers;
CREATE TABLE public.cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('product_cost', 'operational_cost', 'fixed_cost', 'variable_cost')),
  parent_id UUID REFERENCES public.cost_centers(id),
  products JSONB DEFAULT '[]'::jsonb, -- For product cost centers
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Profit Centers table (replacing business_revenue_streams)
DROP TABLE IF EXISTS business_revenue_streams;
CREATE TABLE public.profit_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('product_sales', 'service_revenue', 'other_revenue')),
  parent_id UUID REFERENCES public.profit_centers(id),
  products JSONB DEFAULT '[]'::jsonb, -- For product sales centers
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Enhanced transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.cost_centers(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS profit_center_id UUID REFERENCES public.profit_centers(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS quantity INTEGER;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS unit_cost NUMERIC;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS unit_price NUMERIC;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS cost_nature TEXT CHECK (cost_nature IN ('fixed', 'variable', 'mixed'));
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS cost_type TEXT CHECK (cost_type IN ('direct', 'indirect'));

-- 4. Products table for detailed product management
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  cost_center_id UUID REFERENCES public.cost_centers(id),
  profit_center_id UUID REFERENCES public.profit_centers(id),
  standard_cost NUMERIC DEFAULT 0,
  standard_price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Budget table enhancements
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.cost_centers(id);
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS profit_center_id UUID REFERENCES public.profit_centers(id);
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS budget_type TEXT CHECK (budget_type IN ('cost', 'revenue', 'profit'));

-- 6. Scenario analysis table
CREATE TABLE public.scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  scenario_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  assumptions JSONB DEFAULT '[]'::jsonb,
  results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. AI insights table
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('risk_detection', 'recommendation', 'trend_analysis', 'cost_optimization', 'price_optimization')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence_score NUMERIC DEFAULT 0.8,
  action_items JSONB DEFAULT '[]'::jsonb,
  related_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cost_centers
CREATE POLICY "Users can create their own cost centers" 
ON public.cost_centers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own cost centers" 
ON public.cost_centers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cost centers" 
ON public.cost_centers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cost centers" 
ON public.cost_centers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for profit_centers
CREATE POLICY "Users can create their own profit centers" 
ON public.profit_centers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own profit centers" 
ON public.profit_centers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profit centers" 
ON public.profit_centers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profit centers" 
ON public.profit_centers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for products
CREATE POLICY "Users can create their own products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own products" 
ON public.products 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" 
ON public.products 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" 
ON public.products 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for scenarios
CREATE POLICY "Users can create their own scenarios" 
ON public.scenarios 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own scenarios" 
ON public.scenarios 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios" 
ON public.scenarios 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios" 
ON public.scenarios 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for ai_insights
CREATE POLICY "Users can create their own ai insights" 
ON public.ai_insights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own ai insights" 
ON public.ai_insights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai insights" 
ON public.ai_insights 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai insights" 
ON public.ai_insights 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_cost_centers_updated_at
BEFORE UPDATE ON public.cost_centers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profit_centers_updated_at
BEFORE UPDATE ON public.profit_centers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at
BEFORE UPDATE ON public.scenarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at
BEFORE UPDATE ON public.ai_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_cost_centers_user_id ON public.cost_centers(user_id);
CREATE INDEX idx_cost_centers_category_type ON public.cost_centers(category_type);
CREATE INDEX idx_profit_centers_user_id ON public.profit_centers(user_id);
CREATE INDEX idx_profit_centers_category_type ON public.profit_centers(category_type);
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_cost_center_id ON public.products(cost_center_id);
CREATE INDEX idx_products_profit_center_id ON public.products(profit_center_id);
CREATE INDEX idx_transactions_cost_center_id ON public.transactions(cost_center_id);
CREATE INDEX idx_transactions_profit_center_id ON public.transactions(profit_center_id);
CREATE INDEX idx_scenarios_user_id ON public.scenarios(user_id);
CREATE INDEX idx_ai_insights_user_id ON public.ai_insights(user_id);
CREATE INDEX idx_ai_insights_type ON public.ai_insights(insight_type);