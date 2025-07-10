-- Create expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create revenue categories table
CREATE TABLE public.revenue_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for expense_categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for expense_categories
CREATE POLICY "Users can view their own expense categories" 
ON public.expense_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expense categories" 
ON public.expense_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense categories" 
ON public.expense_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense categories" 
ON public.expense_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable Row Level Security for revenue_categories
ALTER TABLE public.revenue_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for revenue_categories
CREATE POLICY "Users can view their own revenue categories" 
ON public.revenue_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own revenue categories" 
ON public.revenue_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own revenue categories" 
ON public.revenue_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own revenue categories" 
ON public.revenue_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update business_profiles table to include expense and revenue categories
ALTER TABLE public.business_profiles 
ADD COLUMN expense_categories TEXT[] DEFAULT '{}',
ADD COLUMN revenue_categories TEXT[] DEFAULT '{}',
ADD COLUMN city TEXT,
ADD COLUMN state TEXT;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_expense_categories_updated_at
BEFORE UPDATE ON public.expense_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_revenue_categories_updated_at
BEFORE UPDATE ON public.revenue_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();