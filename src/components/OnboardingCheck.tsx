
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const OnboardingCheck = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    const checkBusinessProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking business profile:', error);
          setProfileExists(true); // Let user pass on error
        } else if (!data) {
          setProfileExists(false);
          navigate('/onboarding');
        } else {
          setProfileExists(true);
        }
      } catch (err) {
        console.error(err);
        setProfileExists(true); // Let user pass on error
      } finally {
        setChecking(false);
      }
    };

    if (user) {
        checkBusinessProfile();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || checking || !profileExists) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-[#1A1A1A]">
        <div className="text-lg dark:text-white">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default OnboardingCheck;
