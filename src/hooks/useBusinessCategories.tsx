
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BusinessCategory {
  id: string;
  category_name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useBusinessCategories = () => {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('category_name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive"
      });
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
      return { data: null, error: 'Not authenticated' };
    }

    // Check if category already exists
    const existingCategory = categories.find(
      cat => cat.category_name.toLowerCase() === categoryName.toLowerCase()
    );

    if (existingCategory) {
      toast({
        title: "Error",
        description: "Category already exists",
        variant: "destructive"
      });
      return { data: null, error: 'Category already exists' };
    }

    try {
      const { data, error } = await supabase
        .from('business_categories')
        .insert([{
          category_name: categoryName,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Category added successfully"
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add category",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('business_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast({
        title: "Success",
        description: "Category deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user?.id]);

  return {
    categories,
    loading,
    addCategory,
    deleteCategory,
    refetch: fetchCategories
  };
};
