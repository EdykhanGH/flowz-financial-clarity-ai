
-- Create table for cost classification rules based on business profiles
CREATE TABLE IF NOT EXISTS public.cost_classification_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_category TEXT NOT NULL,
  cost_keyword TEXT NOT NULL,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('fixed', 'variable', 'mixed')),
  cost_nature TEXT NOT NULL CHECK (cost_nature IN ('direct', 'indirect')),
  confidence_score DECIMAL(3,2) DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for enhanced transaction classifications
CREATE TABLE IF NOT EXISTS public.transaction_classifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cost_type TEXT CHECK (cost_type IN ('fixed', 'variable', 'mixed')),
  cost_nature TEXT CHECK (cost_nature IN ('direct', 'indirect')),
  ai_confidence DECIMAL(3,2) DEFAULT 0.0,
  manual_override BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for business-specific cost patterns (without foreign key to users)
CREATE TABLE IF NOT EXISTS public.business_cost_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_name TEXT NOT NULL,
  business_category TEXT NOT NULL,
  cost_keywords TEXT[] NOT NULL,
  typical_cost_type TEXT NOT NULL CHECK (typical_cost_type IN ('fixed', 'variable', 'mixed')),
  typical_cost_nature TEXT NOT NULL CHECK (typical_cost_nature IN ('direct', 'indirect')),
  industry_relevance DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for the user-specific tables only
ALTER TABLE public.cost_classification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_classifications ENABLE ROW LEVEL SECURITY;
-- business_cost_patterns will be publicly readable as it contains industry templates

-- Create RLS policies for cost_classification_rules
CREATE POLICY "Users can view their own cost classification rules" 
  ON public.cost_classification_rules 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cost classification rules" 
  ON public.cost_classification_rules 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cost classification rules" 
  ON public.cost_classification_rules 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cost classification rules" 
  ON public.cost_classification_rules 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for transaction_classifications
CREATE POLICY "Users can view their own transaction classifications" 
  ON public.transaction_classifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transaction classifications" 
  ON public.transaction_classifications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transaction classifications" 
  ON public.transaction_classifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transaction classifications" 
  ON public.transaction_classifications 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Insert default cost patterns without user_id references
INSERT INTO public.business_cost_patterns (pattern_name, business_category, cost_keywords, typical_cost_type, typical_cost_nature, industry_relevance) VALUES
-- Manufacturing patterns
('Raw Materials', 'Manufacturing - Food Products', ARRAY['raw materials', 'ingredients', 'components', 'parts'], 'variable', 'direct', 1.0),
('Labor Costs', 'Manufacturing - Food Products', ARRAY['wages', 'salary', 'labor', 'overtime', 'worker'], 'variable', 'direct', 1.0),
('Equipment Depreciation', 'Manufacturing - Food Products', ARRAY['depreciation', 'equipment', 'machinery', 'plant'], 'fixed', 'indirect', 1.0),
('Utilities', 'Manufacturing - Food Products', ARRAY['electricity', 'gas', 'water', 'utilities', 'power'], 'mixed', 'indirect', 1.0),

-- Services patterns
('Professional Fees', 'Services - IT Services', ARRAY['consultant', 'professional', 'expert', 'specialist'], 'variable', 'direct', 1.0),
('Office Rent', 'Services - IT Services', ARRAY['rent', 'lease', 'office space', 'premises'], 'fixed', 'indirect', 1.0),
('Software Licenses', 'Services - IT Services', ARRAY['software', 'license', 'subscription', 'saas'], 'fixed', 'direct', 1.0),
('Marketing', 'Services - IT Services', ARRAY['marketing', 'advertising', 'promotion', 'campaigns'], 'variable', 'indirect', 1.0),

-- Retail patterns
('Inventory Purchases', 'Retail & Trade - E-commerce', ARRAY['inventory', 'stock', 'merchandise', 'goods'], 'variable', 'direct', 1.0),
('Store Rent', 'Retail & Trade - Traditional Retail', ARRAY['store rent', 'retail space', 'shop rent'], 'fixed', 'indirect', 1.0),
('Shipping Costs', 'Retail & Trade - E-commerce', ARRAY['shipping', 'delivery', 'logistics', 'freight'], 'variable', 'direct', 1.0),

-- General business patterns
('Office Supplies', 'General', ARRAY['office supplies', 'stationery', 'paper', 'pens'], 'variable', 'indirect', 0.8),
('Insurance', 'General', ARRAY['insurance', 'premium', 'coverage'], 'fixed', 'indirect', 1.0),
('Professional Services', 'General', ARRAY['legal', 'accounting', 'audit', 'consulting'], 'variable', 'indirect', 0.9),
('Travel Expenses', 'General', ARRAY['travel', 'transportation', 'accommodation', 'meals'], 'variable', 'indirect', 0.8),
('Communication', 'General', ARRAY['phone', 'internet', 'communication', 'telecom'], 'fixed', 'indirect', 1.0);
