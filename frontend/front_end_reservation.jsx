import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
  Car, 
  MapPin, 
  Calendar, 
  Search, 
  User, 
  ChevronDown, 
  Star, 
  Zap, 
  ShieldCheck, 
  Navigation, 
  Clock,
  ArrowRight,
  Plus, 
  Minus,
  MessageSquare,
  Award,
  Filter,
  Check,
  X,
  ChevronRight,
  Settings2,
  Users,
  Droplet,
  Lock,
  Mail,
  UserPlus,
  ArrowLeft,
  History,
  Download,
  FileText,
  CreditCard,
  Wallet,
  SlidersHorizontal,
  Shield,
  Briefcase,
  Home,
  IdCard,
  Globe,
  Map
} from 'lucide-react';

/**
 * // BACKEND SYNC - ARCHITECTURE GLOBALE :
 * 1. Base de Données : Utilisez le script 'supabase_schema.sql' fourni pour initialiser vos tables.
 * 2. Authentification : Utilisez Supabase Auth ou un JWT Node.js. Le profil (CIN, Permis) doit être lié à 'auth.uid()'.
 * 3. Validation : Ne faites jamais confiance au prix calculé par le frontend. Recalculez-le toujours sur le serveur avant le paiement.
 */

// --- CONFIGURATION DE LA MARQUE ---
const BRAND_LOGO = "/uploads/WhatsApp_Image_2025-12-26_at_17.23.03-removebg-preview.png"; 

// --- CONFIGURATION DU DESIGN ---
const THEME = {
  black: '#000000',
  red: '#ff003c',
  gray: '#111111',
  text: '#ffffff'
};

const GLOW_RED = "shadow-[0_0_20px_rgba(255,0,60,0.4)]";
const GLASS = "bg-black/60 backdrop-blur-xl border border-white/10";

// --- DONNÉES DE RÉFÉRENCE (À REMPLACER PAR DES APPELS API) ---

/**
 * // BACKEND SYNC : Table 'protections'
 * Remplacez ce mock par un useEffect qui appelle GET /api/protections.
 * Prisma : prisma.protection.findMany()
 */
const MOCK_PROTECTIONS = [
  { 
    id: 1, 
    type: "STANDARD", 
    frais_par_jour: 0, 
    proprietes: { assurance_tiers: true, protection_vol: false, assistance_route: false },
    label: "Protection Standard",
    desc: "Inclus dans votre tarif de base."
  },
  { 
    id: 2, 
    type: "PREMIUM", 
    frais_par_jour: 150, 
    proprietes: { assurance_tiers: true, protection_vol: true, assistance_route: true, rachat_franchise_partiel: true },
    label: "Pack Premium",
    desc: "Réduction des franchises et assistance 24/7."
  },
  { 
    id: 3, 
    type: "ELITE_TOTAL", 
    frais_par_jour: 350, 
    proprietes: { assurance_tiers: true, protection_vol: true, assistance_route: true, franchise_zero: true, bris_de_glace: true },
    label: "Protection Intégrale",
    desc: "Sérénité absolue sans aucune franchise."
  }
];

/**
 * // BACKEND SYNC : Table 'vehicles'
 * En production, cet objet sera passé via l'état global ou une route : GET /api/vehicles/:id
 */
const SELECTED_CAR_DEMO = { 
  id: 1, 
  brand: { name: 'Porsche' }, 
  modele: 'Taycan S', 
  prix_par_jour: 2500, 
  images: [{ image_url: 'https://images.unsplash.com/photo-1614200024970-072051666427?q=80&w=800' }],
  variantes: [{ id: 101, ville: 'Casablanca' }]
};

const SEARCH_CRITERIA_DEMO = {
  location: "Casablanca",
  startDate: "2024-06-15",
  endDate: "2024-06-18"
};

// --- COMPOSANTS UI FONCTIONS ---

function LogoBranding() {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      <img src={BRAND_LOGO} alt="Logo" className="h-10 w-auto object-contain transition-transform group-hover:scale-110" />
      <span className="text-2xl font-black italic tracking-tighter text-white group-hover:text-[#ff003c] transition-colors uppercase">TOMOBILTY</span>
    </div>
  );
}

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

