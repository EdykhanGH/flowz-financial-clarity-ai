
-- Create business_profiles table
CREATE TABLE public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  category TEXT,
  description TEXT,
  turnover TEXT,
  employees TEXT,
  business_model TEXT,
  revenue_streams TEXT[],
  cost_centers TEXT[],
  market_scope TEXT,
  seasonal_business BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_id_unique UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_profiles
CREATE POLICY "Users can view their own business profile" ON public.business_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business profile" ON public.business_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business profile" ON public.business_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business profile" ON public.business_profiles
  FOR DELETE USING (auth.uid() = user_id);
