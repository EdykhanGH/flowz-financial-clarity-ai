import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Simulate signup process (replace with actual authentication later)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Success!",
        description: "Account created successfully. Redirecting to dashboard...",
      });

      // Navigate to dashboard after successful signup
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-[#1A1A1A]">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg dark:bg-[#2D2D2D]">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <Logo />
            <h1 className="text-2xl font-bold dark:text-white">Flowz</h1>
          </Link>
          <h2 className="mt-4 text-xl font-semibold dark:text-gray-300">Create an Account</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Start your journey to financial clarity.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email" className="dark:text-gray-300">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@company.com" 
              required 
              className="mt-1"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              required 
              className="mt-1"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="dark:text-gray-300">Confirm Password</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••" 
              required 
              className="mt-1"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-secondary"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
