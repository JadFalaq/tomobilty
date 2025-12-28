"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import { reservationsAPI } from '@/lib/api';
import { CheckCircle, Home, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    const run = async () => {
      const resId = params.get('res_id') || params.get('booking_id');
      const amount = params.get('amount') || params.get('montant');
      
      if (!resId) return;
      
      try { 
        await reservationsAPI.confirmerReservation(resId, { 
          montant_paye: Number(amount || 0) 
        }); 
        
        // Redirection automatique après 3 secondes
        setTimeout(() => router.push('/mes-reservations'), 3000); 
      } catch(e){ 
        console.error('Erreur confirmation réservation:', e); 
      }
    };
    run();
  }, [params, router]);

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
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-green-200 relative z-10 max-w-lg w-full mx-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-serif font-bold mb-4 text-primary-900">
          Paiement Confirmé
        </h1>
        
        <p className="text-primary-800 mb-6">
          Votre réservation a été validée avec succès. Vous allez être redirigé vers vos réservations.
        </p>

        {/* Détails du paiement */}
        {(params.get('res_id') || params.get('amount')) && (
          <div className="bg-green-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-green-900 mb-3">Détails de la réservation</h3>
            <div className="space-y-2 text-sm">
              {params.get('res_id') && (
                <div className="flex justify-between">
                  <span className="text-green-700">Réservation:</span>
                  <span className="font-medium">#{params.get('res_id')}</span>
                </div>
              )}
              {params.get('amount') && (
                <div className="flex justify-between">
                  <span className="text-green-700">Montant payé:</span>
                  <span className="font-medium">{formatAmount(params.get('amount'))}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col space-y-3 mb-6">
          <Link 
            href="/mes-reservations"
            className="bg-primary-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-800 transition-colors flex items-center justify-center"
          >
            Voir mes réservations
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
          <Link 
            href="/"
            className="text-primary-600 hover:text-primary-900 font-medium text-sm flex items-center justify-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
          <div className="bg-green-500 h-1.5 rounded-full animate-pulse w-full"></div>
        </div>
        <p className="text-xs text-primary-500">
          Redirection automatique dans quelques secondes...
        </p>
      </div>
    </div>
  );
}

export default function PaiementSuccesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<div className="flex-grow flex items-center justify-center bg-cream-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>}>
        <SuccessContent />
      </Suspense>
      <Footer />
    </div>
  );
}