// --- PAGE DE RÉSERVATION (MULTI-ÉTAPES) ---

function ReservationPage({ car, criteria }) {
  const [step, setStep] = useState('protection'); 
  const [selectedProt, setSelectedProt] = useState(MOCK_PROTECTIONS[0]);
  const [paymentMode, setPaymentMode] = useState('CMI');
  
  const [billingInfo, setBillingInfo] = useState({
    country: "Maroc",
    city: "",
    zipCode: "",
    address: ""
  });

  const [pilotInfo, setPilotInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    idNumber: "",
    licenseNumber: "",
    certifyAge: false,
    certifyLicenseOld: false
  });

  /**
   * // BACKEND SYNC : Logique de Prix
   * 1. Utilisez une bibliothèque comme 'date-fns' ou 'dayjs' pour calculer 'durationDays' précisément.
   * 2. Envoyez 'startDate' et 'endDate' au backend pour que Prisma vérifie les conflits (table 'reservations').
   */
  const durationDays = 3; 
  const subtotal = (car?.prix_par_jour || 0) * durationDays;
  const protectionTotal = (selectedProt.frais_par_jour || 0) * durationDays;
  const totalAmount = subtotal + protectionTotal;

  const isFormValid = useMemo(() => {
    return (
      pilotInfo.fullName.length > 2 &&
      pilotInfo.email.includes("@") &&
      pilotInfo.certifyAge &&
      pilotInfo.certifyLicenseOld &&
      billingInfo.city.length > 1 &&
      billingInfo.address.length > 5
    );
  }, [pilotInfo, billingInfo]);

  /**
   * // BACKEND SYNC : Soumission Finale
   * 1. Création du profil : PATCH /api/profiles/:id avec (cin_number, license_number, phone).
   * 2. Création Réservation : POST /api/reservations { vehicle_id, start_date, end_date, protection_id, total_price }.
   * 3. Paiement : Si paymentMode === 'CMI', redirigez vers la gateway avec le 'total_price'.
   */
  const handleFinalConfirm = async () => {
    if (!isFormValid) return;
    try {
        console.log("Envoi des données vers Prisma via API...");
        // await axios.post('/api/reservations', { ... });
    } catch (err) {
        console.error("Erreur de liaison backend", err);
    }
  };

  return (
    <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 text-left">
         
         {/* COLONNE GAUCHE */}
         <div className="lg:col-span-8 space-y-10">
            <AnimatePresence mode="wait">
              
              {/* ÉTAPE 1 : PROTECTION (Liaison table Protection) */}
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
                      {MOCK_PROTECTIONS.map((prot) => (
                        <div 
                          key={prot.id}
                          onClick={() => setSelectedProt(prot)}
                          className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden group ${selectedProt.id === prot.id ? 'bg-[#ff003c]/5 border-[#ff003c] shadow-lg' : 'bg-[#0a0a0a] border-white/5 hover:border-white/20'}`}
                        >
                           <div className="flex justify-between items-start mb-6">
                              <div className="flex items-center gap-4 text-left">
                                 <div className={`p-3 rounded-xl ${selectedProt.id === prot.id ? 'bg-[#ff003c] text-white' : 'bg-white/5 text-white/40'}`}>
                                    <ShieldCheck size={24} />
                                 </div>
                                 <div className="text-left">
                                    <h3 className="text-xl font-black italic uppercase text-white">{prot.label}</h3>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{prot.desc}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-2xl font-black italic text-white leading-none">+{prot.frais_par_jour}</p>
                                 <p className="text-[8px] font-black text-[#ff003c] uppercase italic">MAD / J</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-y-3">
                              {Object.entries(prot.proprietes).map(([key, value]) => (
                                 <div key={key} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/50 text-left">
                                    {value ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-red-500/30" />}
                                    <span>{key.replace(/_/g, ' ')}</span>
                                 </div>
                              ))}
                           </div>
                           
                           {selectedProt.id === prot.id && (
                               <motion.div layoutId="check-active" className="absolute top-6 right-6 text-[#ff003c]">
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
                      VALIDER ET CONTINUER <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </motion.div>
              )}

              {/* ÉTAPE 2 : COORDONNÉES ET PAIEMENT (Liaison table Profiles & Reservations) */}
              {step === 'checkout' && (
                <motion.div 
                  key="step-c"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-10"
                >
                   <button onClick={() => setStep('protection')} className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-white mb-6">
                      <ArrowLeft size={14} /> Retour à la protection
                   </button>

                   <SectionTitle subtitle="Protocol_Step_02" title="COORDONNÉES ET FACTURATION" />

                   <div className={`${GLASS} p-10 rounded-[3rem] border-white/5 shadow-xl text-left`}>
                      <h3 className="text-xl font-black italic uppercase text-white mb-8 border-b border-white/5 pb-4">Profil Pilote</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                         <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest text-left block">Nom Complet</label>
                            <div className="relative group">
                              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                              <input 
                                type="text" 
                                value={pilotInfo.fullName}
                                onChange={(e) => setPilotInfo({...pilotInfo, fullName: e.target.value})}
                                placeholder="Prénom Nom" 
                                className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all" 
                              />
                            </div>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest text-left block">E-mail</label>
                            <div className="relative group">
                              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                              <input 
                                type="email" 
                                value={pilotInfo.email}
                                onChange={(e) => setPilotInfo({...pilotInfo, email: e.target.value})}
                                placeholder="pilote@elite.ma" 
                                className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all" 
                              />
                            </div>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest text-left block">Téléphone</label>
                            <div className="relative group">
                              <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                              <input 
                                type="text" 
                                value={pilotInfo.phone}
                                onChange={(e) => setPilotInfo({...pilotInfo, phone: e.target.value})}
                                placeholder="+212 ..." 
                                className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all" 
                              />
                            </div>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest text-left block">CIN / Passeport</label>
                            <div className="relative group">
                              <IdCard className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                              <input 
                                type="text" 
                                value={pilotInfo.idNumber}
                                onChange={(e) => setPilotInfo({...pilotInfo, idNumber: e.target.value})}
                                placeholder="Numéro d'identité" 
                                className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all" 
                              />
                            </div>
                         </div>
                         <div className="space-y-3 sm:col-span-2">
                            <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest text-left block">Numéro de Permis</label>
                            <div className="relative group">
                              <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                              <input 
                                type="text" 
                                value={pilotInfo.licenseNumber}
                                onChange={(e) => setPilotInfo({...pilotInfo, licenseNumber: e.target.value})}
                                placeholder="Référence du permis" 
                                className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all" 
                              />
                            </div>
                         </div>

                         {/* CERTIFICATIONS OBLIGATOIRES */}
                         <div className="sm:col-span-2 pt-4 space-y-4">
                            <label className="flex items-start gap-4 cursor-pointer group">
                               <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${pilotInfo.certifyAge ? 'bg-[#ff003c] border-[#ff003c]' : 'bg-white/5 border-white/10 group-hover:border-[#ff003c]'}`}>
                                  {pilotInfo.certifyAge && <Check size={14} className="text-white" strokeWidth={4} />}
                                  <input type="checkbox" className="hidden" checked={pilotInfo.certifyAge} onChange={(e) => setPilotInfo({...pilotInfo, certifyAge: e.target.checked})} />
                               </div>
                               <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest italic text-left">Je certifie avoir <span className="text-white">plus de 21 ans</span>.</span>
                            </label>
                            <label className="flex items-start gap-4 cursor-pointer group">
                               <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${pilotInfo.certifyLicenseOld ? 'bg-[#ff003c] border-[#ff003c]' : 'bg-white/5 border-white/10 group-hover:border-[#ff003c]'}`}>
                                  {pilotInfo.certifyLicenseOld && <Check size={14} className="text-white" strokeWidth={4} />}
                                  <input type="checkbox" className="hidden" checked={pilotInfo.certifyLicenseOld} onChange={(e) => setPilotInfo({...pilotInfo, certifyLicenseOld: e.target.checked})} />
                               </div>
                               <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest italic text-left">Mon permis a <span className="text-white">plus de deux ans</span> d'ancienneté.</span>
                            </label>
                         </div>
                      </div>
                   </div>

                   <div className={`${GLASS} p-10 rounded-[3rem] border-white/5 shadow-xl text-left`}>
                      <h3 className="text-xl font-black italic uppercase text-white mb-8 border-b border-white/5 pb-4 flex items-center gap-3">
                          <CreditCard className="text-[#ff003c]" /> Méthode de Règlement
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <button onClick={() => setPaymentMode('CMI')} className={`py-8 border rounded-2xl font-black uppercase italic text-[10px] flex flex-col items-center gap-3 transition-all ${paymentMode === 'CMI' ? 'border-[#ff003c] bg-[#ff003c]/10 shadow-[0_0_20px_rgba(255,0,60,0.2)]' : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'}`}>
                            <Wallet size={24} /> Paiement Online (CMI)
                         </button>
                         <button onClick={() => setPaymentMode('SITE')} className={`py-8 border rounded-2xl font-black uppercase italic text-[10px] flex flex-col items-center gap-3 transition-all ${paymentMode === 'SITE' ? 'border-[#ff003c] bg-[#ff003c]/10 shadow-[0_0_20px_rgba(255,0,60,0.2)]' : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'}`}>
                            <MapPin size={24} /> Sur Place à l'Agence
                         </button>
                      </div>
                   </div>

                   <div className={`${GLASS} p-10 rounded-[3rem] border-white/5 shadow-xl text-left`}>
                      <h3 className="text-xl font-black italic uppercase text-white mb-8 border-b border-white/5 pb-4 flex items-center gap-3">
                          <Home className="text-[#ff003c]" /> Adresse de Facturation
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest block text-left">Pays / Région</label>
                            <div className="relative group">
                               <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                               <input 
                                  type="text" 
                                  value={billingInfo.country}
                                  onChange={(e) => setBillingInfo({...billingInfo, country: e.target.value})}
                                  placeholder="Maroc" 
                                  className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all" 
                               />
                            </div>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest block text-left">Ville</label>
                            <div className="relative group">
                               <Map className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={18} />
                               <input 
                                  type="text" 
                                  value={billingInfo.city}
                                  onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                                  placeholder="Casablanca" 
                                  className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all" 
                               />
                            </div>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest block text-left">Code Postal</label>
                            <input 
                               type="text" 
                               value={billingInfo.zipCode}
                               onChange={(e) => setBillingInfo({...billingInfo, zipCode: e.target.value})}
                               placeholder="20000" 
                               className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all" 
                            />
                         </div>
                         <div className="space-y-3 sm:col-span-2">
                            <label className="text-[9px] font-black uppercase text-white/30 ml-2 italic tracking-widest block text-left">Adresse de la rue</label>
                            <input 
                               type="text" 
                               value={billingInfo.address}
                               onChange={(e) => setBillingInfo({...billingInfo, address: e.target.value})}
                               placeholder="Numéro et nom de la rue" 
                               className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all" 
                            />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <button 
                        onClick={handleFinalConfirm}
                        disabled={!isFormValid}
                        className={`w-full py-7 font-black uppercase italic rounded-[2rem] transition-all flex items-center justify-center gap-4 group shadow-2xl ${isFormValid ? 'bg-white text-black hover:bg-[#ff003c] hover:text-white cursor-pointer' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}`}
                      >
                         {isFormValid ? 'CONFIRMER LA RÉSERVATION' : 'CRITÈRES REQUIS'}
                         {isFormValid && <Zap size={24} className="group-hover:fill-current" />}
                      </button>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
         </div>

         {/* COLONNE DROITE : RÉCAPITULATIF PERSISTANT (Liaison table Reservations) */}
         <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-6 text-left">
               <motion.div 
                 layout
                 className={`${GLASS} p-10 rounded-[4rem] border-[#ff003c]/30 shadow-2xl relative overflow-hidden`}
               >
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Shield size={120} /></div>
                  
                  <img src={car?.images[0].image_url} className="w-full h-40 object-cover rounded-3xl mb-8 grayscale hover:grayscale-0 transition-all duration-1000 shadow-2xl" alt="Recap" />
                  
                  <h4 className="text-3xl font-black italic uppercase text-white tracking-tighter leading-none mb-6 text-left">
                    {car?.brand.name} <br/> <span className="text-transparent stroke-text">{car?.modele}</span>
                  </h4>
                  
                  <div className="space-y-4 border-t border-white/10 pt-6 text-left">
                     <div className="flex justify-between items-center text-left"><p className="text-[9px] font-black uppercase text-white/30 italic text-left">Pilote</p><p className="text-[10px] font-bold text-white uppercase text-right truncate max-w-[120px]">{pilotInfo.fullName || "..."}</p></div>
                     <div className="flex justify-between items-center text-left"><p className="text-[9px] font-black uppercase text-white/30 italic text-left">Lieu</p><p className="text-xs font-bold text-white uppercase text-right">{criteria.location}</p></div>
                     <div className="flex justify-between items-center text-left"><p className="text-[9px] font-black uppercase text-white/30 italic text-left">Période</p><p className="text-[10px] font-bold text-white uppercase text-right tracking-tighter">{criteria.startDate} — {criteria.endDate}</p></div>
                     <div className="flex justify-between items-center text-left"><p className="text-[9px] font-black uppercase text-white/30 italic text-left">Protection</p><p className="text-xs font-black text-[#ff003c] uppercase italic tracking-widest text-right">{selectedProt.type}</p></div>
                     
                     {(billingInfo.city || billingInfo.address) && (
                        <div className="flex justify-between items-start text-left border-t border-white/5 pt-4">
                           <p className="text-[9px] font-black uppercase text-white/30 italic text-left">Facture</p>
                           <p className="text-[9px] font-bold text-white uppercase tracking-tighter text-right max-w-[150px]">
                              {billingInfo.address} {billingInfo.city && `, ${billingInfo.city}`} {billingInfo.zipCode && `(${billingInfo.zipCode})`}
                           </p>
                        </div>
                     )}
                  </div>

                  <div className="mt-10 pt-10 border-t-2 border-dashed border-white/10 space-y-4">
                     <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase italic text-left"><span>Location ({durationDays}j)</span><span>{subtotal.toLocaleString()} MAD</span></div>
                     <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase italic text-left"><span>Pack Protection</span><span>+{protectionTotal.toLocaleString()} MAD</span></div>
                     
                     <div className="flex justify-between items-end pt-8 border-t border-[#ff003c]/30 mt-8 text-right">
                        <div className="text-left">
                           <p className="text-[10px] font-black text-[#ff003c] uppercase italic mb-1 tracking-widest leading-none">TOTAL TTC</p>
                           <p className="text-5xl font-black italic text-white tracking-tighter leading-none">{totalAmount.toLocaleString()}</p>
                        </div>
                        <p className="text-xs font-black text-white/20 italic mb-1 ml-2">MAD</p>
                     </div>
                  </div>
               </motion.div>

               <div className="px-10 flex items-center gap-3 text-[8px] font-black uppercase text-white/20 tracking-[0.2em] italic text-left">
                  <ShieldCheck size={16} className="text-green-500 flex-shrink-0" /> Sécurisé par Tomobilty Encryption System
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}

// --- APP ENTRY POINT ---

export default function App() {
  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#ff003c] overflow-x-hidden font-sans">
      
      <nav className="fixed top-0 left-0 w-full z-[100] px-6 py-4">
        <div className={`max-w-7xl mx-auto ${GLASS} rounded-2xl px-8 py-4 flex justify-between items-center border-[#ff003c]/20 shadow-2xl`}>
          <LogoBranding />
          <div className="flex items-center gap-6">
            <button className="bg-white/5 hover:bg-white hover:text-black border border-white/10 px-6 py-2.5 rounded-xl text-xs font-black uppercase italic transition-all flex items-center gap-2">
              <User size={14} className="text-[#ff003c]" /> Compte
            </button>
          </div>
        </div>
      </nav>

      <main>
        <ReservationPage 
            car={SELECTED_CAR_DEMO} 
            criteria={SEARCH_CRITERIA_DEMO} 
        />
      </main>

      <footer className="bg-black border-t border-white/10 py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <LogoBranding />
          <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.4em]">Propelled by Speed & Excellence.</p>
        </div>
      </footer>

      <style>{`
        .stroke-text { -webkit-text-stroke: 1px rgba(255, 255, 255, 0.1); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #000000; }
        ::-webkit-scrollbar-thumb { background: #ff003c; border-radius: 10px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
      `}</style>
    </div>
  );
}
