'use client';

import { 
  Trophy, 
  Star, 
  Crown, 
  Gem, 
  Gift, 
  Percent, 
  TrendingUp,
  Car,
  Calendar,
  Award,
  Coins,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface LoyaltyExplanationProps {
  tiers: any[];
}

export default function LoyaltyExplanation({ tiers }: LoyaltyExplanationProps) {
  const sortedTiers = [...tiers].sort((a, b) => a.min_points - b.min_points);

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
      case 'bronze': return 'from-amber-400 to-amber-600';
      case 'argent': return 'from-gray-400 to-gray-600';
      case 'or': return 'from-yellow-400 to-yellow-600';
      case 'platine': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div className="text-center bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
        <h2 className="text-3xl font-bold mb-4">
          Programme de Fidélité Tommobilty
        </h2>
        <p className="text-xl text-blue-100 max-w-3xl mx-auto">
          Plus vous louez avec nous, plus vous économisez ! 
          Gagnez des points à chaque réservation et profitez d'avantages exclusifs.
        </p>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Coins className="w-8 h-8 text-blue-500 mr-3" />
          Comment ça fonctionne
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">1. Réservez</h4>
            <p className="text-gray-600">
              Réservez une voiture et profitez de votre location. 
              Votre compte de fidélité est créé automatiquement.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">2. Gagnez des Points</h4>
            <p className="text-gray-600">
              Gagnez 1 point par 10 MAD dépensés, avec des bonus selon votre niveau 
              et la durée de location.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">3. Profitez des Avantages</h4>
            <p className="text-gray-600">
              Échangez vos points contre des réductions ou profitez automatiquement 
              des remises de votre niveau.
            </p>
          </div>
        </div>
      </div>

      {/* Points System */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Coins className="w-8 h-8 text-green-500 mr-3" />
          Système de Points
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earning Points */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Comment gagner des points</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Coins className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">Points de base</p>
                  <p className="text-sm text-green-600">1 point par 10 MAD dépensés</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-800">Multiplicateur de niveau</p>
                  <p className="text-sm text-blue-600">x1.0 à x3.0 selon votre niveau</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Award className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-800">Points bonus</p>
                  <p className="text-sm text-purple-600">Première réservation, locations longues</p>
                </div>
              </div>
            </div>
          </div>

          {/* Using Points */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Comment utiliser vos points</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Percent className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-yellow-800">Réduction directe</p>
                  <p className="text-sm text-yellow-600">100 points = 10 MAD de réduction</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Gift className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-800">Récompenses exclusives</p>
                  <p className="text-sm text-red-600">Surclassements, assurances gratuites</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-indigo-800">Réduction automatique</p>
                  <p className="text-sm text-indigo-600">Selon votre niveau de fidélité</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bonus System */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Award className="w-8 h-8 text-orange-500 mr-3" />
          Système de Bonus
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-green-800 mb-2">Première Réservation</h4>
            <p className="text-2xl font-bold text-green-600 mb-1">+500</p>
            <p className="text-sm text-green-600">points bonus</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-blue-800 mb-2">Location 7+ jours</h4>
            <p className="text-2xl font-bold text-blue-600 mb-1">+100</p>
            <p className="text-sm text-blue-600">points bonus</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-purple-800 mb-2">Location 30+ jours</h4>
            <p className="text-2xl font-bold text-purple-600 mb-1">+500</p>
            <p className="text-sm text-purple-600">points bonus</p>
          </div>
        </div>
      </div>

      {/* Loyalty Tiers */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
          Niveaux de Fidélité
        </h3>

        <div className="space-y-4">
          {sortedTiers.map((tier, index) => {
            const Icon = getTierIcon(tier.name);
            const gradientClass = getTierColor(tier.name);

            return (
              <div key={tier.id} className="relative">
                <div className={`bg-gradient-to-r ${gradientClass} rounded-lg p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <Icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold">{tier.name}</h4>
                        <p className="text-sm opacity-90">
                          {tier.min_points === 0 
                            ? 'Niveau de départ' 
                            : `${tier.min_points.toLocaleString()}+ points`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold">{tier.discount_percent}%</p>
                          <p className="text-sm opacity-90">Réduction</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold">x{tier.points_multiplier}</p>
                          <p className="text-sm opacity-90">Multiplicateur</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {tier.benefits && (
                    <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                      <p className="text-sm opacity-90">
                        <strong>Avantages:</strong> {tier.benefits}
                      </p>
                    </div>
                  )}
                </div>

                {/* Arrow to next tier */}
                {index < sortedTiers.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Questions Fréquentes
        </h3>

        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-semibold text-gray-900 mb-2">
              Quand est-ce que je reçois mes points ?
            </h4>
            <p className="text-gray-600">
              Vos points sont crédités automatiquement dès la confirmation de votre réservation. 
              Les points bonus sont ajoutés selon les conditions (première réservation, durée, etc.).
            </p>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-semibold text-gray-900 mb-2">
              Mes points expirent-ils ?
            </h4>
            <p className="text-gray-600">
              Vos points expirent après 12 mois d'inactivité. Pour maintenir vos points actifs, 
              il suffit de faire une réservation au moins une fois par an.
            </p>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-semibold text-gray-900 mb-2">
              Comment puis-je monter de niveau ?
            </h4>
            <p className="text-gray-600">
              Votre niveau est déterminé par le total de points que vous avez gagnés dans votre historique. 
              Plus vous réservez, plus vous montez de niveau automatiquement.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Puis-je combiner plusieurs avantages ?
            </h4>
            <p className="text-gray-600">
              Oui ! Vous bénéficiez automatiquement de la réduction de votre niveau, et vous pouvez 
              en plus échanger vos points contre des réductions supplémentaires ou des récompenses.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-8 text-white">
        <Gift className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
        <h3 className="text-2xl font-bold mb-4">
          Prêt à commencer ?
        </h3>
        <p className="text-lg text-green-100 mb-6 max-w-2xl mx-auto">
          Réservez votre première voiture dès maintenant et commencez à gagner des points ! 
          Votre compte de fidélité sera créé automatiquement.
        </p>
        <a
          href="/voitures"
          className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          <Car className="w-5 h-5" />
          <span>Voir les Voitures</span>
          <ArrowRight className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
