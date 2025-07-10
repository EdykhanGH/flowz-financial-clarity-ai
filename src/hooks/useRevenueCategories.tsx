import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface RevenueCategory {
  id: string;
  category_name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useRevenueCategories = () => {
  const [categories, setCategories] = useState<RevenueCategory[]>([]);
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
        .from('revenue_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('category_name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching revenue categories:', error);
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
        .from('revenue_categories')
        .insert({ 
          category_name: categoryName,
          user_id: user.id 
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Revenue category added successfully"
      });
      return true;
    } catch (error: any) {
      console.error('Error adding revenue category:', error);
      toast({
        title: "Error",
        description: "Failed to add revenue category",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('revenue_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast({
        title: "Success",
        description: "Revenue category deleted successfully"
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting revenue category:', error);
      toast({
        title: "Error",
        description: "Failed to delete revenue category",
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