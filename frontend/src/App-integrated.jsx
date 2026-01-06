import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCar as Car, FaMapMarkerAlt as MapPin, FaCalendar as Calendar, FaSearch as Search,
  FaUser as User, FaBolt as Zap, FaShieldAlt as ShieldCheck, FaCompass as Navigation,
  FaClock as Clock, FaArrowRight as ArrowRight, FaAward as Award, FaCheck as Check,
  FaTimes as X, FaEnvelope as Mail, FaHistory as History, FaDownload as Download,
  FaFileAlt as FileText, FaLock as Lock, FaFacebook as Facebook, FaInstagram as Instagram,
  FaTwitter as Twitter, FaLinkedin as Linkedin, FaPhone as Phone, FaMapMarked as MapMarked,
  FaIdCard as IdCard, FaInfo as Info, FaStar as Star, FaChevronRight as ChevronRight, FaChartLine as TrendingUp
} from 'react-icons/fa';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { carService } from './services/car.service';
import { bookingService } from './services/booking.service';
import { paymentService } from './services/payment.service';
import { protectionService } from './services/protection.service';
import { pickupSiteService } from './services/pickupsite.service';
import { loyaltyService } from './services/loyalty.service';
import { formatDateForAPI, formatDateForDisplay, formatPrice } from './utils/dateUtils';
import CustomCalendar from './components/CustomCalendar';
import SearchResultsPage from './components/SearchResultsPage';
import BookingDetailPage from './components/BookingDetailPage';

const THEME = {
  black: '#000000',
  red: '#ff003c',
  gray: '#111111',
  text: '#ffffff'
};

const GLOW_RED = "shadow-[0_0_20px_rgba(255,0,60,0.4)]";
const GLASS = "bg-black/60 backdrop-blur-xl border border-white/10";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

