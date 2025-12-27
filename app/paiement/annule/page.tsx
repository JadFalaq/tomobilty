"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';
import { XCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

function CancelContent() {
  const params = useSearchParams();
  
  const formatAmount = (amount: string | null) => {
    if (!amount) return '';
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(amount));
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-cream-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grain-pattern opacity-30 pointer-events-none"></div>
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-orange-200 relative z-10 max-w-lg w-full mx-4">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-orange-600" />
        </div>
        
        <h1 className="text-3xl font-serif font-bold mb-4 text-primary-900">
          Paiement Annulé
        </h1>
        
        <p className="text-primary-800 mb-6">
          La transaction a été annulée. Aucun montant n'a été débité de votre compte.
        </p>

        {/* Détails de la transaction annulée */}
        {(params.get('booking_id') || params.get('amount') || params.get('TransId')) && (
          <div className="bg-orange-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-orange-900 mb-3">Détails de la transaction</h3>
            <div className="space-y-2 text-sm">
              {params.get('booking_id') && (
                <div className="flex justify-between">
                  <span className="text-orange-700">Réservation:</span>
                  <span className="font-medium">#{params.get('booking_id')}</span>
                </div>
              )}
              {params.get('amount') && (
                <div className="flex justify-between">
                  <span className="text-orange-700">Montant:</span>
                  <span className="font-medium">{formatAmount(params.get('amount'))}</span>
                </div>
              )}
              {params.get('TransId') && (
                <div className="flex justify-between">
                  <span className="text-orange-700">Transaction:</span>
                  <span className="font-medium text-xs">{params.get('TransId')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raisons possibles */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
          <h4 className="font-semibold text-blue-900 mb-2">Pourquoi le paiement a-t-il été annulé ?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Vous avez cliqué sur "Annuler" sur la page de paiement</li>
            <li>• Vous avez fermé la fenêtre de paiement</li>
            <li>• La session de paiement a expiré</li>
            <li>• Problème technique temporaire</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-3">
          {params.get('booking_id') && (
            <Link 
              href={`/voitures?retry_booking=${params.get('booking_id')}`}
              className="bg-primary-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-800 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer le paiement
            </Link>
          )}
          
          <Link 
            href="/mes-reservations"
            className="bg-gray-100 text-primary-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux réservations
          </Link>
          
          <div className="flex flex-col space-y-2">
            <Link 
              href="/"
              className="text-primary-600 hover:text-primary-900 font-medium text-sm flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Retour à l'accueil
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
    </div>
  );
}

export default function PaiementAnnulePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={
        <div className="flex-grow flex items-center justify-center bg-cream-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }>
        <CancelContent />
      </Suspense>
      <Footer />
    </div>
  );
}
