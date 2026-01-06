import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaShieldAlt as ShieldCheck, FaCheck as Check, FaTimes as X, FaChevronRight as ChevronRight,
  FaArrowLeft as ArrowLeft, FaUser as User, FaEnvelope as Mail, FaClock as Clock,
  FaIdCard as IdCard, FaBriefcase as Briefcase, FaCreditCard as CreditCard, FaWallet as Wallet,
  FaMapMarkerAlt as MapPin, FaHome as Home, FaGlobe as Globe, FaMap as Map, FaBolt as Zap,
  FaShieldAlt as Shield
} from 'react-icons/fa';
import { protectionService } from '../services/protection.service';
import { bookingService } from '../services/booking.service';
import { useAuth } from '../contexts/AuthContext';

const GLASS = "bg-black/60 backdrop-blur-xl border border-white/10";

function SectionTitle({ subtitle, title }) {
  return (
    <div className="mb-12 text-left">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-[2px] bg-[#ff003c]" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff003c]">{subtitle}</span>
      </div>
      <h2 className="text-4xl md:text-5xl font-black italic uppercase text-white leading-none tracking-tight">{title}</h2>
    </div>
  );
}

function ReservationFlow({ car, searchParams, onClose, onComplete }) {
  const { user } = useAuth();
  const [step, setStep] = useState('protection');
  const [protections, setProtections] = useState([]);
  const [selectedProt, setSelectedProt] = useState(null);
  const [paymentMode, setPaymentMode] = useState('EN_LIGNE');
  const [loading, setLoading] = useState(false);

  const [billingInfo, setBillingInfo] = useState({
    country: "Maroc",
    city: "",
    zipCode: "",
    address: ""
  });

  const [pilotInfo, setPilotInfo] = useState({
    fullName: user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : "",
    email: user?.email || "",
    phone: user?.telephone || "",
    idNumber: "",
    licenseNumber: "",
    certifyAge: false,
    certifyLicenseOld: false
  });

  useEffect(() => {
    fetchProtections();
  }, []);

  const fetchProtections = async () => {
    const result = await protectionService.getProtections();
    if (result.success) {
      setProtections(result.protections);
      if (result.protections.length > 0) {
        setSelectedProt(result.protections[0]);
      }
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

  const durationDays = calculateDays();
  const dailyPrice = car.pricing?.daily_price || car.prix_par_jour;
  // Use the total price from search results if available, otherwise calculate
  const subtotal = car.pricing?.total_price || (dailyPrice * durationDays);
  const protectionTotal = selectedProt ? (selectedProt.frais_par_jour || 0) * durationDays : 0;
  const totalAmount = subtotal + protectionTotal;

  const isFormValid = useMemo(() => {
    return (
      pilotInfo.fullName.length > 2 &&
      pilotInfo.email.includes("@") &&
      pilotInfo.phone.length > 5 &&
      pilotInfo.idNumber.length > 3 &&
      pilotInfo.licenseNumber.length > 3 &&
      pilotInfo.certifyAge &&
      pilotInfo.certifyLicenseOld &&
      billingInfo.city.length > 1 &&
      billingInfo.address.length > 5
    );
  }, [pilotInfo, billingInfo]);

  const handleFinalConfirm = async () => {
    if (!isFormValid) return;
    
    setLoading(true);
    try {
      const bookingData = {
        carId: car.id,
        dateDebut: searchParams.startDate,
        dateFin: searchParams.endDate,
        pickupSiteId: searchParams.pickupSiteId,
        returnSiteId: searchParams.returnSiteId,
        modePaiement: paymentMode,
        protectionId: selectedProt?.id,
        pilotInfo,
        billingInfo
      };

      const result = await bookingService.createBooking(bookingData);
      
      if (result.success) {
        if (paymentMode === 'EN_LIGNE' && result.booking.payment_url) {
          window.location.href = result.booking.payment_url;
        } else {
          onComplete(result.booking.id);
        }
      } else {
        alert(result.error?.message || 'Erreur lors de la création de la réservation');
      }
    } catch (err) {
      alert('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl overflow-y-auto"
    >
      <div className="min-h-screen pt-32 pb-40 px-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onClose}
            className="mb-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} /> Fermer
          </button>

          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 space-y-10">
              <AnimatePresence mode="wait">
                {/* STEP 1: PROTECTION */}
                {step === 'protection' && (
                  <motion.div
                    key="step-p"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <SectionTitle subtitle="Protocol_Step_01" title="CHOISIR VOTRE PROTECTION" />

                    <div className="grid gap-6">
                      {protections.map((prot) => (
                        <div
                          key={prot.id}
                          onClick={() => setSelectedProt(prot)}
                          className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden group ${
                            selectedProt?.id === prot.id
                              ? 'bg-[#ff003c]/5 border-[#ff003c] shadow-lg'
                              : 'bg-[#0a0a0a] border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-xl ${
                                  selectedProt?.id === prot.id
                                    ? 'bg-[#ff003c] text-white'
                                    : 'bg-white/5 text-white/40'
                                }`}
                              >
                                <ShieldCheck size={24} />
                              </div>
                              <div className="text-left">
                                <h3 className="text-xl font-black italic uppercase text-white">
                                  {prot.type}
                                </h3>
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                  {prot.description || 'Protection pour votre véhicule'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black italic text-white leading-none">
                                +{prot.frais_par_jour}
                              </p>
                              <p className="text-[8px] font-black text-[#ff003c] uppercase italic">
                                MAD / J
                              </p>
                            </div>
                          </div>

                          {prot.proprietes && (
                            <div className="grid grid-cols-2 gap-y-3">
                              {Object.entries(prot.proprietes).map(([key, value]) => (
                                <div
                                  key={key}
                                  className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/50"
                                >
                                  {value ? (
                                    <Check size={12} className="text-green-500" />
                                  ) : (
                                    <X size={12} className="text-red-500/30" />
                                  )}
                                  <span>{key.replace(/_/g, ' ')}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {selectedProt?.id === prot.id && (
                            <motion.div
                              layoutId="check-active"
                              className="absolute top-6 right-6 text-[#ff003c]"
                            >
                              <Check size={24} strokeWidth={3} />
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setStep('checkout')}
                      className="mt-12 w-full py-6 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-[#ff003c] hover:text-white transition-all shadow-2xl flex items-center justify-center gap-3 group"
                    >
                      VALIDER ET CONTINUER{' '}
                      <ChevronRight
                        size={20}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </button>
                  </motion.div>
                )}

                {/* STEP 2: CHECKOUT */}
                {step === 'checkout' && (
                  <motion.div
                    key="step-c"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-10"
                  >
                    <button
                      onClick={() => setStep('protection')}
                      className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-white mb-6"
                    >
                      <ArrowLeft size={14} /> Retour à la protection
                    </button>

                    <SectionTitle
                      subtitle="Protocol_Step_02"
                      title="COORDONNÉES ET FACTURATION"
                    />

                    {/* Pilot Info */}
                    <div className={`${GLASS} p-10 rounded-[3rem] border-white/5 shadow-xl`}>
                      <h3 className="text-xl font-black italic uppercase text-white mb-8 border-b border-white/5 pb-4">
                        Profil Pilote
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest block">
                            Nom Complet
                          </label>
                          <div className="relative group">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                            <input
                              type="text"
                              value={pilotInfo.fullName}
                              onChange={(e) =>
                                setPilotInfo({ ...pilotInfo, fullName: e.target.value })
                              }
                              placeholder="Prénom Nom"
                              className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest block">
                            E-mail
                          </label>
                          <div className="relative group">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                            <input
                              type="email"
                              value={pilotInfo.email}
                              onChange={(e) =>
                                setPilotInfo({ ...pilotInfo, email: e.target.value })
                              }
                              placeholder="pilote@elite.ma"
                              className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest block">
                            Téléphone
                          </label>
                          <div className="relative group">
                            <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                            <input
                              type="text"
                              value={pilotInfo.phone}
                              onChange={(e) =>
                                setPilotInfo({ ...pilotInfo, phone: e.target.value })
                              }
                              placeholder="+212 ..."
                              className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest block">
                            CIN / Passeport
                          </label>
                          <div className="relative group">
                            <IdCard className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                            <input
                              type="text"
                              value={pilotInfo.idNumber}
                              onChange={(e) =>
                                setPilotInfo({ ...pilotInfo, idNumber: e.target.value })
                              }
                              placeholder="Numéro d'identité"
                              className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-3 sm:col-span-2">
                          <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest block">
                            Numéro de Permis
                          </label>
                          <div className="relative group">
                            <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                            <input
                              type="text"
                              value={pilotInfo.licenseNumber}
                              onChange={(e) =>
                                setPilotInfo({ ...pilotInfo, licenseNumber: e.target.value })
                              }
                              placeholder="Référence du permis"
                              className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all"
                            />
                          </div>
                        </div>

                        {/* Certifications */}
                        <div className="sm:col-span-2 pt-4 space-y-4">
                          <label className="flex items-start gap-4 cursor-pointer group">
                            <div
                              className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                                pilotInfo.certifyAge
                                  ? 'bg-[#ff003c] border-[#ff003c]'
                                  : 'bg-white/5 border-white/10 group-hover:border-[#ff003c]'
                              }`}
                            >
                              {pilotInfo.certifyAge && (
                                <Check size={14} className="text-white" strokeWidth={4} />
                              )}
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={pilotInfo.certifyAge}
                                onChange={(e) =>
                                  setPilotInfo({ ...pilotInfo, certifyAge: e.target.checked })
                                }
                              />
                            </div>
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest italic">
                              Je certifie avoir <span className="text-white">plus de 21 ans</span>.
                            </span>
                          </label>
                          <label className="flex items-start gap-4 cursor-pointer group">
                            <div
                              className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                                pilotInfo.certifyLicenseOld
                                  ? 'bg-[#ff003c] border-[#ff003c]'
                                  : 'bg-white/5 border-white/10 group-hover:border-[#ff003c]'
                              }`}
                            >
                              {pilotInfo.certifyLicenseOld && (
                                <Check size={14} className="text-white" strokeWidth={4} />
                              )}
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={pilotInfo.certifyLicenseOld}
                                onChange={(e) =>
                                  setPilotInfo({
                                    ...pilotInfo,
                                    certifyLicenseOld: e.target.checked,
                                  })
                                }
                              />
                            </div>
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest italic">
                              Mon permis a{' '}
                              <span className="text-white">plus de deux ans</span> d'ancienneté.
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className={`${GLASS} p-10 rounded-[3rem] border-white/5 shadow-xl`}>
                      <h3 className="text-xl font-black italic uppercase text-white mb-8 border-b border-white/5 pb-4 flex items-center gap-3">
                        <CreditCard className="text-[#ff003c]" /> Méthode de Règlement
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={() => setPaymentMode('EN_LIGNE')}
                          className={`py-8 border rounded-2xl font-black uppercase italic text-[10px] flex flex-col items-center gap-3 transition-all ${
                            paymentMode === 'EN_LIGNE'
                              ? 'border-[#ff003c] bg-[#ff003c]/10 shadow-[0_0_20px_rgba(255,0,60,0.2)]'
                              : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'
                          }`}
                        >
                          <Wallet size={24} /> Paiement Online (CMI)
                        </button>
                        <button
                          onClick={() => setPaymentMode('AGENCE')}
                          className={`py-8 border rounded-2xl font-black uppercase italic text-[10px] flex flex-col items-center gap-3 transition-all ${
                            paymentMode === 'AGENCE'
                              ? 'border-[#ff003c] bg-[#ff003c]/10 shadow-[0_0_20px_rgba(255,0,60,0.2)]'
                              : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'
                          }`}
                        >
                          <MapPin size={24} /> Sur Place à l'Agence
                        </button>
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className={`${GLASS} p-10 rounded-[3rem] border-white/5 shadow-xl`}>
                      <h3 className="text-xl font-black italic uppercase text-white mb-8 border-b border-white/5 pb-4 flex items-center gap-3">
                        <Home className="text-[#ff003c]" /> Adresse de Facturation
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest block">
                            Pays / Région
                          </label>
                          <div className="relative group">
                            <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                            <input
                              type="text"
                              value={billingInfo.country}
                              onChange={(e) =>
                                setBillingInfo({ ...billingInfo, country: e.target.value })
                              }
                              placeholder="Maroc"
                              className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest block">
                            Ville
                          </label>
                          <div className="relative group">
                            <Map className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                            <input
                              type="text"
                              value={billingInfo.city}
                              onChange={(e) =>
                                setBillingInfo({ ...billingInfo, city: e.target.value })
                              }
                              placeholder="Casablanca"
                              className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest block">
                            Code Postal
                          </label>
                          <input
                            type="text"
                            value={billingInfo.zipCode}
                            onChange={(e) =>
                              setBillingInfo({ ...billingInfo, zipCode: e.target.value })
                            }
                            placeholder="20000"
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all"
                          />
                        </div>
                        <div className="space-y-3 sm:col-span-2">
                          <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest block">
                            Adresse de la rue
                          </label>
                          <input
                            type="text"
                            value={billingInfo.address}
                            onChange={(e) =>
                              setBillingInfo({ ...billingInfo, address: e.target.value })
                            }
                            placeholder="Numéro et nom de la rue"
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <button
                        onClick={handleFinalConfirm}
                        disabled={!isFormValid || loading}
                        className={`w-full py-7 font-black uppercase italic rounded-[2rem] transition-all flex items-center justify-center gap-4 group shadow-2xl ${
                          isFormValid && !loading
                            ? 'bg-white text-black hover:bg-[#ff003c] hover:text-white cursor-pointer'
                            : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        {loading ? 'TRAITEMENT...' : isFormValid ? 'CONFIRMER LA RÉSERVATION' : 'CRITÈRES REQUIS'}
                        {isFormValid && !loading && (
                          <Zap size={24} className="group-hover:fill-current" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT COLUMN: SUMMARY */}
            <div className="lg:col-span-4">
              <div className="sticky top-32 space-y-6">
                <motion.div
                  layout
                  className={`${GLASS} p-10 rounded-[4rem] border-[#ff003c]/30 shadow-2xl relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Shield size={120} />
                  </div>

                  <img
                    src={
                      car.images && car.images.length > 0
                        ? typeof car.images[0] === 'string'
                          ? car.images[0]
                          : car.images[0]?.image_url
                        : 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800'
                    }
                    className="w-full h-40 object-cover rounded-3xl mb-8 grayscale hover:grayscale-0 transition-all duration-1000 shadow-2xl"
                    alt="Recap"
                  />

                  <h4 className="text-3xl font-black italic uppercase text-white tracking-tighter leading-none mb-6">
                    {car.brand?.name} <br />{' '}
                    <span className="text-transparent stroke-text">{car.modele}</span>
                  </h4>

                  <div className="space-y-4 border-t border-white/10 pt-6">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black uppercase text-white/30 italic">Pilote</p>
                      <p className="text-[10px] font-bold text-white uppercase truncate max-w-[120px]">
                        {pilotInfo.fullName || '...'}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black uppercase text-white/30 italic">Période</p>
                      <p className="text-[10px] font-bold text-white uppercase tracking-tighter">
                        {durationDays} jour{durationDays > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black uppercase text-white/30 italic">
                        Protection
                      </p>
                      <p className="text-xs font-black text-[#ff003c] uppercase italic tracking-widest">
                        {selectedProt?.type || 'STANDARD'}
                      </p>
                    </div>

                    {(billingInfo.city || billingInfo.address) && (
                      <div className="flex justify-between items-start border-t border-white/5 pt-4">
                        <p className="text-[9px] font-black uppercase text-white/30 italic">
                          Facture
                        </p>
                        <p className="text-[9px] font-bold text-white uppercase tracking-tighter max-w-[150px]">
                          {billingInfo.address} {billingInfo.city && `, ${billingInfo.city}`}{' '}
                          {billingInfo.zipCode && `(${billingInfo.zipCode})`}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-10 pt-10 border-t-2 border-dashed border-white/10 space-y-4">
                    <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase italic">
                      <span>Location ({durationDays}j)</span>
                      <span>{subtotal.toLocaleString()} MAD</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase italic">
                      <span>Pack Protection</span>
                      <span>+{protectionTotal.toLocaleString()} MAD</span>
                    </div>

                    <div className="flex justify-between items-end pt-8 border-t border-[#ff003c]/30 mt-8">
                      <div>
                        <p className="text-[10px] font-black text-[#ff003c] uppercase italic mb-1 tracking-widest leading-none">
                          TOTAL TTC
                        </p>
                        <p className="text-5xl font-black italic text-white tracking-tighter leading-none">
                          {totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs font-black text-white/20 italic mb-1 ml-2">MAD</p>
                    </div>
                  </div>
                </motion.div>

                <div className="px-10 flex items-center gap-3 text-[8px] font-black uppercase text-white/20 tracking-[0.2em] italic">
                  <ShieldCheck size={16} className="text-green-500 flex-shrink-0" /> Sécurisé par
                  Tomobilty Encryption System
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ReservationFlow;
