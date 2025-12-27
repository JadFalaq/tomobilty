'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import { loyaltyAPI } from '@/lib/loyaltyAPI';
import LoyaltyOverview from '@/components/loyalty/LoyaltyOverview';
import TierProgression from '@/components/loyalty/TierProgression';
import RewardsCatalog from '@/components/loyalty/RewardsCatalog';
import TransactionHistory from '@/components/loyalty/TransactionHistory';
import LoyaltyExplanation from '@/components/loyalty/LoyaltyExplanation';
import { 
  Trophy, 
  Gift, 
  History, 
  Info,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function LoyaltyPage() {
  const router = useRouter();
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadLoyaltyData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/connexion?redirect=/loyalty');
          return;
        }

        // Load loyalty data and tiers in parallel
        const [loyaltyResponse, tiersResponse] = await Promise.all([
          loyaltyAPI.getUserLoyaltyInfo(),
          loyaltyAPI.getAllTiers()
        ]);

        setLoyaltyData(loyaltyResponse.data);
        setTiers(tiersResponse.data.tiers);
      } catch (err) {
        console.error('Failed to load loyalty data:', err);
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadLoyaltyData();
  }, [router]);

  const refreshLoyaltyData = async () => {
    try {
      const response = await loyaltyAPI.getUserLoyaltyInfo();
      setLoyaltyData(response.data);
    } catch (err) {
      console.error('Failed to refresh loyalty data:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Chargement de votre programme de fidélité...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Erreur lors du chargement</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Trophy },
    { id: 'rewards', label: 'Récompenses', icon: Gift },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'info', label: 'Comment ça marche', icon: Info }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Programme de Fidélité Tommobilty
          </h1>
          <p className="text-gray-600">
            Gagnez des points à chaque location et profitez de réductions exclusives
          </p>
        </div>

        {/* Quick Stats */}
        {loyaltyData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Niveau actuel</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loyaltyData?.tier?.name || '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">Pts</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Points disponibles</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(loyaltyData?.account?.points_balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">%</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Réduction actuelle</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loyaltyData?.tier?.discount_percent ?? 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">x</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Multiplicateur</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loyaltyData.tier.points_multiplier}x
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && loyaltyData && (
              <div className="space-y-8">
                <LoyaltyOverview 
                  loyaltyData={loyaltyData} 
                  tiers={tiers}
                  onRefresh={refreshLoyaltyData}
                />
                <TierProgression 
                  loyaltyData={loyaltyData} 
                  tiers={tiers} 
                />
              </div>
            )}

            {activeTab === 'rewards' && loyaltyData && (
              <RewardsCatalog 
                loyaltyData={loyaltyData}
                onRewardRedeemed={refreshLoyaltyData}
              />
            )}

            {activeTab === 'history' && loyaltyData && (
              <TransactionHistory />
            )}

            {activeTab === 'info' && (
              <LoyaltyExplanation tiers={tiers} />
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
