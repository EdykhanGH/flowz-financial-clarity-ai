import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

export type CostCenter = Tables<'cost_centers'>;

export interface Product {
  id: string;
  name: string;
  category: string;
  sub_category?: string;
}

export const useCostCenters = () => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCostCenters = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCostCenters(data || []);
    } catch (error: any) {
      console.error('Error fetching cost centers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cost centers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addCostCenter = async (name: string, categoryType: CostCenter['category_type'], products: Product[] = []) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .insert({
          user_id: user.id,
          name,
          category_type: categoryType,
          products: JSON.stringify(products || [])
        })
        .select()
        .single();

      if (error) throw error;

      setCostCenters(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Cost center added successfully"
      });
      return true;
    } catch (error: any) {
      console.error('Error adding cost center:', error);
      toast({
        title: "Error", 
        description: `Failed to add cost center: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  };

  const updateCostCenter = async (id: string, updates: Partial<CostCenter>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setCostCenters(prev => prev.map(cc => cc.id === id ? data : cc));
      return true;
    } catch (error: any) {
      console.error('Error updating cost center:', error);
      toast({
        title: "Error",
        description: `Failed to update cost center: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteCostCenter = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('cost_centers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCostCenters(prev => prev.filter(cc => cc.id !== id));
      toast({
        title: "Success",
        description: "Cost center deleted successfully"
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting cost center:', error);
      toast({
        title: "Error",
        description: `Failed to delete cost center: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCostCenters();
  }, [user]);

  return {
    costCenters,
    loading,
    addCostCenter,
    updateCostCenter,
    deleteCostCenter,
    refreshCostCenters: fetchCostCenters
  };
};