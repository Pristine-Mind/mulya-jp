'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-8 lg:px-12 py-3 sm:py-4 bg-cream/92 backdrop-blur-xl border-b border-vermilion/15">
      <div className="flex items-center gap-2 sm:gap-3">
        <div>
          <div className="font-serif text-lg sm:text-xl font-extrabold text-ink tracking-wide">
           Mulya
          </div>
          <div className="font-mono text-xs text-vermilion tracking-widest uppercase">
            <span className="hidden sm:inline">Japan Marketplace</span>
            <span className="sm:hidden">Japan Market</span>
          </div>
        </div>
      </div>
      
      <ul className="hidden md:flex gap-8 list-none">
        <li>
          <button 
            onClick={() => scrollToSection('features')}
            className="text-slate text-sm font-medium tracking-wide transition-colors duration-200 hover:text-vermilion relative group"
          >
            Features
            <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-vermilion transition-all duration-300 group-hover:w-full"></span>
          </button>
        </li>
        <li>
          <button 
            onClick={() => scrollToSection('supply')}
            className="text-slate text-sm font-medium tracking-wide transition-colors duration-200 hover:text-vermilion relative group"
          >
            Supply Chain
            <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-vermilion transition-all duration-300 group-hover:w-full"></span>
          </button>
        </li>
        <li>
          <button 
            onClick={() => scrollToSection('register')}
            className="text-slate text-sm font-medium tracking-wide transition-colors duration-200 hover:text-vermilion relative group"
          >
            Register
            <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-vermilion transition-all duration-300 group-hover:w-full"></span>
          </button>
        </li>
        <li>
          <button 
            onClick={() => scrollToSection('contact')}
            className="text-slate text-sm font-medium tracking-wide transition-colors duration-200 hover:text-vermilion relative group"
          >
            Contact
            <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-vermilion transition-all duration-300 group-hover:w-full"></span>
          </button>
        </li>
      </ul>
      
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={() => router.push('/login')}
          className="hidden sm:block bg-transparent text-slate border border-slate/30 px-4 sm:px-5 py-2 sm:py-2.5 font-medium text-xs sm:text-sm cursor-pointer tracking-wide transition-all duration-200 hover:border-vermilion hover:text-vermilion"
        >
          Login
        </button>
        <button 
          onClick={() => scrollToSection('register')}
          className="hidden sm:block bg-vermilion text-white border-none px-4 sm:px-6 py-2 sm:py-2.5 font-medium text-xs sm:text-sm cursor-pointer tracking-wide transition-all duration-200 hover:bg-deep-red hover:-translate-y-0.5"
        >
          <span className="hidden lg:inline">Register Now</span>
          <span className="lg:hidden">Register</span>
        </button>
        
        {/* Mobile register button */}
        <button 
          onClick={() => scrollToSection('register')}
          className="sm:hidden bg-vermilion text-white border-none px-3 py-1.5 font-medium text-xs cursor-pointer tracking-wide transition-all duration-200 hover:bg-deep-red"
        >
          Register
        </button>
        
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-slate"
        >
          <span className="sr-only">Open menu</span>
          <div className="w-6 h-6 flex flex-col justify-center space-y-1">
            <div className={`h-0.5 w-full bg-slate transition-all ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
            <div className={`h-0.5 w-full bg-slate transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></div>
            <div className={`h-0.5 w-full bg-slate transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
          </div>
        </button>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-cream border-b border-vermilion/15 md:hidden">
          <ul className="flex flex-col p-6 space-y-4">
            <li>
              <button 
                onClick={() => { router.push('/login'); setIsMenuOpen(false); }}
                className="text-slate text-sm font-medium tracking-wide hover:text-vermilion"
              >
                Login
              </button>
            </li>
            <li>
              <button 
                onClick={() => {scrollToSection('features'); setIsMenuOpen(false);}}
                className="text-slate text-sm font-medium tracking-wide hover:text-vermilion"
              >
                Features
              </button>
            </li>
            <li>
              <button 
                onClick={() => {scrollToSection('supply'); setIsMenuOpen(false);}}
                className="text-slate text-sm font-medium tracking-wide hover:text-vermilion"
              >
                Supply Chain
              </button>
            </li>
            <li>
              <button 
                onClick={() => {scrollToSection('register'); setIsMenuOpen(false);}}
                className="text-slate text-sm font-medium tracking-wide hover:text-vermilion"
              >
                Register
              </button>
            </li>
            <li>
              <button 
                onClick={() => {scrollToSection('register'); setIsMenuOpen(false);}}
                className="text-slate text-sm font-medium tracking-wide hover:text-vermilion"
              >
                Business Registration
              </button>
            </li>
            <li>
              <button 
                onClick={() => {scrollToSection('contact'); setIsMenuOpen(false);}}
                className="text-slate text-sm font-medium tracking-wide hover:text-vermilion"
              >
                Contact
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}