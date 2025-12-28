"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import { CheckCircle, XCircle, Clock, AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface PaymentResult {
  status: 'PAID' | 'FAILED' | 'CANCELED' | 'PENDING' | 'UNKNOWN';
  message: string;
  booking_id?: number;
  payment_id?: number;
  transaction_id?: string;
  amount?: number;
}

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processReturn = async () => {
      try {
        // Récupérer tous les paramètres de l'URL
        const params = new URLSearchParams(searchParams.toString());
        
        // Faire un appel à l'API backend pour traiter le retour
        const response = await api.get('/payments/return', { params: Object.fromEntries(params.entries()) });
        if (response.status === 200) {
          const data = response.data;
          if (data.success) {
            setResult({
              status: data.data.status,
              message: data.data.message,
              booking_id: data.data.booking_id,
              payment_id: data.data.payment_id,
              transaction_id: searchParams.get('TransId') || undefined,
              amount: parseFloat(searchParams.get('amount') || '0')
            });
          } else {
            setResult({
              status: 'FAILED',
              message: data.message || 'Erreur lors du traitement du paiement'
            });
          }
        } else {
          setResult({
            status: 'FAILED',
            message: 'Erreur de communication avec le serveur'
          });
        }
      } catch (error) {
        console.error('Erreur lors du traitement du retour:', error);
        setResult({
          status: 'FAILED',
          message: 'Une erreur inattendue s\'est produite'
        });
      } finally {
        setLoading(false);
      }
    };

    processReturn();
  }, [searchParams]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-16 w-16 text-red-600" />;
      case 'CANCELED':
        return <XCircle className="h-16 w-16 text-orange-600" />;
      case 'PENDING':
        return <Clock className="h-16 w-16 text-blue-600" />;
      default:
        return <AlertTriangle className="h-16 w-16 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-50 border-green-200';
      case 'FAILED':
        return 'bg-red-50 border-red-200';
      case 'CANCELED':
        return 'bg-orange-50 border-orange-200';
      case 'PENDING':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Paiement Confirmé';
      case 'FAILED':
        return 'Paiement Échoué';
      case 'CANCELED':
        return 'Paiement Annulé';
      case 'PENDING':
        return 'Paiement en Attente';
      default:
        return 'Statut Inconnu';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-cream-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-primary-900 mb-2">
            Traitement du paiement...
          </h2>
          <p className="text-primary-600">
            Veuillez patienter pendant que nous vérifions votre paiement
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-grow flex items-center justify-center bg-cream-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-200 max-w-md w-full mx-4">
          <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold mb-4 text-primary-900">
            Erreur de Traitement
          </h1>
          <p className="text-primary-800 mb-6">
            Impossible de traiter les informations de paiement
          </p>
          <Link 
            href="/mes-reservations"
            className="bg-primary-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-800 transition-colors inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux réservations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex items-center justify-center bg-cream-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grain-pattern opacity-30 pointer-events-none"></div>
      
      <div className={`
        text-center p-8 bg-white rounded-2xl shadow-xl border-2 relative z-10 max-w-lg w-full mx-4
        ${getStatusColor(result.status)}
      `}>
        <div className="mb-6">
          {getStatusIcon(result.status)}
        </div>

        <h1 className="text-3xl font-serif font-bold mb-4 text-primary-900">
          {getStatusTitle(result.status)}
        </h1>

        <p className="text-primary-800 mb-6">
          {result.message}
        </p>

        {/* Détails du paiement */}
        {(result.booking_id || result.payment_id || result.transaction_id || result.amount) && (
          <div className="bg-white bg-opacity-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-primary-900 mb-3">Détails du paiement</h3>
            <div className="space-y-2 text-sm">
              {result.booking_id && (
                <div className="flex justify-between">
                  <span className="text-primary-600">Réservation:</span>
                  <span className="font-medium">#{result.booking_id}</span>
                </div>
              )}
              {result.payment_id && (
                <div className="flex justify-between">
                  <span className="text-primary-600">Paiement:</span>
                  <span className="font-medium">#{result.payment_id}</span>
                </div>
              )}
              {result.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-primary-600">Transaction:</span>
                  <span className="font-medium text-xs">{result.transaction_id}</span>
                </div>
              )}
              {result.amount && result.amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-primary-600">Montant:</span>
                  <span className="font-medium">{formatAmount(result.amount)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col space-y-3">
          {result.status === 'PAID' ? (
            <>
              <Link 
                href="/mes-reservations"
                className="bg-primary-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-800 transition-colors flex items-center justify-center"
              >
                Voir mes réservations
              </Link>
              <Link 
                href="/"
                className="text-primary-600 hover:text-primary-900 font-medium text-sm flex items-center justify-center"
              >
                <Home className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Auto-redirection pour les paiements réussis */}
        {result.status === 'PAID' && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
              <div className="bg-green-500 h-1.5 rounded-full animate-pulse w-full"></div>
            </div>
            <p className="text-xs text-primary-500">
              Redirection automatique dans quelques secondes...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={
        <div className="flex-grow flex items-center justify-center bg-cream-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }>
        <PaymentReturnContent />
      </Suspense>
      <Footer />
    </div>
  );
}
