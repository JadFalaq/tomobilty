import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck as Check, FaTimes as X } from 'react-icons/fa';
import { carService } from '../services/car.service';
import { formatPrice } from '../utils/dateUtils';
import { getImageUrl } from '../utils/apiClient';
import ReservationFlow from './ReservationFlow';

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

function SearchResultsPage({ searchParams, onBookCar }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showReservation, setShowReservation] = useState(false);

  useEffect(() => {
    fetchAvailableCars();
  }, [searchParams]);

  const fetchAvailableCars = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        date_debut: searchParams.startDate,
        date_fin: searchParams.endDate,
      };

      if (searchParams.pickupSiteId) {
        params.pickup_site_id = searchParams.pickupSiteId;
      }
      if (searchParams.returnSiteId) {
        params.return_site_id = searchParams.returnSiteId;
      }

      const result = await carService.getAvailableCars(params);

      if (result.success) {
        setCars(result.cars);
      } else {
        setError(result.error?.message || 'Erreur lors de la recherche');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (!searchParams.startDate || !searchParams.endDate) return 0;
    const start = new Date(searchParams.startDate);
    const end = new Date(searchParams.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const rentalDays = calculateDays();

  return (
    <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto min-h-screen">
      <SectionTitle 
        subtitle="Résultats de Recherche" 
        title="VÉHICULES DISPONIBLES" 
      />

      <div className={`${GLASS} p-6 rounded-2xl mb-12 border-white/5`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Période</p>
            <p className="text-white font-bold">{rentalDays} jour{rentalDays > 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Début</p>
            <p className="text-white font-bold">
              {searchParams.startDate ? new Date(searchParams.startDate).toLocaleDateString('fr-FR') : '-'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Fin</p>
            <p className="text-white font-bold">
              {searchParams.endDate ? new Date(searchParams.endDate).toLocaleDateString('fr-FR') : '-'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Véhicules</p>
            <p className="text-[#ff003c] font-black text-xl">{cars.length}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#ff003c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60 font-bold uppercase tracking-widest text-sm">Recherche en cours...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <div className="inline-block p-6 bg-red-500/10 border border-red-500/30 rounded-3xl mb-4">
            <X size={48} className="text-red-500" />
          </div>
          <h3 className="text-2xl font-black text-white mb-4 uppercase italic">{error}</h3>
          <p className="text-white/60">Veuillez réessayer avec d'autres critères</p>
        </div>
      ) : cars.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-block p-6 bg-white/5 border border-white/10 rounded-3xl mb-4">
            <X size={48} className="text-white/40" />
          </div>
          <h3 className="text-2xl font-black text-white mb-4 uppercase italic">Aucun véhicule disponible</h3>
          <p className="text-white/60">Essayez de modifier vos dates ou votre lieu de retrait</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {cars.map((car) => {
            const imageUrl =
              (car.primaryImage && car.primaryImage.image_url) ||
              (Array.isArray(car.images) && car.images.length > 0
                ? (car.images.find((img) => img.is_primary)?.image_url ||
                   (typeof car.images[0] === 'string' ? car.images[0] : car.images[0]?.image_url))
                : null);
            
            const finalImageUrl = getImageUrl(imageUrl);
            
            const dailyPrice = car.pricing?.daily_price || car.prix_par_jour;
            const totalPrice = car.pricing?.total_price || (dailyPrice * rentalDays);

            return (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-[#0a0a0a] rounded-[3rem] border border-white/5 overflow-hidden transition-all hover:border-[#ff003c]/30"
              >
                <div className="h-72 overflow-hidden relative">
                  <img src={finalImageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" alt={car.modele} />
                  <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <span className="text-[10px] font-black text-white uppercase italic tracking-tighter">
                      {formatPrice(dailyPrice)} MAD / JOUR
                    </span>
                  </div>
                  <div className="absolute top-6 right-6 bg-[#ff003c] backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                    <div className="flex items-center gap-2">
                      <Check size={12} className="text-white" />
                      <span className="text-[10px] font-black text-white uppercase italic tracking-tighter">
                        DISPONIBLE
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-10">
                  <h4 className="text-[10px] font-black text-[#ff003c] uppercase tracking-widest mb-1">
                    {car.brand?.name || 'Marque'}
                  </h4>
                  <h3 className="text-3xl font-black italic uppercase text-white mb-4 leading-none">
                    {car.modele}
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4 mb-6 pb-6 border-b border-white/10">
                    <div className="text-center">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Trans.</p>
                      <p className="text-white font-bold text-xs">{car.transmission?.substring(0, 4) || '-'}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">Prix Total</p>
                    <p className="text-4xl font-black italic text-[#ff003c]">
                      {formatPrice(totalPrice)} <span className="text-lg text-white/60">MAD</span>
                    </p>
                    <p className="text-[10px] text-white/40 font-bold mt-1">
                      pour {rentalDays} jour{rentalDays > 1 ? 's' : ''}
                    </p>
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedCar(car);
                      setShowReservation(true);
                    }}
                    className="w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-[#ff003c] hover:text-white transition-all shadow-xl"
                  >
                    RÉSERVER MAINTENANT
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showReservation && selectedCar && (
          <ReservationFlow
            car={selectedCar}
            searchParams={searchParams}
            onClose={() => {
              setShowReservation(false);
              setSelectedCar(null);
            }}
            onComplete={(booking) => {
              setShowReservation(false);
              setSelectedCar(null);
              if (onBookCar) onBookCar(booking);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchResultsPage;
