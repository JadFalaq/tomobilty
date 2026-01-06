import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCar as Car, FaMapMarkerAlt as MapPin, FaCalendar as Calendar, 
  FaShieldAlt as Shield, FaCreditCard as CreditCard, FaUser as User,
  FaTimes as X, FaCheck as Check, FaExclamationTriangle as AlertTriangle,
  FaArrowLeft as ArrowLeft, FaDownload as Download
} from 'react-icons/fa';
import { bookingService } from '../services/booking.service';
import { formatDateForDisplay, formatPrice } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';

const GLASS = "bg-black/60 backdrop-blur-xl border border-white/10";

function SectionTitle({ subtitle, title }) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-[2px] bg-[#ff003c]" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff003c]">{subtitle}</span>
      </div>
      <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white leading-none tracking-tight">{title}</h2>
    </div>
  );
}

function BookingDetailPage({ bookingId, onBack, onCancel }) {
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    if (!user) {
      setError('Vous devez être connecté pour voir les détails de la réservation');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching booking details for ID:', bookingId);
      console.log('User authenticated:', !!user);
      const result = await bookingService.getBookingById(bookingId);
      console.log('Booking result:', result);
      
      if (result.success && result.booking) {
        setBooking(result.booking);
      } else {
        const errorMsg = result.error?.message || result.error?.error || 'Impossible de charger les détails de la réservation';
        console.error('Booking fetch error:', result.error);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Booking fetch exception:', err);
      setError('Une erreur est survenue lors du chargement: ' + err.message);
    }
    
    setLoading(false);
  };

  const handleCancelBooking = async () => {
    setCancelling(true);
    
    const result = await bookingService.cancelBooking(bookingId);
    
    if (result.success) {
      setBooking({ ...booking, statut: 'ANNULEE' });
      setShowCancelConfirm(false);
      if (onCancel) onCancel();
    } else {
      alert(result.error?.message || 'Erreur lors de l\'annulation');
    }
    
    setCancelling(false);
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'EN_ATTENTE': { label: 'En Attente', color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock },
      'CONFIRMEE': { label: 'Confirmée', color: 'text-green-500', bg: 'bg-green-500/10', icon: Check },
      'EN_COURS': { label: 'En Cours', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Car },
      'TERMINEE': { label: 'Terminée', color: 'text-gray-500', bg: 'bg-gray-500/10', icon: Check },
      'ANNULEE': { label: 'Annulée', color: 'text-red-500', bg: 'bg-red-500/10', icon: X }
    };
    return statusMap[status] || statusMap['EN_ATTENTE'];
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-40 px-6 flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-[#ff003c] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white/60 font-black uppercase tracking-widest text-sm italic">CHARGEMENT DES DÉTAILS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-32 pb-40 px-6 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2 justify-center">
              <div className="w-8 h-[2px] bg-[#ff003c]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff003c]">ERREUR</span>
              <div className="w-8 h-[2px] bg-[#ff003c]" />
            </div>
          </div>
          <div className="inline-block p-8 bg-[#ff003c]/10 border-2 border-[#ff003c]/30 rounded-[3rem] mb-6">
            <X size={64} className="text-[#ff003c]" />
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase italic tracking-tight">ERREUR LORS DE LA VÉRIFICATION</h3>
          <p className="text-xl font-bold text-white/60 mb-2">DE LA RÉSERVATION</p>
          <p className="text-sm text-white/40 mb-4 max-w-md mx-auto">{error}</p>
          {error.includes('500') || error.includes('serveur') ? (
            <p className="text-xs text-white/30 mb-8 max-w-md mx-auto">
              Le serveur backend rencontre un problème. Veuillez vérifier que le backend est démarré et que la réservation existe.
            </p>
          ) : null}
          <button
            onClick={onBack}
            className="px-12 py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-[#ff003c] hover:text-white transition-all shadow-2xl"
          >
            RETOUR
          </button>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const statusInfo = getStatusDisplay(booking.statut);
  const StatusIcon = statusInfo.icon;
  const canCancel = booking.statut === 'EN_ATTENTE' || booking.statut === 'CONFIRMEE';

  const calculateDays = () => {
    if (!booking.date_debut || !booking.date_fin) return 0;
    const start = new Date(booking.date_debut);
    const end = new Date(booking.date_fin);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const rentalDays = calculateDays();

  return (
    <div className="min-h-screen pt-32 pb-40 px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} /> Retour aux réservations
        </button>

        <SectionTitle subtitle="Détails" title="MA RÉSERVATION" />

        {/* Status Badge */}
        <div className="mb-8">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl ${statusInfo.bg} border border-white/10`}>
            <StatusIcon size={20} className={statusInfo.color} />
            <span className={`text-sm font-black uppercase italic ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Car Info */}
            <div className={`${GLASS} p-8 rounded-[3rem] border-white/5`}>
              <h3 className="text-xl font-black italic uppercase text-white mb-6 flex items-center gap-3">
                <Car className="text-[#ff003c]" /> Véhicule
              </h3>
              
              <div className="flex flex-col md:flex-row gap-6">
                <img
                  src={
                    booking.vehicle?.images?.[0]?.image_url ||
                    booking.car?.images?.[0]?.image_url ||
                    (typeof booking.vehicle?.images?.[0] === 'string' ? booking.vehicle.images[0] : null) ||
                    (typeof booking.car?.images?.[0] === 'string' ? booking.car.images[0] : null) ||
                    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800'
                  }
                  className="w-full h-40 object-cover rounded-3xl mb-8 grayscale hover:grayscale-0 transition-all duration-1000 shadow-2xl"
                  alt="Recap"
                />

                <div className="flex-1">
                  <h4 className="text-3xl font-black italic uppercase text-white tracking-tighter leading-none mb-6">
                    {booking.vehicle?.brand?.name || booking.car?.brand?.name || 'Marque'} <br />{' '}
                    <span className="text-transparent stroke-text">{booking.vehicle?.modele || booking.car?.modele || 'Modèle'}</span>
                  </h4>
                  <p className="text-xl font-bold text-white/60 mb-6">{booking.vehicle?.modele || booking.car?.modele || 'Modèle'}</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Places</p>
                      <p className="text-white font-bold">{booking.vehicle?.nombre_places || booking.car?.nombre_places || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Portes</p>
                      <p className="text-white font-bold">{booking.vehicle?.nombre_portes || booking.car?.nombre_portes || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Trans.</p>
                      <p className="text-white font-bold text-xs">{(booking.vehicle?.transmission || booking.car?.transmission)?.substring(0, 4) || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rental Period */}
            <div className={`${GLASS} p-8 rounded-[3rem] border-white/5`}>
              <h3 className="text-xl font-black italic uppercase text-white mb-6 flex items-center gap-3">
                <Calendar className="text-[#ff003c]" /> Période de Location
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Date de Début</p>
                  <p className="text-lg font-bold text-white">
                    {booking.date_debut ? formatDateForDisplay(booking.date_debut) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Date de Fin</p>
                  <p className="text-lg font-bold text-white">
                    {booking.date_fin ? formatDateForDisplay(booking.date_fin) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Durée</p>
                  <p className="text-lg font-bold text-[#ff003c]">
                    {rentalDays} jour{rentalDays > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Lieu de Retrait</p>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin size={14} className="text-[#ff003c]" />
                    {booking.pickup_site?.nom || 'Non spécifié'}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Lieu de Retour</p>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin size={14} className="text-[#ff003c]" />
                    {booking.return_site?.nom || 'Non spécifié'}
                  </p>
                </div>
              </div>
            </div>

            {/* Protection */}
            {booking.protection && (
              <div className={`${GLASS} p-8 rounded-[3rem] border-white/5`}>
                <h3 className="text-xl font-black italic uppercase text-white mb-6 flex items-center gap-3">
                  <Shield className="text-[#ff003c]" /> Protection
                </h3>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-black italic uppercase text-white">{booking.protection.type}</p>
                    <p className="text-sm text-white/60 mt-1">{booking.protection.description || 'Protection pour votre véhicule'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black italic text-[#ff003c]">+{booking.protection.frais_par_jour}</p>
                    <p className="text-[8px] font-black text-white/40 uppercase">MAD / JOUR</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className={`${GLASS} p-8 rounded-[3rem] border-white/5`}>
              <h3 className="text-xl font-black italic uppercase text-white mb-6 flex items-center gap-3">
                <CreditCard className="text-[#ff003c]" /> Paiement
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Mode de Paiement</p>
                  <p className="text-sm font-bold text-white uppercase">{booking.mode_paiement || 'Non spécifié'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Statut Paiement</p>
                  <p className="text-sm font-bold text-white uppercase">
                    {booking.payment?.statut || 'EN_ATTENTE'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              {/* Price Summary */}
              <div className={`${GLASS} p-8 rounded-[3rem] border-[#ff003c]/30`}>
                <h3 className="text-sm font-black uppercase text-white/40 mb-6 tracking-widest">Récapitulatif</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60 font-bold">Location ({rentalDays}j)</span>
                    <span className="text-white font-black">{formatPrice(booking.prix_total - (booking.protection?.frais_par_jour * rentalDays || 0))} MAD</span>
                  </div>
                  {booking.protection && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60 font-bold">Protection</span>
                      <span className="text-white font-black">+{formatPrice(booking.protection.frais_par_jour * rentalDays)} MAD</span>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-[#ff003c] uppercase mb-1 tracking-widest">TOTAL TTC</p>
                      <p className="text-4xl font-black italic text-white">{formatPrice(booking.prix_total)}</p>
                    </div>
                    <p className="text-xs font-black text-white/20 italic mb-1">MAD</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                {canCancel && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full py-4 bg-red-500/10 border border-red-500/30 text-red-500 font-black uppercase italic rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Annuler la Réservation
                  </button>
                )}
                
                <button
                  className="w-full py-4 bg-white/5 border border-white/10 text-white font-black uppercase italic rounded-2xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Télécharger Facture
                </button>
              </div>

              <div className="px-4 flex items-center gap-3 text-[8px] font-black uppercase text-white/20 tracking-[0.2em] italic">
                <Shield size={16} className="text-green-500 flex-shrink-0" /> Réservation Sécurisée
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${GLASS} p-10 rounded-[3rem] border-red-500/30 max-w-md w-full`}
          >
            <div className="text-center mb-8">
              <div className="inline-block p-6 bg-red-500/10 border border-red-500/30 rounded-3xl mb-4">
                <AlertTriangle size={48} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-black italic uppercase text-white mb-4">
                Annuler la Réservation ?
              </h3>
              <p className="text-white/60 font-bold">
                Cette action est irréversible. Êtes-vous sûr de vouloir annuler cette réservation ?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="py-4 bg-white/5 border border-white/10 text-white font-black uppercase italic rounded-2xl hover:bg-white hover:text-black transition-all"
              >
                Non, Garder
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="py-4 bg-red-500 text-white font-black uppercase italic rounded-2xl hover:bg-red-600 transition-all"
              >
                {cancelling ? 'Annulation...' : 'Oui, Annuler'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default BookingDetailPage;
