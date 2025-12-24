'use client';

import { useState, useEffect } from 'react';
import { loyaltyAPI } from '@/lib/loyaltyAPI';
import { 
  Gift, 
  Star, 
  Car, 
  Shield, 
  Percent, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Coins
} from 'lucide-react';

interface RewardsCatalogProps {
  loyaltyData: any;
  onRewardRedeemed: () => void;
}

export default function RewardsCatalog({ loyaltyData, onRewardRedeemed }: RewardsCatalogProps) {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const response = await loyaltyAPI.getAvailableRewards();
      setRewards(response.data.rewards);
    } catch (err) {
      setError('Erreur lors du chargement des récompenses');
      console.error('Failed to load rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (rewardId: number, rewardName: string, pointsCost: number) => {
    if (loyaltyData.account.points_balance < pointsCost) {
      setError('Points insuffisants pour cette récompense');
      return;
    }

    setRedeeming(rewardId);
    setError('');
    setSuccess('');

    try {
      await loyaltyAPI.redeemReward(rewardId);
      setSuccess(`Récompense "${rewardName}" échangée avec succès !`);
      onRewardRedeemed();
      loadRewards(); // Refresh rewards list
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'échange de la récompense');
    } finally {
      setRedeeming(null);
    }
  };

  const getRewardIcon = (rewardType: string) => {
    switch (rewardType.toLowerCase()) {
      case 'discount': return Percent;
      case 'upgrade': return Star;
      case 'free_rental': return Car;
      case 'insurance': return Shield;
      default: return Gift;
    }
  };

  const getRewardColor = (rewardType: string) => {
    switch (rewardType.toLowerCase()) {
      case 'discount': return 'text-green-600 bg-green-100';
      case 'upgrade': return 'text-purple-600 bg-purple-100';
      case 'free_rental': return 'text-blue-600 bg-blue-100';
      case 'insurance': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center">
            <Gift className="w-6 h-6 text-purple-500 mr-2" />
            Catalogue de Récompenses
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Échangez vos points contre des avantages exclusifs
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Points disponibles</p>
          <p className="text-2xl font-bold text-blue-600 flex items-center">
            <Coins className="w-5 h-5 mr-1" />
            {loyaltyData.account.points_balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward: any) => {
          const Icon = getRewardIcon(reward.reward_type);
          const canAfford = reward.can_afford;
          const isRedeeming = redeeming === reward.id;

          return (
            <div
              key={reward.id}
              className={`relative bg-white rounded-lg border-2 p-6 transition-all duration-300 ${
                canAfford 
                  ? 'border-green-200 hover:border-green-300 hover:shadow-md' 
                  : 'border-gray-200 opacity-75'
              }`}
            >
              {/* Reward Type Badge */}
              <div className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center ${getRewardColor(reward.reward_type)}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Reward Content */}
              <div className="pr-12">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {reward.name}
                </h4>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {reward.description}
                </p>

                {/* Points Cost */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-blue-500" />
                    <span className="text-lg font-bold text-blue-600">
                      {reward.points_cost.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">points</span>
                  </div>
                  
                  {reward.reward_value > 0 && (
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Valeur:</span>
                      <span className="text-lg font-semibold text-green-600 ml-1">
                        {reward.reward_value} MAD
                      </span>
                    </div>
                  )}
                </div>

                {/* Points Needed (if can't afford) */}
                {!canAfford && reward.points_needed > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-700 text-sm">
                      <strong>Points manquants:</strong> {reward.points_needed.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleRedeemReward(reward.id, reward.name, reward.points_cost)}
                  disabled={!canAfford || isRedeeming}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                    canAfford
                      ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isRedeeming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : canAfford ? (
                    <>
                      <Gift className="w-4 h-4" />
                      <span>Échanger</span>
                    </>
                  ) : (
                    <>
                      <span>Points insuffisants</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {rewards.length === 0 && (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune récompense disponible
          </h3>
          <p className="text-gray-600">
            Les récompenses seront bientôt disponibles. Continuez à gagner des points !
          </p>
        </div>
      )}

      {/* How to Earn More Points */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-800 mb-3">
          💡 Comment gagner plus de points ?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <h5 className="font-medium mb-2">Réservations régulières</h5>
            <ul className="space-y-1">
              <li>• 1 point par 10 MAD dépensés</li>
              <li>• Multiplicateur selon votre niveau</li>
              <li>• Bonus pour première réservation (+500 pts)</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">Bonus spéciaux</h5>
            <ul className="space-y-1">
              <li>• Locations 7+ jours: +100 points</li>
              <li>• Locations 30+ jours: +500 points</li>
              <li>• Upgrade de niveau: +100 points</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Points Exchange Rate */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Taux de change:</span>
          <span className="font-medium text-gray-900">100 points = 10 MAD de réduction</span>
        </div>
      </div>
    </div>
  );
}
