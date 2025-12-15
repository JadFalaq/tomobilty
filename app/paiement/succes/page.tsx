"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { reservationsAPI } from '@/lib/api';
import { CheckCircle } from 'lucide-react';

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const run = async () => {
      const resId = params.get('res_id');
      const amount = params.get('amount');
      if (!resId) return;
      try { await reservationsAPI.confirmerReservation(resId, { montant_paye: Number(amount || 0) }); setTimeout(() => router.push('/mes-reservations'), 2000); } catch(e){ console.error(e); }
    };
    run();
  }, [params, router]);
  return (
    <div className="flex-grow flex items-center justify-center bg-cream-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grain-pattern opacity-30 pointer-events-none"></div>
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-primary-100 relative z-10 max-w-md w-full mx-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-serif font-bold mb-4 text-primary-900">Paiement Confirmé</h1>
        <p className="text-primary-800 mb-6">Votre réservation a été validée avec succès. Vous allez être redirigé vers vos réservations.</p>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
          <div className="bg-gold-500 h-1.5 rounded-full animate-pulse w-full"></div>
        </div>
      </div>
    </div>
  );
}

export default function PaiementSuccesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Suspense fallback={<div className="flex-grow flex items-center justify-center bg-cream-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>}>
        <SuccessContent />
      </Suspense>
      <Footer />
    </div>
  );
}
