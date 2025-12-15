"use client";

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PaiementAnnulePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center bg-cream-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grain-pattern opacity-30 pointer-events-none"></div>
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-primary-100 relative z-10 max-w-md w-full mx-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-4 text-primary-900">Paiement Annulé</h1>
          <p className="text-primary-800 mb-8">La transaction a été annulée. Aucun montant n'a été débité de votre compte.</p>
          <div className="flex flex-col space-y-3">
            <Link 
              href="/mes-reservations"
              className="bg-primary-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-800 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux réservations
            </Link>
            <Link 
              href="/contact"
              className="text-primary-600 hover:text-primary-900 font-medium text-sm"
            >
              Besoin d'aide ? Contactez-nous
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
