
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="bg-[#1A1A1A] text-white">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-xl font-bold">Flowz</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/about" className="hover:text-primary">About</Link>
          <Link to="#features" className="hover:text-primary">Features</Link>
          <Link to="#pricing" className="hover:text-primary hidden md:block">Pricing</Link>
          <Link to="/contact" className="hover:text-primary hidden md:block">Contact</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" className="text-white hover:bg-[#2D2D2D] hover:text-white">Log In</Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-primary hover:bg-secondary text-white">Sign Up</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
