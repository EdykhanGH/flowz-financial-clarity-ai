
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CostCenter {
  id: string;
  cost_center: string;
  user_id: string;
  created_at: string;
  updated_at: string;
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
        .from('business_cost_centers')
        .select('*')
        .order('cost_center');

      if (error) throw error;
      setCostCenters(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch cost centers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addCostCenter = async (costCenter: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('business_cost_centers')
        .insert([{
          cost_center: costCenter,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setCostCenters(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Cost center added successfully"
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add cost center",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const deleteCostCenter = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('business_cost_centers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCostCenters(prev => prev.filter(center => center.id !== id));
      toast({
        title: "Success",
        description: "Cost center deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete cost center",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!user) {
      setCostCenters([]);
      setLoading(false);
      return;
    }

    fetchCostCenters();
  }, [user?.id]);

  return {
    costCenters,
    loading,
    addCostCenter,
    deleteCostCenter,
    refetch: fetchCostCenters
  };
};
