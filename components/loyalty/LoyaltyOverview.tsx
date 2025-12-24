'use client';

import { useState } from 'react';
import { loyaltyAPI } from '@/lib/loyaltyAPI';
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Gift,
  Calculator,
  Coins,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface LoyaltyOverviewProps {
  loyaltyData: any;
  tiers: any[];
  onRefresh: () => void;
}

export default function LoyaltyOverview({ loyaltyData, tiers, onRefresh }: LoyaltyOverviewProps) {
  const [redeemAmount, setRedeemAmount] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');

  // Safety checks for undefined data
  if (!loyaltyData || !loyaltyData.account || !loyaltyData.tier) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Chargement des données de fidélité...</p>
      </div>
    );
  }

  const { account, tier, next_tier, available_rewards } = loyaltyData;

  const handleRedeemPoints = async () => {
    if (!redeemAmount || parseInt(redeemAmount) < 100) {
      setRedeemError('Minimum 100 points requis pour un échange');
      return;
    }

    if (parseInt(redeemAmount) > (account?.points_balance || 0)) {
      setRedeemError('Points insuffisants');
      return;
    }

    setIsRedeeming(true);
    setRedeemError('');
    setRedeemSuccess('');

    try {
      const result = await loyaltyAPI.redeemPoints(parseInt(redeemAmount));
      setRedeemSuccess(`${redeemAmount} points échangés contre ${result.data.discount_amount} MAD de réduction !`);
      setRedeemAmount('');
      onRefresh();
    } catch (error) {
      setRedeemError(error.message || 'Erreur lors de l\'échange');
    } finally {
      setIsRedeeming(false);
    }
  };

  const discountValue = redeemAmount ? (parseInt(redeemAmount) / 10) : 0;

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Votre Statut Actuel</h3>
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-300" />
              <div>
                <p className="text-2xl font-bold">{tier?.name || 'Bronze'}</p>
                <p className="text-blue-100 text-sm">
                  {account?.points_balance?.toLocaleString() || '0'} points disponibles
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Réduction actuelle</p>
            <p className="text-3xl font-bold">{tier?.discount_percent || 0}%</p>
            <p className="text-blue-100 text-sm">Multiplicateur x{tier?.points_multiplier || 1}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Points Exchange */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Coins className="w-6 h-6 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold">Échanger des Points</h3>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            Échangez vos points contre des réductions (100 points = 10 MAD)
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de points à échanger
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  max={account?.points_balance || 0}
                  step="100"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 100 points"
                />
                <div className="absolute right-3 top-2 text-sm text-gray-500">
                  / {account?.points_balance?.toLocaleString() || '0'}
                </div>
              </div>
            </div>

            {redeemAmount && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700">Réduction obtenue:</span>
                  <span className="font-semibold text-green-800">
                    {discountValue} MAD
                  </span>
                </div>
              </div>
            )}

            {redeemError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-700 text-sm">{redeemError}</p>
              </div>
            )}

            {redeemSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-green-700 text-sm">{redeemSuccess}</p>
              </div>
            )}

            <button
              onClick={handleRedeemPoints}
              disabled={isRedeeming || !redeemAmount || parseInt(redeemAmount) < 100}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
            >
              {isRedeeming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>Échanger les Points</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Star className="w-6 h-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold">Actions Rapides</h3>
          </div>

          <div className="space-y-3">
            {/* Next Tier Info */}
            {next_tier && next_tier.next_tier && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">
                    Prochain niveau: {next_tier.next_tier.name}
                  </span>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xs text-blue-600">
                  Plus que {next_tier.points_needed.toLocaleString()} points
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(next_tier.progress_percentage || 0)}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Available Rewards Count */}
            <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-md">
              <div className="flex items-center space-x-2">
                <Gift className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">
                  Récompenses disponibles
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-purple-800">
                  {available_rewards?.filter(r => r.can_afford).length || 0}
                </span>
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </div>
            </div>

            {/* Lifetime Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <p className="text-lg font-bold text-gray-900">
                  {account?.lifetime_points?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-600">Points gagnés</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <p className="text-lg font-bold text-gray-900">
                  {account?.total_spent?.toLocaleString() || '0'} MAD
                </p>
                <p className="text-xs text-gray-600">Total dépensé</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Vos Avantages Actuels</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-600 font-bold">{tier?.discount_percent || 0}%</span>
            </div>
            <p className="font-medium text-gray-900">Réduction Automatique</p>
            <p className="text-sm text-gray-600">Sur toutes vos locations</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 font-bold">x{tier?.points_multiplier || 1}</span>
            </div>
            <p className="font-medium text-gray-900">Multiplicateur Points</p>
            <p className="text-sm text-gray-600">Gagnez plus de points</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Gift className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-medium text-gray-900">Récompenses Exclusives</p>
            <p className="text-sm text-gray-600">Échangez vos points</p>
          </div>
        </div>
        
        {tier?.benefits && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Avantages {tier?.name}:</strong> {tier.benefits}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
