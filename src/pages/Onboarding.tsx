
import { useNavigate } from 'react-router-dom';
import BusinessOnboarding from '@/components/BusinessOnboarding';

const Onboarding = () => {
  const navigate = useNavigate();

  const handleOnboardingComplete = () => {
    navigate('/dashboard');
  };

  return <BusinessOnboarding onComplete={handleOnboardingComplete} />;
};

export default Onboarding;
