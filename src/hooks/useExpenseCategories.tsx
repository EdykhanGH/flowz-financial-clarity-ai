import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ExpenseCategory {
  id: string;
  category_name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useExpenseCategories = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expense_categories' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('category_name');

      if (error) throw error;
      setCategories((data as unknown as ExpenseCategory[]) || []);
    } catch (error: any) {
      console.error('Error fetching expense categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (categoryName: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add categories",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('expense_categories' as any)
        .insert({ 
          category_name: categoryName,
          user_id: user.id 
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data as unknown as ExpenseCategory]);
      toast({
        title: "Success",
        description: "Expense category added successfully"
      });
      return true;
    } catch (error: any) {
      console.error('Error adding expense category:', error);
      toast({
        title: "Error",
        description: "Failed to add expense category",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('expense_categories' as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast({
        title: "Success",
        description: "Expense category deleted successfully"
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting expense category:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense category",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  return {
    categories,
    loading,
    addCategory,
    deleteCategory,
    fetchCategories
  };
};