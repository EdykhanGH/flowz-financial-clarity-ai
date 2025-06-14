
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Signup = () => {
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
        <form className="space-y-6">
          <div>
            <Label htmlFor="email" className="dark:text-gray-300">Email Address</Label>
            <Input id="email" type="email" placeholder="name@company.com" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="confirm-password" className="dark:text-gray-300">Confirm Password</Label>
            <Input id="confirm-password" type="password" placeholder="••••••••" required className="mt-1" />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-secondary">Create Account</Button>
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
