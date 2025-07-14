import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

export type ProfitCenter = Tables<'profit_centers'>;

export interface Product {
  id: string;
  name: string;
  category: string;
  sub_category?: string;
}

export const useProfitCenters = () => {
  const [profitCenters, setProfitCenters] = useState<ProfitCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProfitCenters = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profit_centers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProfitCenters(data || []);
    } catch (error: any) {
      console.error('Error fetching profit centers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch profit centers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addProfitCenter = async (name: string, categoryType: ProfitCenter['category_type'], products: Product[] = []) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('profit_centers')
        .insert({
          user_id: user.id,
          name,
          category_type: categoryType,
          products: JSON.stringify(products || [])
        })
        .select()
        .single();

      if (error) throw error;

      setProfitCenters(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Profit center added successfully"
      });
      return true;
    } catch (error: any) {
      console.error('Error adding profit center:', error);
      toast({
        title: "Error", 
        description: `Failed to add profit center: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  };

  const updateProfitCenter = async (id: string, updates: Partial<ProfitCenter>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('profit_centers')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfitCenters(prev => prev.map(pc => pc.id === id ? data : pc));
      return true;
    } catch (error: any) {
      console.error('Error updating profit center:', error);
      toast({
        title: "Error",
        description: `Failed to update profit center: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteProfitCenter = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profit_centers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfitCenters(prev => prev.filter(pc => pc.id !== id));
      toast({
        title: "Success",
        description: "Profit center deleted successfully"
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting profit center:', error);
      toast({
        title: "Error",
        description: `Failed to delete profit center: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProfitCenters();
  }, [user]);

  return {
    profitCenters,
    loading,
    addProfitCenter,
    updateProfitCenter,
    deleteProfitCenter,
    refreshProfitCenters: fetchProfitCenters
  };
};