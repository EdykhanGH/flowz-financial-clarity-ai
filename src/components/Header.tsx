
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
        <div className="flex items-center gap-6">
          {/* Mobile: 2x2 grid layout */}
          <div className="md:hidden grid grid-cols-2 gap-4">
            <Link to="/about" className="hover:text-primary text-center">About</Link>
            <Link to="/signup">
              <Button className="bg-primary hover:bg-secondary text-white w-full">Sign Up</Button>
            </Link>
            <Link to="/features" className="hover:text-primary text-center">Features</Link>
            <Link to="/login">
              <Button variant="ghost" className="text-white hover:bg-[#2D2D2D] hover:text-white w-full">Log In</Button>
            </Link>
          </div>
          
          {/* Desktop: traditional layout */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/about" className="hover:text-primary">About</Link>
            <Link to="/features" className="hover:text-primary">Features</Link>
            <Link to="#pricing" className="hover:text-primary">Pricing</Link>
            <Link to="/contact" className="hover:text-primary">Contact</Link>
          </nav>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-white hover:bg-[#2D2D2D] hover:text-white">Log In</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-primary hover:bg-secondary text-white">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
