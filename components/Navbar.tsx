'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, Menu, X, Shield, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-primary-950/95 backdrop-blur-md shadow-lg h-[72px]">
      <div className="absolute inset-0 bg-grain-pattern opacity-5 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative h-[72px]">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <Image 
                src="/logo.png" 
                alt="Tomobilty Logo" 
                width={150} 
                height={60}
                className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {[
              { name: 'Accueil', path: '/' },
              { name: 'Nos Voitures', path: '/voitures' },
            ].map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`${
                  pathname === item.path 
                    ? 'text-gold-400 font-medium' 
                    : 'text-primary-100 hover:text-white'
                } transition-colors duration-300 text-sm tracking-wide uppercase`}
              >
                {item.name}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  href="/mes-reservations"
                  className={`${
                    pathname === '/mes-reservations' ? 'text-gold-400' : 'text-primary-100'
                  } hover:text-white transition-colors duration-300 text-sm tracking-wide uppercase`}
                >
                  Mes Réservations
                </Link>
                <Link
                  href="/loyalty"
                  className={`${
                    pathname === '/loyalty' ? 'text-gold-400' : 'text-primary-100'
                  } hover:text-white transition-colors duration-300 text-sm tracking-wide uppercase flex items-center space-x-1`}
                >
                  <Trophy className="h-4 w-4" />
                  <span>Fidélité</span>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className={`${
                      pathname.startsWith('/admin') ? 'text-gold-400' : 'text-primary-100'
                    } hover:text-white transition-colors duration-300 text-sm tracking-wide uppercase flex items-center space-x-1`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <div className="flex items-center space-x-4 pl-4 border-l border-primary-800">
                  <Link
                    href="/profil"
                    className="flex items-center space-x-2 text-primary-100 hover:text-gold-400 transition-colors group"
                  >
                    <div className="p-2 bg-primary-900 rounded-full group-hover:bg-primary-800 transition-colors">
                        <User className="h-4 w-4" />
                    </div>
                    <span className="font-serif italic">{user.prenom}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-primary-100 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/connexion"
                  className="text-primary-100 hover:text-white transition-colors text-sm tracking-wide uppercase"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="bg-gold-500 text-primary-950 px-5 py-2 rounded-full hover:bg-gold-400 transition-all duration-300 transform hover:-translate-y-0.5 font-medium text-sm shadow-lg shadow-gold-900/20"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-primary-100 hover:text-gold-400 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-primary-950/95 backdrop-blur-xl border-t border-primary-900/50 absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-primary-100 hover:bg-primary-900 hover:text-gold-400"
              onClick={() => setIsMenuOpen(false)}
            >
              Accueil
            </Link>
            <Link
              href="/voitures"
              className="block px-3 py-2 rounded-md text-primary-100 hover:bg-primary-900 hover:text-gold-400"
              onClick={() => setIsMenuOpen(false)}
            >
              Nos Voitures
            </Link>
            {user ? (
              <>
                <Link
                  href="/mes-reservations"
                  className="block px-3 py-2 rounded-md text-primary-100 hover:bg-primary-900 hover:text-gold-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mes Réservations
                </Link>
                <Link
                  href="/loyalty"
                  className="block px-3 py-2 rounded-md text-primary-100 hover:bg-primary-900 hover:text-gold-400 flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Trophy className="h-4 w-4" />
                  <span>Programme Fidélité</span>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 rounded-md text-primary-100 hover:bg-primary-900 hover:text-gold-400 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Administration</span>
                  </Link>
                )}
                <Link
                  href="/profil"
                  className="block px-3 py-2 rounded-md text-primary-100 hover:bg-primary-900 hover:text-gold-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mon Profil
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-red-400 hover:bg-primary-900"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <div className="pt-4 space-y-2">
                <Link
                  href="/connexion"
                  className="block w-full text-center px-3 py-2 rounded-md text-primary-100 border border-primary-800 hover:bg-primary-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="block w-full text-center px-3 py-2 rounded-md bg-gold-500 text-primary-950 font-medium hover:bg-gold-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
