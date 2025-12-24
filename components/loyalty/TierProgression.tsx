'use client';

import React from 'react';
import { Trophy, Star, Crown, Gem, ArrowRight, CheckCircle } from 'lucide-react';

interface TierProgressionProps {
  loyaltyData: any;
  tiers: any[];
}

export default function TierProgression({ loyaltyData, tiers }: TierProgressionProps) {
  const { account, tier, next_tier } = loyaltyData;
  
  // Sort tiers by min_points
  const sortedTiers = [...tiers].sort((a, b) => a.min_points - b.min_points);
  
  // Get tier icons
  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'bronze': return Trophy;
      case 'argent': return Star;
      case 'or': return Crown;
      case 'platine': return Gem;
      default: return Trophy;
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'bronze': return 'text-amber-600 bg-amber-100';
      case 'argent': return 'text-gray-600 bg-gray-100';
      case 'or': return 'text-yellow-600 bg-yellow-100';
      case 'platine': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getBorderColor = (tierName: string, isActive: boolean) => {
    if (!isActive) return 'border-gray-200';
    
    switch (tierName.toLowerCase()) {
      case 'bronze': return 'border-amber-300 bg-amber-50';
      case 'argent': return 'border-gray-300 bg-gray-50';
      case 'or': return 'border-yellow-300 bg-yellow-50';
      case 'platine': return 'border-purple-300 bg-purple-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-semibold mb-6 flex items-center">
        <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
        Progression des Niveaux
      </h3>

      {/* Current Progress Bar */}
      {next_tier && next_tier.next_tier && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-800">
              Progression vers {next_tier.next_tier.name}
            </span>
            <span className="text-sm text-blue-600">
              {account.lifetime_points.toLocaleString()} / {next_tier.next_tier.min_points.toLocaleString()} points
            </span>
          </div>
          
          <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${Math.min((account.lifetime_points / next_tier.next_tier.min_points) * 100, 100)}%` 
              }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-blue-600">
            <span>Points actuels: {account.lifetime_points.toLocaleString()}</span>
            <span>Encore {next_tier.points_needed.toLocaleString()} points</span>
          </div>
        </div>
      )}

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedTiers.map((tierItem, index) => {
          const Icon = getTierIcon(tierItem.name);
          const isCurrentTier = tierItem.id === tier.id;
          const isUnlocked = account.lifetime_points >= tierItem.min_points;
          const isNext = next_tier?.next_tier?.id === tierItem.id;
          
          return (
            <div
              key={tierItem.id}
              className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
                isCurrentTier 
                  ? getBorderColor(tierItem.name, true) + ' ring-2 ring-blue-300'
                  : isUnlocked 
                    ? 'border-green-300 bg-green-50'
                    : isNext
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Current Tier Badge */}
              {isCurrentTier && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Actuel
                </div>
              )}

              {/* Unlocked Badge */}
              {isUnlocked && !isCurrentTier && (
                <div className="absolute -top-2 -right-2">
                  <CheckCircle className="w-6 h-6 text-green-500 bg-white rounded-full" />
                </div>
              )}

              <div className="text-center">
                {/* Tier Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  isCurrentTier || isUnlocked ? getTierColor(tierItem.name) : 'bg-gray-200 text-gray-400'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Tier Name */}
                <h4 className={`font-semibold mb-2 ${
                  isCurrentTier ? 'text-blue-800' : isUnlocked ? 'text-green-800' : 'text-gray-600'
                }`}>
                  {tierItem.name}
                </h4>

                {/* Points Required */}
                <p className="text-xs text-gray-600 mb-3">
                  {tierItem.min_points === 0 
                    ? 'Niveau de départ' 
                    : `${tierItem.min_points.toLocaleString()}+ points`
                  }
                </p>

                {/* Benefits */}
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-1 text-xs">
                    <span className="font-medium text-green-600">
                      {tierItem.discount_percent}% réduction
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-1 text-xs">
                    <span className="font-medium text-blue-600">
                      x{tierItem.points_multiplier} points
                    </span>
                  </div>
                </div>

                {/* Progress for Next Tier */}
                {isNext && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((account.lifetime_points / tierItem.min_points) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {((account.lifetime_points / tierItem.min_points) * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Benefits Comparison */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold mb-4">Comparaison des Avantages</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-700">Niveau</th>
                <th className="text-center py-2 px-3 font-medium text-gray-700">Points Requis</th>
                <th className="text-center py-2 px-3 font-medium text-gray-700">Réduction</th>
                <th className="text-center py-2 px-3 font-medium text-gray-700">Multiplicateur</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Avantages</th>
              </tr>
            </thead>
            <tbody>
              {sortedTiers.map((tierItem) => {
                const isCurrentTier = tierItem.id === tier.id;
                const isUnlocked = account.lifetime_points >= tierItem.min_points;
                
                return (
                  <tr 
                    key={tierItem.id}
                    className={`border-b border-gray-100 ${
                      isCurrentTier ? 'bg-blue-50' : isUnlocked ? 'bg-green-50' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        {React.createElement(getTierIcon(tierItem.name), { 
                          className: `w-4 h-4 ${isCurrentTier || isUnlocked ? getTierColor(tierItem.name).split(' ')[0] : 'text-gray-400'}` 
                        })}
                        <span className={`font-medium ${
                          isCurrentTier ? 'text-blue-800' : isUnlocked ? 'text-green-800' : 'text-gray-600'
                        }`}>
                          {tierItem.name}
                          {isCurrentTier && <span className="text-xs text-blue-600 ml-1">(Actuel)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {tierItem.min_points === 0 ? '-' : tierItem.min_points.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-green-600">
                      {tierItem.discount_percent}%
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-blue-600">
                      x{tierItem.points_multiplier}
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-600">
                      {tierItem.benefits || 'Avantages de base'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h5 className="font-medium text-yellow-800 mb-2">💡 Conseils pour progresser</h5>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Réservez régulièrement pour gagner plus de points</li>
          <li>• Les locations longues (7+ jours) donnent des points bonus</li>
          <li>• Votre première réservation vous rapporte 500 points bonus</li>
          <li>• Plus votre niveau est élevé, plus vous gagnez de points par MAD dépensé</li>
        </ul>
      </div>
    </div>
  );
}
