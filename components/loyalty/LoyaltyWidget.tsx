'use client';

import { useState, useEffect } from 'react';
import { loyaltyAPI } from '@/lib/loyaltyAPI';
import { 
  Trophy, 
  Star, 
  Coins, 
  Percent, 
  Gift,
  TrendingUp,
  Loader2,
  Info
} from 'lucide-react';

interface LoyaltyWidgetProps {
  bookingAmount?: number;
  showCalculator?: boolean;
  compact?: boolean;
}

export default function LoyaltyWidget({ 
  bookingAmount = 0, 
  showCalculator = true, 
  compact = false 
}: LoyaltyWidgetProps) {
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [pointsCalculation, setPointsCalculation] = useState<any>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  useEffect(() => {
    if (bookingAmount > 0 && loyaltyData) {
      calculateBookingBenefits();
    }
  }, [bookingAmount, loyaltyData]);

  const loadLoyaltyData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await loyaltyAPI.getUserLoyaltyInfo();
      setLoyaltyData(response.data);
    } catch (err) {
      console.error('Failed to load loyalty data:', err);
      setError('Erreur lors du chargement des données de fidélité');
    } finally {
      setLoading(false);
    }
  };

  const calculateBookingBenefits = async () => {
    if (!bookingAmount || !loyaltyData) return;

    try {
      const [pointsResponse, discountResponse] = await Promise.all([
        loyaltyAPI.calculatePoints(bookingAmount),
        loyaltyAPI.calculateDiscount(bookingAmount)
      ]);

      setPointsCalculation(pointsResponse.data);
      setDiscount(discountResponse.data.discount_amount);
    } catch (err) {
      console.error('Failed to calculate booking benefits:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
          <span className="text-blue-700 text-sm">Chargement des avantages fidélité...</span>
        </div>
      </div>
    );
  }

  if (error || !loyaltyData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <Info className="w-5 h-5 text-yellow-600 mr-2" />
          <div>
            <p className="text-yellow-800 font-medium text-sm">Programme de Fidélité</p>
            <p className="text-yellow-700 text-xs">
              Connectez-vous pour voir vos avantages fidélité
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { account, tier } = loyaltyData;

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Niveau {tier.name}
              </p>
              <p className="text-xs text-gray-600">
                {account.points_balance.toLocaleString()} points
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-bold text-green-600">
              -{tier.discount_percent}%
            </p>
            <p className="text-xs text-gray-600">Réduction</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-300" />
            <div>
              <h3 className="font-semibold">Programme de Fidélité</h3>
              <p className="text-blue-100 text-sm">Niveau {tier.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{account.points_balance.toLocaleString()}</p>
            <p className="text-blue-100 text-sm">points disponibles</p>
          </div>
        </div>
      </div>

      {/* Current Benefits */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Percent className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-700">{tier.discount_percent}%</p>
            <p className="text-xs text-green-600">Réduction automatique</p>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Star className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-700">x{tier.points_multiplier}</p>
            <p className="text-xs text-blue-600">Multiplicateur points</p>
          </div>
        </div>

        {/* Booking Benefits */}
        {showCalculator && bookingAmount > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
              Avantages pour cette réservation
            </h4>
            
            <div className="space-y-3">
              {/* Discount Applied */}
              {discount > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Percent className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Réduction niveau {tier.name}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    -{discount.toFixed(0)} MAD
                  </span>
                </div>
              )}

              {/* Points to Earn */}
              {pointsCalculation && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Points à gagner
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">
                      +{pointsCalculation.pointsWithMultiplier}
                    </span>
                    <p className="text-xs text-blue-600">
                      {pointsCalculation.basePoints} × {pointsCalculation.tierMultiplier}
                    </p>
                  </div>
                </div>
              )}

              {/* Bonus Points Info */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Gift className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Points bonus possibles</p>
                    <ul className="text-xs text-yellow-700 mt-1 space-y-0.5">
                      <li>• Première réservation: +500 points</li>
                      <li>• Location 7+ jours: +100 points</li>
                      <li>• Location 30+ jours: +500 points</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-sm">
            <a 
              href="/loyalty" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Voir mon programme fidélité →
            </a>
            {account.points_balance >= 100 && (
              <span className="text-green-600 font-medium">
                {Math.floor(account.points_balance / 100) * 10} MAD disponibles
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
