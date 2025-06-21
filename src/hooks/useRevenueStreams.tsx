
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface RevenueStream {
  id: string;
  revenue_stream: string;
  frequency: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useRevenueStreams = () => {
  const [revenueStreams, setRevenueStreams] = useState<RevenueStream[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRevenueStreams = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('business_revenue_streams')
        .select('*')
        .order('revenue_stream');

      if (error) throw error;
      setRevenueStreams(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch revenue streams",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addRevenueStream = async (revenueStream: string, frequency: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('business_revenue_streams')
        .insert([{
          revenue_stream: revenueStream,
          frequency: frequency,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setRevenueStreams(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Revenue stream added successfully"
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add revenue stream",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const deleteRevenueStream = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('business_revenue_streams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRevenueStreams(prev => prev.filter(stream => stream.id !== id));
      toast({
        title: "Success",
        description: "Revenue stream deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete revenue stream",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!user) {
      setRevenueStreams([]);
      setLoading(false);
      return;
    }

    fetchRevenueStreams();
  }, [user?.id]);

  return {
    revenueStreams,
    loading,
    addRevenueStream,
    deleteRevenueStream,
    refetch: fetchRevenueStreams
  };
};
