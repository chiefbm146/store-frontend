import { useState } from 'react';
import { Menu, X, Phone, Wrench } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-2">
            <Wrench className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-white">Cuzzins Mechanical</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#services" className="text-slate-300 hover:text-white transition-colors font-medium">
              Services
            </a>
            <a href="#projects" className="text-slate-300 hover:text-white transition-colors font-medium">
              Projects
            </a>
            <a href="#why-us" className="text-slate-300 hover:text-white transition-colors font-medium">
              Why Us
            </a>
            <a href="#contact" className="text-slate-300 hover:text-white transition-colors font-medium">
              Contact
            </a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <a
              href="tel:+1234567890"
              className="flex items-center space-x-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/30"
            >
              <Phone className="w-5 h-5" />
              <span>Get a Quote</span>
            </a>
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50">
          <div className="px-4 py-6 space-y-4">
            <a
              href="#services"
              className="block text-slate-300 hover:text-white transition-colors font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </a>
            <a
              href="#projects"
              className="block text-slate-300 hover:text-white transition-colors font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Projects
            </a>
            <a
              href="#why-us"
              className="block text-slate-300 hover:text-white transition-colors font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Why Us
            </a>
            <a
              href="#contact"
              className="block text-slate-300 hover:text-white transition-colors font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </a>
            <a
              href="tel:+1234567890"
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all duration-200 mt-4"
            >
              <Phone className="w-5 h-5" />
              <span>Get a Quote</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
