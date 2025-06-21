
-- Update business_profiles table to include all the new fields
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS business_size_employees TEXT,
ADD COLUMN IF NOT EXISTS business_size_scale TEXT,
ADD COLUMN IF NOT EXISTS annual_revenue_range TEXT,
ADD COLUMN IF NOT EXISTS core_activities TEXT[],
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS revenue_frequency TEXT[];

-- Create a new table for revenue streams with frequency
CREATE TABLE IF NOT EXISTS public.business_revenue_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  revenue_stream TEXT NOT NULL,
  frequency TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for business_revenue_streams
ALTER TABLE public.business_revenue_streams ENABLE ROW LEVEL SECURITY;

-- Create policies for business_revenue_streams
CREATE POLICY "Users can view their own revenue streams" 
  ON public.business_revenue_streams 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own revenue streams" 
  ON public.business_revenue_streams 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own revenue streams" 
  ON public.business_revenue_streams 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own revenue streams" 
  ON public.business_revenue_streams 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a table for cost centers
CREATE TABLE IF NOT EXISTS public.business_cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cost_center TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for business_cost_centers
ALTER TABLE public.business_cost_centers ENABLE ROW LEVEL SECURITY;

-- Create policies for business_cost_centers
CREATE POLICY "Users can view their own cost centers" 
  ON public.business_cost_centers 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cost centers" 
  ON public.business_cost_centers 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cost centers" 
  ON public.business_cost_centers 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cost centers" 
  ON public.business_cost_centers 
  FOR DELETE 
  USING (auth.uid() = user_id);
