'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { reservationsAPI, authAPI } from '@/lib/api';
import { formatDate, formatPrice, calculerNombreJours, getStatutBadgeColor, getStatutLabel } from '@/lib/utils';
import { Calendar, MapPin, Car, X, Gift, ArrowRight, TrendingUp } from 'lucide-react';

export default function MesReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/connexion?redirect=/mes-reservations');
      return;
    }
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      // Charger les réservations
      const resReservations = await reservationsAPI.obtenirMesReservations();
      setReservations(resReservations.data);

      // Charger le profil utilisateur pour les points
      const resUser = await authAPI.obtenirProfil();
      setUser(resUser.data);
      // Mettre à jour le localStorage si nécessaire
      localStorage.setItem('user', JSON.stringify(resUser.data));
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const annulerReservation = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      await reservationsAPI.annulerReservation(id);
      alert('Réservation annulée avec succès');
      chargerDonnees();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  };

  const confirmerReservation = async (id: string, prixTotal: number) => {
    if (!confirm('Confirmer le paiement de cette réservation ?')) {
      return;
    }

    try {
      await reservationsAPI.confirmerReservation(id, { montantPaye: prixTotal });
      alert('Réservation confirmée avec succès');
      chargerDonnees();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la confirmation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-800">Chargement...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-grow bg-cream-50 py-12 relative">
        <div className="absolute inset-0 bg-grain-pattern opacity-30 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-primary-900 font-serif">Mes Réservations</h1>
            <div className="h-1 w-20 bg-gold-500 rounded-full"></div>
          </div>

          {/* Section Fidélité */}
          {user && (
            <div className="bg-gradient-to-r from-primary-900 to-primary-800 rounded-2xl p-8 mb-10 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-gold-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="bg-gold-500/20 p-4 rounded-full backdrop-blur-sm border border-gold-500/30">
                    <Gift className="h-10 w-10 text-gold-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-serif mb-1">Programme de Fidélité</h2>
                    <p className="text-primary-200">
                      Vous avez actuellement <span className="text-gold-400 font-bold text-xl">{user.pointsFidelite || 0} points</span>
                    </p>
                    <p className="text-xs text-primary-300 mt-1">1 Point = 5 DH de réduction sur vos prochaines locations</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-center md:items-end gap-3">
                  <p className="text-sm font-medium text-center md:text-right text-primary-100 max-w-xs">
                    Envie de gagner plus de points pour votre prochaine aventure ?
                  </p>
                  <button
                    onClick={() => router.push('/voitures')}
                    className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-gold-500/30 flex items-center gap-2 group"
                  >
                    <TrendingUp className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    Réserver et gagner des points
                  </button>
                </div>
              </div>
            </div>
          )}

          {reservations.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-16 text-center">
              <div className="bg-primary-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car className="h-12 w-12 text-primary-300" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-primary-900 mb-2">Aucune réservation</h3>
              <p className="text-primary-800 text-lg mb-8 max-w-md mx-auto">
                Vous n'avez pas encore effectué de réservation. Découvrez notre flotte et planifiez votre prochain voyage.
              </p>
              <button
                onClick={() => router.push('/voitures')}
                className="bg-primary-900 text-white px-8 py-3 rounded-full font-semibold hover:bg-gold-500 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                Parcourir nos voitures
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {reservations.map((reservation: any) => (
                <div key={reservation._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-primary-100/50 group">
                  <div className="md:flex">
                    {/* Image de la voiture */}
                    <div className="md:w-1/3 relative overflow-hidden">
                      <div className="relative h-64 md:h-full bg-primary-50">
                        {reservation.voiture?.images && reservation.voiture.images.length > 0 ? (
                          <img
                            src={reservation.voiture.images[0]}
                            alt={`${reservation.voiture.marque} ${reservation.voiture.modele}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-20 w-20 text-primary-200" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/30 to-transparent"></div>
                      </div>
                    </div>

                    {/* Détails de la réservation */}
                    <div className="md:w-2/3 p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-primary-900 font-serif mb-1">
                            {reservation.voiture?.marque} {reservation.voiture?.modele}
                          </h3>
                          <p className="text-sm text-primary-700 font-medium uppercase tracking-wider">
                            Réservation #{reservation._id.slice(-8)}
                          </p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${getStatutBadgeColor(reservation.statut)}`}>
                          {getStatutLabel(reservation.statut)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="flex items-start space-x-4 bg-cream-50 p-4 rounded-xl border border-primary-50">
                          <Calendar className="h-6 w-6 text-gold-500 mt-1" />
                          <div>
                            <p className="text-xs font-bold text-primary-700 uppercase tracking-wide mb-1">Période</p>
                            <p className="font-semibold text-primary-900">
                              {formatDate(reservation.dateDebut)} - {formatDate(reservation.dateFin)}
                            </p>
                            <p className="text-sm text-primary-800 mt-1">
                              {calculerNombreJours(reservation.dateDebut, reservation.dateFin)} jour(s)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-4 bg-cream-50 p-4 rounded-xl border border-primary-50">
                          <MapPin className="h-6 w-6 text-gold-500 mt-1" />
                          <div>
                            <p className="text-xs font-bold text-primary-700 uppercase tracking-wide mb-1">Lieux</p>
                            <div className="space-y-1">
                              <p className="text-sm text-primary-800"><span className="font-semibold">Départ:</span> {reservation.lieuPriseEnCharge}</p>
                              <p className="text-sm text-primary-800"><span className="font-semibold">Retour:</span> {reservation.lieuRetour}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-primary-100">
                        <div>
                          <p className="text-sm text-primary-700 font-medium uppercase tracking-wide mb-1">Prix total</p>
                          <div className="flex items-center space-x-3">
                            <p className="text-3xl font-bold text-primary-900 font-serif">
                              {formatPrice(reservation.prixTotal)}
                            </p>
                            {reservation.paiementEffectue && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center">
                                <span className="mr-1">✓</span> Payé
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          {reservation.statut === 'en_attente' && (
                            <>
                              <button
                                onClick={() => confirmerReservation(reservation._id, reservation.prixTotal)}
                                className="bg-primary-900 text-white px-5 py-2.5 rounded-full hover:bg-green-600 transition-colors text-sm font-semibold shadow-md hover:shadow-lg"
                              >
                                Payer maintenant
                              </button>
                              <button
                                onClick={() => annulerReservation(reservation._id)}
                                className="bg-white text-red-500 border border-red-200 px-5 py-2.5 rounded-full hover:bg-red-50 transition-colors text-sm font-semibold flex items-center space-x-2"
                              >
                                <X className="h-4 w-4" />
                                <span>Annuler</span>
                              </button>
                            </>
                          )}
                          {reservation.statut === 'confirmée' && (
                            <button
                              onClick={() => router.push(`/reservations/${reservation._id}`)}
                              className="bg-gold-500 text-white px-6 py-2.5 rounded-full hover:bg-gold-600 transition-colors text-sm font-bold shadow-md hover:shadow-lg"
                            >
                              Voir les détails
                            </button>
                          )}
                        </div>
                      </div>

                      {reservation.commentaires && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-800">
                            <span className="font-semibold">Commentaires:</span> {reservation.commentaires}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}