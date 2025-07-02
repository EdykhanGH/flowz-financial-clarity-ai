
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BusinessContext {
  category: string;
  description: string;
  businessModel: string;
  costCenters: string[];
  revenueStreams: string[];
  businessName: string;
  seasonalBusiness: boolean;
}

export const useBusinessContext = () => {
  return useQuery({
    queryKey: ['business-context'],
    queryFn: async (): Promise<BusinessContext | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return null;

      return {
        category: data.category || 'General',
        description: data.description || '',
        businessModel: data.business_model || '',
        costCenters: data.cost_centers || [],
        revenueStreams: data.revenue_streams || [],
        businessName: data.business_name || '',
        seasonalBusiness: data.seasonal_business || false
      };
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
};
