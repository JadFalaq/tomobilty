"use client";

import { useState, useEffect } from 'react';
import { CreditCard, Building2, Info } from 'lucide-react';
import { paymentsAPI } from '@/lib/api';

interface PaymentProvider {
  name: string;
  display_name: string;
  description: string;
  currency: string;
  supported_methods: string[];
  is_available: boolean;
}

interface PaymentProviderSelectorProps {
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  className?: string;
}

export default function PaymentProviderSelector({ 
  selectedProvider, 
  onProviderChange, 
  className = "" 
}: PaymentProviderSelectorProps) {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProvider, setCurrentProvider] = useState<string>('');

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await paymentsAPI.getProvidersInfo();
        setProviders(response.data.available_providers);
        setCurrentProvider(response.data.current_provider);
      } catch (error) {
        console.error('Erreur lors du chargement des providers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const getProviderIcon = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'cmi':
        return <Building2 className="h-5 w-5" />;
      case 'stripe':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getProviderColor = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'cmi':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'stripe':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="space-y-2">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="h-16 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-primary-900">
          Méthode de paiement
        </h3>
        <div className="flex items-center gap-1 text-sm text-primary-600">
          <Info className="h-4 w-4" />
          <span>Sécurisé</span>
        </div>
      </div>

      <div className="space-y-3">
        {providers.map((provider) => (
          <div
            key={provider.name}
            className={`
              relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200
              ${selectedProvider === provider.name 
                ? 'border-primary-500 bg-primary-50 shadow-md' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }
              ${!provider.is_available ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => provider.is_available && onProviderChange(provider.name)}
          >
            <div className="flex items-start gap-3">
              <div className={`
                p-2 rounded-lg ${getProviderColor(provider.name)}
              `}>
                {getProviderIcon(provider.name)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-primary-900">
                    {provider.display_name}
                  </h4>
                  {provider.name === currentProvider && (
                    <span className="px-2 py-1 text-xs bg-gold-100 text-gold-800 rounded-full">
                      Par défaut
                    </span>
                  )}
                  {!provider.is_available && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      Indisponible
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-primary-600 mb-2">
                  {provider.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-primary-500">
                  <span>Devise: {provider.currency}</span>
                  <span>•</span>
                  <span>Méthodes: {provider.supported_methods.join(', ')}</span>
                </div>
              </div>

              {selectedProvider === provider.name && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {providers.length === 0 && (
        <div className="text-center py-8 text-primary-600">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aucune méthode de paiement disponible</p>
        </div>
      )}
    </div>
  );
}
