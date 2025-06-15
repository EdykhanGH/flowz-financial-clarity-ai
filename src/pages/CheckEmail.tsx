
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

const CheckEmail = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-[#1A1A1A]">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 text-center shadow-lg dark:bg-[#2D2D2D]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2">
            <Logo />
            <h1 className="text-2xl font-bold dark:text-white">Flowz</h1>
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Check your email
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We've sent a verification link to your email address. Please click the link to continue.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already verified?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CheckEmail;