function Footer({ setView }) {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-[#ff003c] p-1.5 rounded-lg rotate-12 shadow-[0_0_10px_#ff003c]">
                <Zap size={20} className="text-white" fill="white" />
              </div>
              <span className="text-2xl font-black italic tracking-tighter text-white">TOMMOBILTY</span>
            </div>
            <p className="text-white/40 text-sm font-medium leading-relaxed">
              L'élite du car rental au Maroc. Vivez l'expérience automobile premium.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#ff003c] border border-white/10 hover:border-[#ff003c] flex items-center justify-center transition-all group">
                <Facebook size={18} className="text-white/60 group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#ff003c] border border-white/10 hover:border-[#ff003c] flex items-center justify-center transition-all group">
                <Instagram size={18} className="text-white/60 group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#ff003c] border border-white/10 hover:border-[#ff003c] flex items-center justify-center transition-all group">
                <Twitter size={18} className="text-white/60 group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#ff003c] border border-white/10 hover:border-[#ff003c] flex items-center justify-center transition-all group">
                <Linkedin size={18} className="text-white/60 group-hover:text-white" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-black uppercase text-sm mb-6 tracking-widest">Navigation</h3>
            <ul className="space-y-4">
              <li>
                <button onClick={() => setView('home')} className="text-white/60 hover:text-[#ff003c] text-sm font-bold transition-colors">
                  Accueil
                </button>
              </li>
              <li>
                <button onClick={() => setView('cars')} className="text-white/60 hover:text-[#ff003c] text-sm font-bold transition-colors">
                  Nos Voitures
                </button>
              </li>
              <li>
                <button onClick={() => setView('bookings')} className="text-white/60 hover:text-[#ff003c] text-sm font-bold transition-colors">
                  Réservations
                </button>
              </li>
              <li>
                <a href="#" className="text-white/60 hover:text-[#ff003c] text-sm font-bold transition-colors">
                  À Propos
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-black uppercase text-sm mb-6 tracking-widest">Services</h3>
            <ul className="space-y-4">
              <li>
                <a href="#" className="text-white/60 hover:text-[#ff003c] text-sm font-bold transition-colors">
                  Location Courte Durée
                </a>
              </li>
              <li>
                <a href="#" className="text-white/60 hover:text-[#ff003c] text-sm font-bold transition-colors">
                  Location Longue Durée
                </a>
              </li>
              <li>
                <a href="#" className="text-white/60 hover:text-[#ff003c] text-sm font-bold transition-colors">
                  Chauffeur Privé
                </a>
              </li>
              <li>
                <a href="#" className="text-white/60 hover:text-[#ff003c] text-sm font-bold transition-colors">
                  Assurance Premium
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-black uppercase text-sm mb-6 tracking-widest">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapMarked size={16} className="text-[#ff003c] mt-1 flex-shrink-0" />
                <span className="text-white/60 text-sm font-medium">
                  Casablanca, Maroc
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-[#ff003c] mt-1 flex-shrink-0" />
                <span className="text-white/60 text-sm font-medium">
                  +212 5XX XXX XXX
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} className="text-[#ff003c] mt-1 flex-shrink-0" />
                <span className="text-white/60 text-sm font-medium">
                  contact@tommobilty.ma
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
            © 2025 Tommobilty. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-white/40 hover:text-[#ff003c] text-xs font-bold uppercase tracking-widest transition-colors">
              Confidentialité
            </a>
            <a href="#" className="text-white/40 hover:text-[#ff003c] text-xs font-bold uppercase tracking-widest transition-colors">
              CGU
            </a>
            <a href="#" className="text-white/40 hover:text-[#ff003c] text-xs font-bold uppercase tracking-widest transition-colors">
              Mentions Légales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Navbar({ currentView, setView, onOpenAuth, user, onLogout }) {
  return (
    <nav className="fixed top-0 left-0 w-full z-[100] px-6 py-4">
      <div className={`max-w-7xl mx-auto ${GLASS} rounded-2xl px-8 py-4 flex justify-between items-center border-[#ff003c]/20 shadow-2xl`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="bg-[#ff003c] p-1.5 rounded-lg rotate-12 shadow-[0_0_10px_#ff003c]">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="text-2xl font-black italic tracking-tighter text-white">TOMMOBILTY</span>
        </div>
        
        <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
          <button onClick={() => setView('home')} className={`hover:text-[#ff003c] transition-colors ${currentView === 'home' ? 'text-[#ff003c]' : ''}`}>Accueil</button>
          <button onClick={() => setView('cars')} className={`hover:text-[#ff003c] transition-colors ${currentView === 'cars' ? 'text-[#ff003c]' : ''}`}>Nos Voitures</button>
          {user && (
            <button onClick={() => setView('bookings')} className={`hover:text-[#ff003c] transition-colors ${currentView === 'bookings' ? 'text-[#ff003c]' : ''}`}>Réservations</button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('profile')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs font-black uppercase italic transition-all flex items-center gap-2"
              >
                <User size={14} className="text-[#ff003c]" />
                <span className="text-white">Profil: <span className="font-bold">{user.prenom}</span></span>
              </button>
              <button onClick={onLogout} className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs font-black uppercase italic transition-all">
                Déconnexion
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="bg-white/5 hover:bg-white hover:text-black border border-white/10 px-6 py-2.5 rounded-xl text-xs font-black uppercase italic transition-all duration-300 flex items-center gap-2 group"
            >
              <User size={14} className="text-[#ff003c] group-hover:text-black" />
              <span>Connexion | Inscription</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

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

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 group text-left">
      <div className="mt-1 p-2 bg-white/5 rounded-lg text-white/40 group-hover:text-[#ff003c] transition-colors duration-300">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-1 italic">{label}</p>
        <p className="text-sm font-bold text-white tracking-tight truncate max-w-[240px]">{value || 'Non renseigné'}</p>
      </div>
    </div>
  );
}

function UserProfile() {
  const { user, updateProfile } = useAuth();
  const [accountData, setAccountData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    telephone: user?.telephone || '',
    adresse: user?.adresse || '',
    permis_conduire: user?.permis_conduire || ''
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await loyaltyService.getMyAccount();
      if (mounted && res.success) {
        setAccountData(res.account);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setForm({
      nom: user?.nom || '',
      prenom: user?.prenom || '',
      telephone: user?.telephone || '',
      adresse: user?.adresse || '',
      permis_conduire: user?.permis_conduire || ''
    });
  }, [user]);

  const tier = accountData?.tier || accountData?.account?.tier || null;
  const account = accountData?.account || accountData || null;

  const progress = useMemo(() => {
    if (!tier?.max_points || !tier?.min_points || !account?.lifetime_points) return 100;
    const currentInTier = account.lifetime_points - tier.min_points;
    const totalRequiredInTier = tier.max_points - tier.min_points;
    return Math.min(100, Math.max(0, (currentInTier / totalRequiredInTier) * 100));
  }, [account, tier]);

  const submitEdit = async () => {
    const result = await updateProfile(form);
    if (result?.success) {
      setEditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-40 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#ff003c] to-black p-[2px] shadow-2xl">
              <div className="w-full h-full bg-black rounded-[1.9rem] flex items-center justify-center overflow-hidden">
                <User size={48} className="text-white/20" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
                {user?.prenom} <span className="text-transparent stroke-text">{user?.nom}</span>
              </h1>
              <p className="text-[10px] font-black uppercase text-[#ff003c] tracking-[0.4em] mt-3 italic">
                Status Pilote : Certifié
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="px-8 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-[#ff003c] hover:text-[#ff003c] transition-all"
          >
            Modifier le profil
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className={`${GLASS} p-10 rounded-[3rem] ${GLOW_RED}`}>
              <h3 className="text-xl font-black italic uppercase mb-8 flex items-center gap-3">
                <IdCard className="text-[#ff003c]" /> Credentials
              </h3>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} placeholder="Prénom" className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#ff003c]" />
                    <input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Nom" className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#ff003c]" />
                  </div>
                  <input value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} placeholder="Téléphone" className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#ff003c]" />
                  <input value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} placeholder="Adresse" className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#ff003c]" />
                  <input value={form.permis_conduire} onChange={e => setForm({...form, permis_conduire: e.target.value})} placeholder="Permis de conduire" className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#ff003c]" />
                  <button onClick={submitEdit} className="mt-2 px-6 py-3 bg-[#ff003c] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                    Enregistrer
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <InfoItem icon={<Mail size={16} />} label="Contact" value={user?.email} />
                  <InfoItem icon={<Phone size={16} />} label="Mobile" value={user?.telephone} />
                  <InfoItem icon={<ShieldCheck size={16} />} label="Identité (CIN)" value={user?.cin_number} />
                  <InfoItem icon={<IdCard size={16} />} label="Permis" value={user?.permis_conduire} />
                </div>
              )}
            </div>

            <div className={`${GLASS} p-10 rounded-[3rem] border-white/5`}>
              <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-3">
                <Info className="text-[#ff003c]" /> T-Points Concept
              </h3>
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider leading-loose text-left italic">
                Chaque dirham dépensé chez <span className="text-white">Tomobilty</span> génère des points. Votre grade définit votre multiplicateur de gain et votre remise automatique sur toutes vos futures missions.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl text-left">
                  <p className="text-[8px] font-black text-[#ff003c] uppercase mb-1">Multiplicateur</p>
                  <p className="text-lg font-black">x{tier?.points_multiplier || 1}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl text-left">
                  <p className="text-[8px] font-black text-[#ff003c] uppercase mb-1">Remise Fixe</p>
                  <p className="text-lg font-black">-{tier?.discount_percent || 0}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className={`${GLASS} p-12 rounded-[4rem] relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <Award size={200} />
              </div>
              <div className="flex flex-col md:flex-row justify-between gap-12 relative z-10">
                <div className="text-left">
                  <p className="text-[10px] font-black text-[#ff003c] uppercase tracking-[0.4em] mb-4 italic">Solde de Points Actuel</p>
                  <div className="flex items-end gap-3">
                    <span className="text-8xl font-black italic tracking-tighter leading-none">{account?.points_balance ?? 0}</span>
                    <span className="text-2xl font-black text-white/20 mb-2 uppercase italic">Points</span>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4 italic">Grade Actuel</p>
                  <div className="bg-white text-black px-6 py-3 rounded-full inline-flex items-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
                    <Star size={16} />
                    <span className="text-sm font-black italic uppercase tracking-tighter">{tier?.name || 'BRONZE'}</span>
                  </div>
                  <p className="text-[10px] font-bold text-white/40 mt-4 max-w-xs md:ml-auto">
                    Privilèges : {tier?.benefits || '—'}
                  </p>
                </div>
              </div>
              <div className="mt-16 space-y-4">
                <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                  <span className="text-white/40">Progression vers le prochain grade</span>
                  <span className="text-[#ff003c]">{Math.floor(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#ff003c] to-white shadow-[0_0_15px_#ff003c]"
                  />
                </div>
                <p className="text-[8px] font-bold text-white/20 uppercase text-center tracking-[0.2em]">
                  {(tier?.max_points && account?.lifetime_points) ? (tier.max_points - account.lifetime_points) : 0} points restants pour upgrader votre flotte
                </p>
              </div>
            </div>

            <div className={`${GLASS} p-10 rounded-[3rem] text-left`}>
              <h3 className="text-xl font-black italic uppercase mb-8 flex items-center gap-3">
                <History className="text-[#ff003c]" /> Archives T-Points
              </h3>
              <div className="space-y-4">
                {(accountData?.transactions || accountData?.account?.transactions || []).map((tx, idx) => (
                  <div key={tx.id || idx} className="flex justify-between items-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${tx.points < 0 ? 'bg-white/5 text-white' : 'bg-[#ff003c]/10 text-[#ff003c]'}`}>
                        {tx.points > 0 ? <TrendingUp size={16} /> : <Zap size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tighter">{tx.description || 'Transaction'}</p>
                        <p className="text-[9px] font-medium text-white/20 uppercase">{new Date(tx.created_at || tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className={`text-lg font-black italic ${tx.points > 0 ? 'text-[#ff003c]' : 'text-white/40'}`}>
                      {tx.points > 0 ? `+${tx.points}` : tx.points}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`.stroke-text { -webkit-text-stroke: 1px rgba(255, 255, 255, 0.2); }`}</style>
    </div>
  );
}

function LeastDemandedCars({ onSelect }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const res = await carService.getLeastDemanded({ page: 1, limit: 6 });
      if (mounted && res.success) {
        setCars(res.cars);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle subtitle="Rotation Flotte" title="Les Plus Demandées" />
        {loading ? (
          <div className="text-center py-10 text-white/40 font-bold">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {cars.map((car) => {
              const primaryImage = Array.isArray(car.images) && car.images.length > 0
                ? (car.images.find(i => i.is_primary)?.image_url || car.images[0]?.image_url)
                : 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800';
              return (
                <motion.div
                  key={car.id}
                  whileHover={{ y: -10 }}
                  onClick={() => onSelect && onSelect(car)}
                  className="group relative overflow-hidden rounded-[3rem] bg-[#0a0a0a] border border-white/5 cursor-pointer shadow-2xl"
                >
                  <div className="h-[450px] overflow-hidden">
                    <img
                      src={primaryImage}
                      alt={`${car.brand?.name || ''} ${car.modele}`}
                      className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-10 bg-gradient-to-t from-black via-black/40 to-transparent">
                    <h4 className="text-3xl font-black italic uppercase text-white mb-2 tracking-tighter text-left leading-none">
                      {(car.brand?.name || '')} {car.modele}
                    </h4>
                    <p className="text-[#ff003c] font-black italic text-xl text-left tracking-tighter">
                      À partir de {formatPrice(car.prix_par_jour)} MAD/jour
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function CategorySelector({ categories, selectedCat, onSelect }) {
  const iconMap = {
    'Sport': Zap,
    'SUV': Navigation,
    'Luxe': Award,
    'Urbaine': MapPin,
  };

  return (
    <section className="mb-20">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-[#ff003c] font-black uppercase tracking-[0.4em] text-[10px] mb-4 italic">Architecture de Flotte</span>
        <h1 className="text-5xl md:text-8xl font-black italic uppercase text-white leading-none tracking-tighter">
          DISCIPLINE <br /> <span className="text-transparent stroke-text">ESTHÉTIQUE</span>
        </h1>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.map((cat) => {
          const Icon = iconMap[cat.name] || Award;
          return (
            <motion.div
              key={cat.id}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => onSelect(cat.id)}
              className={`cursor-pointer p-6 md:p-8 rounded-[2rem] border-2 transition-all duration-500 relative overflow-hidden group ${selectedCat === cat.id ? 'bg-[#ff003c] border-[#ff003c] shadow-lg' : 'bg-[#0a0a0a] border-white/5 hover:border-white/20'}`}
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6 ${selectedCat === cat.id ? 'bg-white text-[#ff003c]' : 'bg-white/5 text-white/50 group-hover:text-white'}`}>
                <Icon size={28} />
              </div>
              <h3 className="text-xl md:text-2xl font-black italic uppercase mb-2 text-white leading-none">{cat.name}</h3>
              <p className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest ${selectedCat === cat.id ? 'text-white/80' : 'text-white/40'}`}>{cat.description || ''}</p>
              {selectedCat === cat.id && (
                <motion.div layoutId="active-cat-marker" className="absolute top-4 right-4 text-white"><Check size={20} /></motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function AuthPortal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    telephone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (mode === 'login') {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData);
      }

      if (result.success) {
        onClose();
        setFormData({ email: '', password: '', nom: '', prenom: '', telephone: '' });
      } else {
        setError(result.error?.message || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-black/98 backdrop-blur-3xl">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-w-4xl w-full bg-[#050505] border border-white/5 rounded-[4rem] overflow-hidden relative shadow-2xl grid md:grid-cols-2">
            <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-[#ff003c] z-30 transition-colors">
              <X size={24} />
            </button>

            <div className="p-12 md:p-16 flex flex-col justify-center bg-gradient-to-br from-[#0a0a0a] to-black border-r border-white/5">
              <motion.div key={mode} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
                <div className="bg-[#ff003c] p-3 rounded-2xl w-fit mb-10 shadow-[0_0_20px_rgba(255,0,60,0.4)]"><Zap size={32} /></div>
                
                {mode === 'login' ? (
                  <>
                    <h2 className="text-4xl md:text-5xl font-black italic uppercase text-white mb-6 leading-none tracking-tighter">Réservez plus vite. <br/><span className="text-[#ff003c]">Voyagez malin.</span></h2>
                    <p className="text-white/40 font-medium text-lg leading-relaxed mb-10 italic">Accédez à des réservations plus rapidement et gérez vos voyages en toute simplicité.</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-4xl md:text-5xl font-black italic uppercase text-white mb-8 leading-none tracking-tighter">Créer un <span className="text-[#ff003c]">compte</span></h2>
                    <ul className="space-y-6 mb-12">
                      <li className="flex items-center gap-4 group"><Check size={18} className="text-[#ff003c]"/><span className="text-sm font-bold text-white/60 uppercase tracking-widest italic leading-tight text-left">Gérez facilement vos réservations</span></li>
                      <li className="flex items-center gap-4 group"><Zap size={18} className="text-[#ff003c]"/><span className="text-sm font-bold text-white/60 uppercase tracking-widest italic leading-tight text-left">Des réservations plus rapides</span></li>
                      <li className="flex items-center gap-4 group"><ShieldCheck size={18} className="text-[#ff003c]"/><span className="text-sm font-bold text-white/60 uppercase tracking-widest italic leading-tight text-left">Vérification d'identité rapide</span></li>
                    </ul>
                  </>
                )}
              </motion.div>
            </div>

            <div className="p-12 md:p-16 flex flex-col justify-center text-center">
              <form onSubmit={handleAuthSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-sm font-bold">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4 text-left">
                  <label className="text-[10px] font-black text-[#ff003c] uppercase tracking-[0.4em] ml-2">Votre e-mail</label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={20} />
                    <input 
                      type="email" 
                      required 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="exemple@domaine.ma" 
                      className="w-full bg-white/5 border border-white/10 p-6 pl-16 rounded-[2rem] text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all placeholder:text-white/10" 
                    />
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <label className="text-[10px] font-black text-[#ff003c] uppercase tracking-[0.4em] ml-2">Mot de passe</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={20} />
                    <input 
                      type="password" 
                      required 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••" 
                      className="w-full bg-white/5 border border-white/10 p-6 pl-16 rounded-[2rem] text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all placeholder:text-white/10" 
                    />
                  </div>
                </div>

                {mode === 'register' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-[#ff003c] uppercase tracking-[0.4em] ml-2">Nom</label>
                        <input 
                          type="text" 
                          required 
                          value={formData.nom}
                          onChange={(e) => setFormData({...formData, nom: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c]" 
                        />
                      </div>
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-[#ff003c] uppercase tracking-[0.4em] ml-2">Prénom</label>
                        <input 
                          type="text" 
                          required 
                          value={formData.prenom}
                          onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c]" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-[#ff003c] uppercase tracking-[0.4em] ml-2">Téléphone</label>
                      <input 
                        type="tel" 
                        value={formData.telephone}
                        onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                        placeholder="+212 6XX XXX XXX"
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#ff003c]" 
                      />
                    </div>
                  </>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-6 bg-[#ff003c] text-white font-black uppercase italic rounded-[2rem] shadow-[0_15px_30px_rgba(255,0,60,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-widest disabled:opacity-50"
                >
                  {loading ? 'CHARGEMENT...' : (mode === 'login' ? 'INITIALISER CONNEXION' : 'VALIDER INSCRIPTION')}
                </button>

                <div className="relative py-4 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <span className="relative bg-[#050505] px-4 text-[8px] font-black uppercase text-white/20 tracking-[0.4em]">OU AVEC</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"><GoogleIcon/><span className="text-[10px] font-black uppercase">Google</span></button>
                </div>
              </form>
              <div className="mt-12 pt-8 border-t border-white/5 text-center">
                {mode === 'login' ? (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Nouveau sur Tommobilty ?</p>
                    <button onClick={() => setMode('register')} className="w-full py-4 border border-white/10 hover:border-[#ff003c] hover:text-[#ff003c] text-white/60 font-black uppercase italic rounded-[2rem] transition-all text-[10px] tracking-[0.2em]">CRÉER UN COMPTE</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Vous avez déjà un compte ?</p>
                    <button onClick={() => setMode('login')} className="w-full py-4 border border-white/10 hover:border-[#ff003c] hover:text-[#ff003c] text-white/60 font-black uppercase italic rounded-[2rem] transition-all text-[10px] tracking-[0.2em]">SE CONNECTER</button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SearchSection({ isSticky, onSearch }) {
  const [searchParams, setSearchParams] = useState({
    pickupSiteId: '',
    returnSiteId: '',
    startDate: '',
    endDate: '',
  });
  const [pickupSites, setPickupSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  useEffect(() => {
    fetchPickupSites();
  }, []);

  const fetchPickupSites = async () => {
    setLoading(true);
    const result = await pickupSiteService.getPickupSites();
    if (result.success) {
      setPickupSites(result.sites);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    if (!searchParams.startDate || !searchParams.endDate) {
      alert('Veuillez sélectionner les dates de début et de fin');
      return;
    }
    onSearch(searchParams);
  };

  return (
    <motion.div layout className={`${isSticky ? 'fixed top-24 left-1/2 -translate-x-1/2 w-[90%] z-[90]' : 'relative w-full'}`} initial={false}>
      <div className={`${GLASS} p-2 rounded-3xl border-[#ff003c]/30 ${GLOW_RED} transition-all duration-500`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="flex flex-col p-3 border-r border-white/10 group">
            <label className="text-[8px] font-black text-[#ff003c] uppercase mb-1 text-left">Lieu de Retrait</label>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-[#ff003c]" />
              <select
                value={searchParams.pickupSiteId}
                onChange={(e) => setSearchParams({...searchParams, pickupSiteId: e.target.value})}
                className="bg-transparent border-none outline-none text-white text-xs font-bold w-full cursor-pointer"
              >
                <option value="" className="bg-black">Sélectionner...</option>
                {pickupSites.map((site) => (
                  <option key={site.id} value={site.id} className="bg-black">{site.nom}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col p-3 border-r border-white/10">
            <label className="text-[8px] font-black text-[#ff003c] uppercase mb-1 text-left">Lieu de Retour</label>
            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-[#ff003c]" />
              <select
                value={searchParams.returnSiteId}
                onChange={(e) => setSearchParams({...searchParams, returnSiteId: e.target.value})}
                className="bg-transparent border-none outline-none text-white text-xs font-bold w-full cursor-pointer"
              >
                <option value="" className="bg-black">Sélectionner...</option>
                {pickupSites.map((site) => (
                  <option key={site.id} value={site.id} className="bg-black">{site.nom}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col p-3 border-r border-white/10 relative">
            <label className="text-[8px] font-black text-[#ff003c] uppercase mb-1 text-left">Départ</label>
            <div className="flex items-center gap-2 relative">
              <button
                type="button"
                onClick={() => setShowStartCalendar(!showStartCalendar)}
                className="flex-shrink-0 hover:scale-110 transition-transform"
              >
                <Calendar size={16} className="text-[#ff003c]" />
              </button>
              <input 
                type="text"
                readOnly
                value={searchParams.startDate ? new Date(searchParams.startDate).toLocaleDateString('fr-FR') : ''}
                onClick={() => setShowStartCalendar(!showStartCalendar)}
                placeholder="Sélectionner..."
                className="bg-transparent border-none outline-none text-white text-xs font-bold w-full cursor-pointer"
              />
            </div>
            <AnimatePresence>
              {showStartCalendar && (
                <CustomCalendar
                  value={searchParams.startDate}
                  onChange={(date) => {
                    setSearchParams({...searchParams, startDate: date, endDate: ''});
                    setShowStartCalendar(false);
                  }}
                  onClose={() => setShowStartCalendar(false)}
                  minDate={(() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return tomorrow.toISOString().split('T')[0];
                  })()}
                />
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-col p-3 border-r border-white/10 relative">
            <label className="text-[8px] font-black text-[#ff003c] uppercase mb-1 text-left">Retour</label>
            <div className="flex items-center gap-2 relative">
              <button
                type="button"
                onClick={() => setShowEndCalendar(!showEndCalendar)}
                className="flex-shrink-0 hover:scale-110 transition-transform"
              >
                <Clock size={16} className="text-[#ff003c]" />
              </button>
              <input 
                type="text"
                readOnly
                value={searchParams.endDate ? new Date(searchParams.endDate).toLocaleDateString('fr-FR') : ''}
                onClick={() => setShowEndCalendar(!showEndCalendar)}
                placeholder="Sélectionner..."
                className="bg-transparent border-none outline-none text-white text-xs font-bold w-full cursor-pointer"
              />
            </div>
            <AnimatePresence>
              {showEndCalendar && (
                <CustomCalendar
                  value={searchParams.endDate}
                  onChange={(date) => {
                    setSearchParams({...searchParams, endDate: date});
                    setShowEndCalendar(false);
                  }}
                  onClose={() => setShowEndCalendar(false)}
                  minDate={(() => {
                    if (searchParams.startDate) {
                      const startDate = new Date(searchParams.startDate);
                      startDate.setDate(startDate.getDate() + 3);
                      return startDate.toISOString().split('T')[0];
                    }
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 4);
                    return tomorrow.toISOString().split('T')[0];
                  })()}
                />
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={handleSearch}
            className="bg-[#ff003c] hover:bg-white hover:text-black transition-all rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase italic py-4 md:py-0"
          >
            <Search size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function HomeView({ setView, setSelectedCat, categories, onSearch }) {
  const handleHomeCatSelect = (id) => {
    setSelectedCat(id);
    setView('cars');
  };

  const handleSearch = (params) => {
    onSearch(params);
  };

  return (
    <>
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#ff003c]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="max-w-7xl w-full z-10 text-center">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-[12vw] font-black italic uppercase leading-none tracking-tighter mb-4 text-transparent stroke-text opacity-20">TOMMOBILTY</motion.h1>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-5xl md:text-8xl font-black italic uppercase text-white mb-16 mt-[-6vw]">L'Élite du Car Rental <br /> <span className="text-[#ff003c]">Au Maroc.</span></motion.h2>
          <SearchSection isSticky={false} onSearch={handleSearch} />
          <div className="mt-20 flex justify-center gap-10 md:gap-24 text-center">
            <div className="group cursor-default"><p className="text-4xl font-black text-white italic group-hover:text-[#ff003c] transition-colors duration-300">500+</p><p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Véhicules</p></div>
            <div className="group cursor-default"><p className="text-4xl font-black text-white italic group-hover:text-[#ff003c] transition-colors duration-300">24/7</p><p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Support VIP</p></div>
            <div className="group cursor-default"><p className="text-4xl font-black text-[#ff003c] italic">4.9</p><p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Satisfaction</p></div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 space-y-48 pb-40 text-center md:text-left">
        <CategorySelector categories={categories} onSelect={handleHomeCatSelect} />

        <section className={`${GLASS} rounded-[4rem] p-16 md:p-32 border-[#ff003c]/20 relative overflow-hidden group text-center`}>
          <div className="absolute top-0 right-0 p-20 opacity-5 group-hover:rotate-12 transition-transform duration-1000"><Award size={400} /></div>
          <SectionTitle subtitle="Elite Club" title="Points Tommobilty" />
          <p className="text-white/60 font-bold text-xl mb-12 max-w-2xl mx-auto leading-relaxed italic text-center">Chaque kilomètre parcouru se transforme en points <span className="text-white">T-Points</span> pour débloquer l'élite automobile.</p>
          <button className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase italic hover:bg-[#ff003c] hover:text-white transition-all shadow-2xl">Rejoindre le Cercle</button>
        </section>
      </div>
    </>
  );
}

function CarsPage({ selectedCat, setSelectedCat, setView, categories }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ transmission: 'Tous', minPrice: 0, maxPrice: 5000, seats: 'Tous', fuel: 'Tous' });
  const [bookingCar, setBookingCar] = useState(null);
  const [bookingDates, setBookingDates] = useState({ startDate: '', endDate: '' });
  const [checkResult, setCheckResult] = useState(null);
  const carSectionRef = useRef(null);

  useEffect(() => {
    fetchCars();
  }, [selectedCat]);

  const fetchCars = async () => {
    setLoading(true);
    const params = {};
    if (selectedCat) params.category_id = selectedCat;
    
    const result = await carService.getCars(params);
    if (result.success) {
      setCars(result.cars);
    }
    setLoading(false);
  };

  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      const matchTrans = filters.transmission === 'Tous' ? true : car.transmission === filters.transmission;
      const matchPrice = car.prix_par_jour >= filters.minPrice && car.prix_par_jour <= filters.maxPrice;
      const matchSeats = filters.seats === 'Tous' ? true : car.nombre_places === parseInt(filters.seats);
      return matchTrans && matchPrice && matchSeats;
    });
  }, [cars, filters]);

  const handleCheckAvailability = async () => {
    if (!bookingDates.startDate || !bookingDates.endDate) {
      alert('Veuillez sélectionner les dates');
      return;
    }

    setCheckResult('checking');
    const result = await carService.checkAvailability(
      bookingCar.id,
      formatDateForAPI(bookingDates.startDate),
      formatDateForAPI(bookingDates.endDate)
    );

    if (result.success) {
      setCheckResult(result.available ? 'available' : 'unavailable');
    } else {
      setCheckResult('unavailable');
    }
  };

  const confirmReservation = async () => {
    setView('home');
  };

  return (
    <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto">
      <CategorySelector categories={categories} selectedCat={selectedCat} onSelect={(id) => {
        setSelectedCat(id);
        setTimeout(() => carSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }} />
      
      <AnimatePresence>
        {selectedCat && (
          <motion.section key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} ref={carSectionRef} className="scroll-mt-32">
            <div className="mb-12 border-b border-white/10 pb-10">
              <SectionTitle subtitle={categories.find(c => c.id === selectedCat)?.name} title="RÉSULTATS DE RECHERCHE" />
              <div className={`${GLASS} mt-8 p-6 rounded-[2rem] grid grid-cols-2 md:grid-cols-5 gap-6 items-center border-white/5`}>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#ff003c] uppercase tracking-widest block">Prix Min/Max</label>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => setFilters({...filters, minPrice: parseInt(e.target.value) || 0})} className="bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold w-full outline-none focus:border-[#ff003c]" />
                    <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value) || 5000})} className="bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold w-full outline-none focus:border-[#ff003c]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#ff003c] uppercase tracking-widest block">Transmission</label>
                  <select value={filters.transmission} onChange={(e) => setFilters({...filters, transmission: e.target.value})} className="bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold w-full outline-none cursor-pointer">
                    <option value="Tous">Tous</option><option value="Automatique">Automatique</option><option value="Manuelle">Manuelle</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#ff003c] uppercase tracking-widest block">Places</label>
                  <select value={filters.seats} onChange={(e) => setFilters({...filters, seats: e.target.value})} className="bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold w-full outline-none cursor-pointer">
                    <option value="Tous">Tous</option><option value="2">2 Places</option><option value="4">4 Places</option><option value="5">5 Places</option>
                  </select>
                </div>
                <div className="flex items-end h-full">
                  <button onClick={() => setFilters({ minPrice: 0, maxPrice: 5000, transmission: 'Tous', seats: 'Tous', fuel: 'Tous' })} className="text-[9px] font-black text-white/40 hover:text-[#ff003c] uppercase tracking-[0.2em]">Reset</button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="text-white/40 text-xl font-bold">Chargement...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredCars.map((car) => {
                  const imageUrl = car.images && car.images.length > 0 
                    ? (typeof car.images[0] === 'string' ? car.images[0] : car.images[0]?.image_url)
                    : 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800';
                  
                  return (
                    <div key={car.id} className="group bg-[#0a0a0a] rounded-[3rem] border border-white/5 overflow-hidden transition-all hover:border-[#ff003c]/30">
                      <div className="h-72 overflow-hidden relative">
                        <img src={imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" alt={car.modele} />
                        <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                          <span className="text-[9px] font-black text-white uppercase italic tracking-tighter">{formatPrice(car.prix_par_jour)} MAD / J</span>
                        </div>
                      </div>
                      <div className="p-10 text-center md:text-left">
                        <h4 className="text-[10px] font-black text-[#ff003c] uppercase tracking-widest mb-1">{car.brand?.name || 'Marque'}</h4>
                        <h3 className="text-3xl font-black italic uppercase text-white mb-6">{car.modele}</h3>
                        <button onClick={() => setBookingCar(car)} className="w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-[#ff003c] hover:text-white transition-all shadow-xl">VÉRIFIER DISPONIBILITÉ</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bookingCar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-black/95 backdrop-blur-3xl">
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="max-w-4xl w-full bg-[#111] border border-white/10 rounded-[3.5rem] p-10 md:p-16 relative overflow-hidden shadow-2xl text-left">
              <button onClick={() => {setBookingCar(null); setCheckResult(null);}} className="absolute top-10 right-10 text-white hover:text-[#ff003c] transition-colors"><X size={32} /></button>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white mb-10 tracking-tighter">{bookingCar.brand?.name} <span className="text-transparent stroke-text">{bookingCar.modele}</span></h2>
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 italic">Début</label>
                    <input 
                      type="date" 
                      value={bookingDates.startDate}
                      onChange={(e) => setBookingDates({...bookingDates, startDate: e.target.value})}
                      className="bg-white/5 w-full p-6 rounded-3xl border border-white/10 text-white outline-none focus:border-[#ff003c] [color-scheme:dark] font-bold" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 italic">Fin</label>
                    <input 
                      type="date" 
                      value={bookingDates.endDate}
                      onChange={(e) => setBookingDates({...bookingDates, endDate: e.target.value})}
                      className="bg-white/5 w-full p-6 rounded-3xl border border-white/10 text-white outline-none focus:border-[#ff003c] [color-scheme:dark] font-bold" 
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <button onClick={handleCheckAvailability} className="w-full py-6 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-[#ff003c] hover:text-white transition-all shadow-xl">
                    {checkResult === 'checking' ? 'Vérification...' : 'VÉRIFIER LA DISPONIBILITÉ'}
                  </button>
                  {checkResult === 'available' && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={confirmReservation} className="w-full py-6 bg-[#ff003c] text-white font-black uppercase italic rounded-2xl shadow-lg">
                      CONFIRMER LA RÉSERVATION
                    </motion.button>
                  )}
                  {checkResult === 'unavailable' && (
                    <div className="p-6 bg-red-600/10 border border-red-600/30 rounded-3xl text-center text-red-500 font-black uppercase italic tracking-widest">
                      VÉHICULE NON DISPONIBLE
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookingsPage({ setView, onViewDetail }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const result = await bookingService.getMyBookings();
    if (result.success) {
      setBookings(result.bookings);
    }
    setLoading(false);
  };

  const getStatusDisplay = (status) => {
    const statusName = status?.name || status;
    switch (statusName) {
      case 'EN_ATTENTE': return { label: 'EN ATTENTE', style: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5', icon: <Clock size={12}/> };
      case 'EN_COURS': return { label: 'MISSION ACTIVE', style: 'text-[#ff003c] border-[#ff003c]/30 bg-[#ff003c]/5 shadow-lg', icon: <Zap size={12} className="animate-pulse"/> };
      case 'TERMINE': return { label: 'TERMINEE', style: 'text-green-400 border-green-400/30 bg-green-400/5', icon: <Check size={12}/> };
      case 'ANNULE': return { label: 'ANNULE', style: 'text-white/20 border-white/10 bg-white/5', icon: <X size={12}/> };
      default: return { label: statusName, style: 'text-white/40', icon: null };
    }
  };

  const downloadInvoice = async (bookingId) => {
    await bookingService.downloadInvoice(bookingId);
  };

  if (loading) {
    return (
      <div className="pt-40 pb-40 px-6 max-w-7xl mx-auto min-h-[90vh] flex items-center justify-center">
        <div className="text-white/40 text-xl font-bold">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="pt-40 pb-40 px-6 max-w-7xl mx-auto min-h-[90vh]">
      <SectionTitle subtitle="Protocol_Archives" title="MES RÉSERVATIONS" />
      <div className="grid gap-10">
        {bookings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-xl font-bold mb-8">Aucune réservation trouvée</p>
            <button onClick={() => setView('cars')} className="bg-[#ff003c] text-white px-8 py-4 rounded-2xl font-black uppercase italic hover:scale-105 transition-all">
              EXPLORER LES VOITURES
            </button>
          </div>
        ) : (
          bookings.map((book) => {
            const status = getStatusDisplay(book.status);
            const carData = book.car || book.varianteCar?.car;
            const imageUrl = carData?.primaryImage || carData?.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=400';
            
            return (
              <motion.div 
                key={book.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                onClick={() => onViewDetail && onViewDetail(book.id)}
                className={`${GLASS} rounded-[3rem] overflow-hidden border border-white/5 hover:border-[#ff003c]/30 transition-all cursor-pointer group`}
              >
                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                  <div className="h-64 md:h-auto overflow-hidden">
                    <img src={imageUrl} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Car" />
                  </div>
                  <div className="p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p className="text-[10px] font-black text-[#ff003c] uppercase tracking-widest mb-2">Réservation #{book.id}</p>
                          <h3 className="text-3xl font-black italic uppercase text-white">{carData?.brand?.name} {carData?.modele}</h3>
                        </div>
                        <div className={`px-6 py-3 rounded-2xl border ${status.style} flex items-center gap-2`}>
                          {status.icon}
                          <span className="text-[9px] font-black uppercase tracking-widest">{status.label}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6 mb-8">
                        <div>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Début</p>
                          <p className="text-white font-bold">{formatDateForDisplay(book.date_debut)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Fin</p>
                          <p className="text-white font-bold">{formatDateForDisplay(book.date_fin)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                      <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Prix Total</p>
                        <p className="text-3xl font-black italic text-[#ff003c]">{formatPrice(book.prix_total)} MAD</p>
                      </div>
                      {book.has_invoice && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadInvoice(book.id);
                          }} 
                          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
                        >
                          <Download size={16} className="text-[#ff003c]" />
                          <span className="text-[10px] font-black uppercase text-white">Facture</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [selectedCat, setSelectedCat] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchParams, setSearchParams] = useState(null);
  const [bookingCar, setBookingCar] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const result = await carService.getCategories();
    if (result.success) {
      setCategories(result.categories);
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentView('home');
  };

  const handleSearch = (params) => {
    setSearchParams(params);
    setCurrentView('search-results');
  };

  const handleBookCar = (bookingId) => {
    setSelectedBookingId(bookingId);
    setCurrentView('booking-detail');
  };

  const handleViewBookingDetail = (bookingId) => {
    setSelectedBookingId(bookingId);
    setCurrentView('booking-detail');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar 
        currentView={currentView} 
        setView={setCurrentView} 
        onOpenAuth={() => setAuthOpen(true)}
        user={user}
        onLogout={handleLogout}
      />
      <AuthPortal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      
      {currentView === 'home' && <HomeView setView={setCurrentView} setSelectedCat={setSelectedCat} categories={categories} onSearch={handleSearch} />}
      {currentView === 'cars' && <CarsPage selectedCat={selectedCat} setSelectedCat={setSelectedCat} setView={setCurrentView} categories={categories} />}
      {currentView === 'search-results' && searchParams && <SearchResultsPage searchParams={searchParams} onBookCar={handleBookCar} />}
      {currentView === 'bookings' && user && <BookingsPage setView={setCurrentView} onViewDetail={handleViewBookingDetail} />}
      {currentView === 'profile' && user && <UserProfile />}
      {currentView === 'booking-detail' && selectedBookingId && (
        <BookingDetailPage 
          bookingId={selectedBookingId} 
          onBack={() => setCurrentView('bookings')}
          onCancel={() => {
            setCurrentView('bookings');
            setSelectedBookingId(null);
          }}
        />
      )}
      
      {['home','cars'].includes(currentView) && (
        <LeastDemandedCars onSelect={() => setCurrentView('cars')} />
      )}
      <Footer setView={setCurrentView} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
