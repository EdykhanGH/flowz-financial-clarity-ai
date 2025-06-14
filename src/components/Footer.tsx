
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="bg-[#1A1A1A] text-gray-400">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Link to="/" className="flex items-center gap-2">
              <Logo />
              <span className="text-xl font-bold text-white">Flowz</span>
            </Link>
            <p className="mt-2 max-w-sm">AI-Powered Financial Clarity for Your Business Growth.</p>
          </div>
          <div className="flex gap-8">
            <div>
              <h3 className="font-semibold text-white mb-2">Product</h3>
              <ul>
                <li><Link to="#features" className="hover:text-primary">Features</Link></li>
                <li><Link to="#pricing" className="hover:text-primary">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Company</h3>
              <ul>
                <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Flowz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
