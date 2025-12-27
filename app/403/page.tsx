'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import Footer from '@/components/Footer';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 rounded-full">
              <ShieldAlert className="h-16 w-16 text-red-600" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Accès Interdit</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page. 
            Seuls les administrateurs peuvent accéder à cette section.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-primary-950 text-white rounded-lg hover:bg-primary-900 transition-colors"
            >
              Retour à l'accueil
            </Link>
            <Link
              href="/connexion"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
