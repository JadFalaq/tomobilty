'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthorization = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      // Not authenticated - redirect to login
      if (!token || !userStr) {
        router.push('/connexion?redirect=/admin');
        return;
      }

      try {
        const userData = JSON.parse(userStr);
        
        // Not an admin - redirect to 403 Forbidden
        if (userData.role !== 'ADMIN') {
          router.push('/403');
          return;
        }

        // Authorized admin user
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/connexion?redirect=/admin');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthorization();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary-950 mx-auto mb-4 animate-pulse" />
          <div className="text-xl text-gray-700">Vérification des autorisations...</div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Router will handle redirect
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/admin" className="text-xl font-bold text-black">
                Tommobilty Admin
              </a>
              <div className="ml-10 flex space-x-2">
                <a href="/admin" className="px-3 py-2 rounded text-sm font-medium text-black hover:bg-black hover:text-white transition-colors">
                  Dashboard
                </a>
                <a href="/admin/users" className="px-3 py-2 rounded text-sm font-medium text-black hover:bg-black hover:text-white transition-colors">
                  Utilisateurs
                </a>
                <a href="/admin/cars" className="px-3 py-2 rounded text-sm font-medium text-black hover:bg-black hover:text-white transition-colors">
                  Voitures
                </a>
                <a href="/admin/bookings" className="px-3 py-2 rounded text-sm font-medium text-black hover:bg-black hover:text-white transition-colors">
                  Réservations
                </a>
                <a href="/admin/payments" className="px-3 py-2 rounded text-sm font-medium text-black hover:bg-black hover:text-white transition-colors">
                  Paiements
                </a>
                <a href="/admin/reviews" className="px-3 py-2 rounded text-sm font-medium text-black hover:bg-black hover:text-white transition-colors">
                  Avis
                </a>
                <a href="/admin/maintenance" className="px-3 py-2 rounded text-sm font-medium text-black hover:bg-black hover:text-white transition-colors">
                  Maintenance
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <a href="/admin/settings" className="px-4 py-2 rounded bg-white text-black hover:bg-black hover:text-white border-2 border-black transition-colors text-sm font-medium">
                Paramètres
              </a>
              <a href="/" className="px-4 py-2 rounded bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-colors text-sm font-medium">
                Retour au site
              </a>
            </div>
          </div>
        </div>
      </nav>
      <main className="bg-white">{children}</main>
    </div>
  );
}
