"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';
import { AlertTriangle, ArrowLeft, RefreshCw, Home, Phone } from 'lucide-react';
import Link from 'next/link';

function ErrorContent() {
  const params = useSearchParams();
  
  const errorMessage = params.get('message') || params.get('error') || 'Une erreur inattendue s\'est produite lors du paiement';
  const errorCode = params.get('code') || params.get('ProcReturnCode');
  
  const formatAmount = (amount: string | null) => {
    if (!amount) return '';
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(amount));
  };

  const getErrorExplanation = (code: string | null) => {
    if (!code) return null;
    
    const explanations: { [key: string]: string } = {
      '99': 'Transaction refusée par la banque',
      '05': 'Transaction non autorisée',
      '12': 'Transaction invalide',
      '13': 'Montant invalide',
      '14': 'Numéro de carte invalide',
      '30': 'Erreur de format',
      '41': 'Carte perdue',
      '43': 'Carte volée',
      '51': 'Provision insuffisante',
      '54': 'Carte expirée',
      '57': 'Transaction non permise',
      '58': 'Transaction non permise au terminal',
      '61': 'Montant de retrait dépassé',
      '62': 'Carte restreinte',
      '65': 'Nombre de tentatives dépassé',
      '75': 'Nombre de tentatives de saisie du code confidentiel dépassé',
      '91': 'Émetteur de carte inaccessible',
      '96': 'Mauvais fonctionnement du système'
    };
    
    return explanations[code] || 'Erreur technique';
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-cream-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grain-pattern opacity-30 pointer-events-none"></div>
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-red-200 relative z-10 max-w-lg w-full mx-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-serif font-bold mb-4 text-primary-900">
          Erreur de Paiement
        </h1>
        
        <p className="text-primary-800 mb-6">
          {errorMessage}
        </p>

        {/* Détails de l'erreur */}
        {(params.get('booking_id') || params.get('amount') || errorCode) && (
          <div className="bg-red-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-red-900 mb-3">Détails de l'erreur</h3>
            <div className="space-y-2 text-sm">
              {params.get('booking_id') && (
                <div className="flex justify-between">
                  <span className="text-red-700">Réservation:</span>
                  <span className="font-medium">#{params.get('booking_id')}</span>
                </div>
              )}
              {params.get('amount') && (
                <div className="flex justify-between">
                  <span className="text-red-700">Montant:</span>
                  <span className="font-medium">{formatAmount(params.get('amount'))}</span>
                </div>
              )}
              {errorCode && (
                <div className="flex justify-between">
                  <span className="text-red-700">Code d'erreur:</span>
                  <span className="font-medium">{errorCode}</span>
                </div>
              )}
              {errorCode && getErrorExplanation(errorCode) && (
                <div className="flex justify-between">
                  <span className="text-red-700">Explication:</span>
                  <span className="font-medium">{getErrorExplanation(errorCode)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Solutions suggérées */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
          <h4 className="font-semibold text-blue-900 mb-2">Que faire maintenant ?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Vérifiez les informations de votre carte bancaire</li>
            <li>• Assurez-vous d'avoir suffisamment de fonds</li>
            <li>• Contactez votre banque si le problème persiste</li>
            <li>• Essayez avec une autre carte bancaire</li>
            <li>• Réessayez dans quelques minutes</li>
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
              className="text-primary-600 hover:text-primary-900 font-medium text-sm flex items-center justify-center"
            >
              <Phone className="h-4 w-4 mr-2" />
              Contacter le support
            </Link>
          </div>
        </div>

        {/* Note importante */}
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Important:</strong> Aucun montant n'a été débité de votre compte. 
            Votre réservation reste en attente de paiement.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaiementErreurPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={
        <div className="flex-grow flex items-center justify-center bg-cream-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }>
        <ErrorContent />
      </Suspense>
      <Footer />
    </div>
  );
}
