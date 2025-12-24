"use client";

import { useState } from 'react';
import { Loader2, CreditCard, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import { paymentsAPI } from '@/lib/api';
import PaymentProviderSelector from './PaymentProviderSelector';

interface PaymentProcessorProps {
  bookingId: number;
  amount: number;
  currency?: string;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function PaymentProcessor({
  bookingId,
  amount,
  currency = 'MAD',
  onSuccess,
  onError,
  className = ""
}: PaymentProcessorProps) {
  const [selectedProvider, setSelectedProvider] = useState('cmi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!bookingId || !amount) {
      setError('Informations de réservation manquantes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const paymentData = {
        booking_id: bookingId,
        amount: amount,
        currency: currency,
        provider: selectedProvider
      };

      const response = await paymentsAPI.createPaymentSession(paymentData);
      
      if (response.data.success) {
        const { payment_url, payment_id, provider } = response.data.data;
        
        // Pour CMI, rediriger vers l'URL de paiement
        if (provider === 'cmi' && payment_url) {
          window.location.href = payment_url;
        } else if (provider === 'stripe') {
          // Pour Stripe, utiliser la logique existante si nécessaire
          if (onSuccess) {
            onSuccess(response.data.data);
          }
        }
      } else {
        throw new Error(response.data.message || 'Erreur lors de la création du paiement');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du paiement';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
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

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-primary-100 p-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary-100 rounded-xl">
          <CreditCard className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-serif font-bold text-primary-900">
            Finaliser le paiement
          </h2>
          <p className="text-primary-600">
            Montant à payer: <span className="font-semibold text-primary-900">{formatAmount(amount)}</span>
          </p>
        </div>
      </div>

      {/* Sélecteur de provider */}
      <PaymentProviderSelector
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        className="mb-6"
      />

      {/* Informations de sécurité */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-900 mb-1">
              Paiement sécurisé
            </h4>
            <p className="text-sm text-green-700">
              Vos informations bancaires sont protégées par un cryptage SSL 256 bits. 
              Nous ne stockons aucune donnée de carte bancaire.
            </p>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">
                Erreur de paiement
              </h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bouton de paiement */}
      <button
        onClick={handlePayment}
        disabled={loading || !selectedProvider}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200
          flex items-center justify-center gap-3
          ${loading || !selectedProvider
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-primary-900 hover:bg-primary-800 hover:shadow-lg transform hover:-translate-y-0.5'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Traitement en cours...
          </>
        ) : (
          <>
            Procéder au paiement
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>

      {/* Informations supplémentaires */}
      <div className="mt-4 text-center">
        <p className="text-xs text-primary-500">
          En cliquant sur "Procéder au paiement", vous acceptez nos{' '}
          <a href="/conditions" className="text-primary-600 hover:underline">
            conditions générales
          </a>{' '}
          et notre{' '}
          <a href="/confidentialite" className="text-primary-600 hover:underline">
            politique de confidentialité
          </a>
        </p>
      </div>
    </div>
  );
}
