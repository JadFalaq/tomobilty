import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { 
  FaCar as Car, FaMapMarkerAlt as MapPin, FaCalendar as Calendar, FaSearch as Search,
  FaUser as User, FaBolt as Zap, FaShieldAlt as ShieldCheck, FaCompass as Navigation,
  FaClock as Clock, FaArrowRight as ArrowRight, FaAward as Award, FaCheck as Check,
  FaTimes as X, FaEnvelope as Mail, FaHistory as History, FaDownload as Download,
  FaFileAlt as FileText, FaLock as Lock, FaFacebook as Facebook, FaInstagram as Instagram,
  FaWhatsapp as Whatsapp, FaPhone as Phone, FaMapMarked as MapMarked,
  FaIdCard as IdCard, FaInfo as Info, FaStar as Star, FaChevronRight as ChevronRight, FaChartLine as TrendingUp
} from 'react-icons/fa';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { carService } from './services/car.service';
import { bookingService } from './services/booking.service';
import { paymentService } from './services/payment.service';
import { protectionService } from './services/protection.service';
import { loyaltyService } from './services/loyalty.service';
import { adminService } from './services/admin.service';
import { getImageUrl } from './utils/apiClient';
import { formatDateForDisplay, formatPrice } from './utils/dateUtils';
import SearchResultsPage from './components/SearchResultsPage';
import AboutPage from './components/AboutPage';

const THEME = {
  black: '#000000',
  red: '#ff003c',
  gray: '#111111',
  text: '#ffffff'
};

const GLOW_RED = "shadow-[0_0_20px_rgba(255,0,60,0.4)]";
const GLASS = "bg-black/60 backdrop-blur-xl border border-white/10";
const LOGO_SRC = "/uploads/WhatsApp_Image_2025-12-26_at_17.23.03-removebg-preview.png";

const INITIAL_FILTERS = { transmission: 'Tous', minPrice: 0, maxPrice: 5000, fuel: 'Tous' };
const INITIAL_PENDING_FILTERS = { ...INITIAL_FILTERS };

const TRANSMISSION_OPTIONS = [
  { id: 'Tous', nom: 'Tous' },
  { id: 'Automatique', nom: 'Automatique' },
  { id: 'Manuelle', nom: 'Manuelle' },
];

const sanitizeText = (value) => {
  if (typeof value !== 'string') return value;
  return value;
};

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
              <img
                src={LOGO_SRC}
                alt="Tommobility"
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-white/40 text-sm font-medium leading-relaxed">
              L'élite du car rental au Maroc. Vivez l'expérience automobile premium.
            </p>
            <div className="flex gap-4">
              <a
                href="https://web.facebook.com/profile.php?id=61585338434243"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#ff003c] border border-white/10 hover:border-[#ff003c] flex items-center justify-center transition-all group"
              >
                <Facebook size={18} className="text-white/60 group-hover:text-white" />
              </a>
              <a
                href="https://www.instagram.com/tommobilty/?utm_source=ig_web_button_share_sheet"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#ff003c] border border-white/10 hover:border-[#ff003c] flex items-center justify-center transition-all group"
              >
                <Instagram size={18} className="text-white/60 group-hover:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#ff003c] border border-white/10 hover:border-[#ff003c] flex items-center justify-center transition-all group"
              >
                <Whatsapp size={18} className="text-white/60 group-hover:text-white" />
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
                <button onClick={() => setView('about')} className="text-white/60 hover:text-[#ff003c] text-sm font-bold transition-colors">
                  À Propos
                </button>
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
                <a href="tel:+212662719526" className="text-white/60 text-sm font-medium hover:text-[#ff003c] transition-colors">
                  +212 662719526
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} className="text-[#ff003c] mt-1 flex-shrink-0" />
                <a href="mailto:support@tommobilty.com" className="text-white/60 text-sm font-medium hover:text-[#ff003c] transition-colors">
                  support@tommobilty.com
                </a>
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
          <img
            src={LOGO_SRC}
            alt="Tommobility"
            className="h-10 w-auto object-contain"
          />
        </div>
        
        <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
          <button onClick={() => setView('home')} className={`hover:text-[#ff003c] transition-colors ${currentView === 'home' ? 'text-[#ff003c]' : ''}`}>Accueil</button>
          <button onClick={() => setView('cars')} className={`hover:text-[#ff003c] transition-colors ${currentView === 'cars' ? 'text-[#ff003c]' : ''}`}>Nos Voitures</button>
          {user?.role === 'ADMIN' && (
            <button onClick={() => setView('admin')} className={`hover:text-[#ff003c] transition-colors ${currentView === 'admin' ? 'text-[#ff003c]' : ''}`}>Admin</button>
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
                <span className="text-white">Profil: <span className="font-bold">{sanitizeText(user.prenom)}</span></span>
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
        <p className="text-sm font-bold text-white tracking-tight truncate max-w-[240px]">{value ? sanitizeText(value) : 'Non renseigné'}</p>
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
    permis_conduire: user?.permis_conduire || '',
    cin: user?.cin || '',
    date_naissance: user?.date_naissance ? new Date(user.date_naissance).toISOString().split('T')[0] : '',
    date_obtention_permis: user?.date_obtention_permis ? new Date(user.date_obtention_permis).toISOString().split('T')[0] : '',
    certifie_age_21: user?.certifie_age_21 || false,
    certifie_permis_2ans: user?.certifie_permis_2ans || false
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
      permis_conduire: user?.permis_conduire || '',
      cin: user?.cin || '',
      date_naissance: user?.date_naissance ? new Date(user.date_naissance).toISOString().split('T')[0] : '',
      date_obtention_permis: user?.date_obtention_permis ? new Date(user.date_obtention_permis).toISOString().split('T')[0] : '',
      certifie_age_21: user?.certifie_age_21 || false,
      certifie_permis_2ans: user?.certifie_permis_2ans || false
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
    if (!form.cin || !form.permis_conduire || !form.date_naissance || !form.date_obtention_permis) {
      alert("Tous les champs sont obligatoires (CIN, Permis, Dates).");
      return;
    }
    if (!form.certifie_age_21 || !form.certifie_permis_2ans) {
      alert("Vous devez certifier votre âge et l'ancienneté de votre permis.");
      return;
    }
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input value={form.cin} onChange={e => setForm({...form, cin: e.target.value})} placeholder="CIN" className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#ff003c]" />
                    <input value={form.permis_conduire} onChange={e => setForm({...form, permis_conduire: e.target.value})} placeholder="Permis" className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#ff003c]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Date Naissance</label>
                      <input type="date" value={form.date_naissance} onChange={e => setForm({...form, date_naissance: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#ff003c] text-white" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-white/40 mb-1">Obtention Permis</label>
                      <input type="date" value={form.date_obtention_permis} onChange={e => setForm({...form, date_obtention_permis: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-[#ff003c] text-white" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${form.certifie_age_21 ? 'bg-[#ff003c] border-[#ff003c]' : 'border-white/20 group-hover:border-[#ff003c]'}`}>
                        {form.certifie_age_21 && <Check size={10} className="text-white" />}
                      </div>
                      <input type="checkbox" checked={form.certifie_age_21} onChange={e => setForm({...form, certifie_age_21: e.target.checked})} className="hidden" />
                      <span className="text-[10px] text-white/60 font-bold uppercase">Je certifie avoir plus de 21 ans</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${form.certifie_permis_2ans ? 'bg-[#ff003c] border-[#ff003c]' : 'border-white/20 group-hover:border-[#ff003c]'}`}>
                        {form.certifie_permis_2ans && <Check size={10} className="text-white" />}
                      </div>
                      <input type="checkbox" checked={form.certifie_permis_2ans} onChange={e => setForm({...form, certifie_permis_2ans: e.target.checked})} className="hidden" />
                      <span className="text-[10px] text-white/60 font-bold uppercase">Plus de 2 ans de permis</span>
                    </label>
                  </div>

                  <button onClick={submitEdit} className="mt-2 px-6 py-3 bg-[#ff003c] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all w-full">
                    Enregistrer les modifications
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <InfoItem icon={<Mail size={16} />} label="Contact" value={user?.email} />
                  <InfoItem icon={<Phone size={16} />} label="Mobile" value={user?.telephone} />
                  <InfoItem icon={<ShieldCheck size={16} />} label="Identité (CIN)" value={user?.cin} />
                  <InfoItem icon={<IdCard size={16} />} label="Permis" value={user?.permis_conduire} />
                  {user?.date_naissance && <InfoItem icon={<Calendar size={16} />} label="Né(e) le" value={new Date(user.date_naissance).toLocaleDateString()} />}
                  {user?.date_obtention_permis && <InfoItem icon={<Calendar size={16} />} label="Permis depuis" value={new Date(user.date_obtention_permis).toLocaleDateString()} />}
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
                  {(tier?.max_points && account?.lifetime_points) ? (tier.max_points - account.lifetime_points) : 0} points restants +66pour upgrader votre flotte
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
        <SectionTitle subtitle="nos propositions" title="Les Plus Demandées" />
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

function CategorySelector({ categories, selectedCat, onSelect, showHelper }) {
  const iconMap = {
    'Sport': Zap,
    'SUV': Navigation,
    'Luxe': Award,
    'Urbaine': MapPin,
  };

  return (
    <section className="mb-20">
      <div className="flex flex-col items-center text-center mb-16">
        <h1 className="text-5xl md:text-8xl font-black italic uppercase text-white leading-none tracking-tighter">
          DISCIPLINE <br /> <span className="text-transparent stroke-text">ESTHÉTIQUE</span>
        </h1>
        <p className="mt-4 text-[#ff003c] font-black uppercase tracking-[0.4em] text-[10px]">
          Nos catégories
        </p>
        {showHelper && (
          <div className="mt-2 flex items-center gap-2 self-start">
            <div className="w-12 h-[2px] bg-[#ff003c]" />
            <p className="text-[#ff003c] font-black uppercase tracking-[0.2em] text-[9px]">
              Choisissez une catégorie pour afficher les véhicules
            </p>
          </div>
        )}
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
  const { login, register, googleLogin, verifyEmail } = useAuth();
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    telephone: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      try {
        // useGoogleLogin with default flow returns access_token in tokenResponse.access_token
        const result = await googleLogin(tokenResponse.access_token);
        if (result.success) {
          onClose();
          setFormData({ email: '', password: '', nom: '', prenom: '', telephone: '' });
          setVerificationCode('');
          setMode('login');
        } else {
          setError(result.error?.message || 'Erreur lors de la connexion Google');
        }
      } catch (err) {
        console.error("Google Login Error:", err);
        setError('Une erreur est survenue avec Google');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Échec de la connexion Google'),
  });
  
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (mode === 'login') {
        result = await login(formData.email, formData.password);
      } else if (mode === 'register') {
        result = await register(formData);
      } else if (mode === 'verify') {
        result = await verifyEmail(formData.email, verificationCode);
      }

      if (result.success) {
        if (mode === 'register') {
          setMode('verify');
        } else {
          onClose();
          setFormData({ email: '', password: '', nom: '', prenom: '', telephone: '' });
          setVerificationCode('');
          setMode('login');
        }
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center px-6 py-10 bg-black/98 backdrop-blur-3xl overflow-y-auto">
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
                ) : mode === 'verify' ? (
                  <>
                    <h2 className="text-4xl md:text-5xl font-black italic uppercase text-white mb-8 leading-none tracking-tighter">Vérification <span className="text-[#ff003c]">Email</span></h2>
                    <p className="text-white/40 font-medium text-lg leading-relaxed mb-10 italic">
                      Nous avons envoyé un code de vérification à <strong className="text-white">{formData.email}</strong>.
                    </p>
                    <p className="text-white/40 font-medium text-sm leading-relaxed mb-10 italic">
                      Veuillez consulter votre boîte de réception (et vos spams) pour récupérer le code.
                    </p>
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
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-xs font-bold max-h-32 overflow-y-auto leading-snug break-words">
                    {error}
                  </div>
                )}
                
                {mode === 'verify' ? (
                  <div className="space-y-4 text-left">
                    <label className="text-[10px] font-black text-[#ff003c] uppercase tracking-[0.4em] ml-2">Code de vérification</label>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={20} />
                      <input 
                        type="text" 
                        required 
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="123456" 
                        maxLength="6"
                        className="w-full bg-white/5 border border-white/10 p-6 pl-16 rounded-[2rem] text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all placeholder:text-white/10 tracking-[0.5em] text-center text-2xl" 
                      />
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-6 bg-[#ff003c] text-white font-black uppercase italic rounded-[2rem] shadow-[0_15px_30px_rgba(255,0,60,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-widest disabled:opacity-50"
                >
                  {loading ? 'CHARGEMENT...' : (mode === 'login' ? 'INITIALISER CONNEXION' : mode === 'register' ? 'VALIDER INSCRIPTION' : 'VÉRIFIER LE CODE')}
                </button>

                {mode !== 'verify' ? (
                  <>
                    <div className="relative py-4 text-center">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                      <span className="relative bg-[#050505] px-4 text-[8px] font-black uppercase text-white/20 tracking-[0.4em]">OU AVEC</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" onClick={() => handleGoogleLogin()} className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"><GoogleIcon/><span className="text-[10px] font-black uppercase">Google</span></button>
                    </div>
                  </>
                ) : (
                   <div className="mt-4 text-center">
                     <button type="button" onClick={() => setMode('register')} className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-colors">Retour à l'inscription</button>
                   </div>
                )}
              </form>
              <div className="mt-12 pt-8 border-t border-white/5 text-center">
                {mode === 'login' ? (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Nouveau sur Tommobilty ?</p>
                    <button onClick={() => setMode('register')} className="w-full py-4 border border-white/10 hover:border-[#ff003c] hover:text-[#ff003c] text-white/60 font-black uppercase italic rounded-[2rem] transition-all text-[10px] tracking-[0.2em]">CRÉER UN COMPTE</button>
                  </div>
                ) : mode === 'register' ? (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Vous avez déjà un compte ?</p>
                    <button onClick={() => setMode('login')} className="w-full py-4 border border-white/10 hover:border-[#ff003c] hover:text-[#ff003c] text-white/60 font-black uppercase italic rounded-[2rem] transition-all text-[10px] tracking-[0.2em]">SE CONNECTER</button>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LocationDropdown({ label, icon: Icon, value, onChange, sites, disabled }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedSite = sites.find((site) => String(site.id) === String(value));
  const displayLabel = selectedSite ? selectedSite.nom : disabled ? 'Chargement...' : 'Sélectionner...';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="flex flex-col p-3 border-r border-white/10 relative">
      <label className="text-[8px] font-black text-[#ff003c] uppercase mb-1 text-left">{label}</label>
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setOpen(!open);
        }}
        className={`flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 w-full text-left transition-colors ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-[#ff003c] cursor-pointer'
        }`}
      >
        <Icon size={16} className="text-[#ff003c]" />
        <span className="text-white text-xs font-bold flex-1 truncate">
          {displayLabel}
        </span>
        <ChevronRight
          size={12}
          className={`text-white/40 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute top-full left-3 right-3 mt-2 bg-black border border-white/10 rounded-2xl shadow-2xl z-[999] max-h-60 overflow-y-auto"
          >
            {sites.length === 0 ? (
              <div className="px-4 py-3 text-[11px] font-bold text-white/40 text-left">
                Aucun lieu disponible
              </div>
            ) : (
              sites.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => {
                    onChange(site.id);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-xs font-bold flex items-center justify-between transition-colors ${
                    String(site.id) === String(value)
                      ? 'bg-[#ff003c]/20 text-[#ff003c]'
                      : 'text-white hover:bg-white/5'
                  }`}
                >
                  <span className="truncate">{site.nom}</span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedOption = options.find((option) => String(option.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : options[0]?.label || 'Sélectionner';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="space-y-2 relative">
      <label className="text-[9px] font-black uppercase tracking-widest text-white/40">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/80 outline-none hover:border-[#ff003c] hover:text-white flex items-center justify-between cursor-pointer"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronRight
          size={12}
          className={`text-white/40 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/10 rounded-2xl shadow-2xl z-[999] max-h-60 overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-xs font-bold transition-colors ${
                  String(option.value) === String(value)
                    ? 'bg-[#ff003c]/20 text-[#ff003c]'
                    : 'text-white hover:bg-white/5'
                }`}
              >
                <span className="truncate">{option.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchSection({ isSticky, onSearch }) {
  const handleSearch = () => {
    onSearch({});
  };

  return (
    <div className="relative w-full h-[86px] md:h-[86px]">
      <motion.div className={`${isSticky ? 'fixed top-24 inset-x-0 z-[90] flex justify-center px-4 md:px-0' : 'relative w-full flex justify-center'}`}>
        <div className={`${GLASS} p-2 rounded-3xl border-[#ff003c]/30 ${GLOW_RED} transition-all duration-500 w-full max-w-6xl`}>
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-2">
          <div className="flex items-center justify-between gap-4 px-6 py-5 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-left">
              <p className="text-[8px] font-black text-[#ff003c] uppercase tracking-[0.3em] mb-1">Showroom</p>
              <p className="text-white text-sm md:text-base font-bold uppercase italic">Decouvrez toutes les voitures disponibles dans notre societe</p>
            </div>
            <Car size={24} className="text-[#ff003c] hidden md:block" />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-[#ff003c] hover:bg-white hover:text-black transition-all rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase italic py-4 md:py-0"
          >
            <Search size={20} />
            <span>Voir la flotte</span>
          </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function HomeView({ setView, setSelectedCat, categories, onSearch }) {
  const [stickySearch, setStickySearch] = useState(false);
  const searchSentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setStickySearch(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (searchSentinelRef.current) {
      observer.observe(searchSentinelRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleHomeCatSelect = (id) => {
    setSelectedCat(id);
    setView('cars');
  };

  const handleSearch = (params) => {
    onSearch(params);
  };

  return (
    <>
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#ff003c]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="max-w-7xl w-full z-10 flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[9rem] font-black italic uppercase mb-1"
          >
            <span className="text-transparent stroke-text">TOMMOBILTY</span>
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl font-black italic uppercase text-white mb-16"
          >
            L'Élite du Car Rental <br /> <span className="text-[#ff003c]">Au Maroc.</span>
          </motion.h2>
          <div ref={searchSentinelRef} className="h-0 w-full" />
          <SearchSection isSticky={stickySearch} onSearch={handleSearch} />
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
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [pendingFilters, setPendingFilters] = useState(INITIAL_PENDING_FILTERS);
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
    const minPrice = typeof filters.minPrice === 'number' ? filters.minPrice : 0;
    const maxPrice = typeof filters.maxPrice === 'number' ? filters.maxPrice : Number.MAX_SAFE_INTEGER;

    return cars.filter(car => {
      const matchTrans = filters.transmission === 'Tous' ? true : car.transmission === filters.transmission;
      const matchPrice = car.prix_par_jour >= minPrice && car.prix_par_jour <= maxPrice;
      return matchTrans && matchPrice;
    });
  }, [cars, filters]);

  const handlePriceChange = (field, value) => {
    if (value === '') {
      setPendingFilters(prev => ({ ...prev, [field]: '' }));
      return;
    }
    const numeric = parseInt(value, 10);
    if (Number.isNaN(numeric)) return;
    setPendingFilters(prev => ({ ...prev, [field]: numeric }));
  };

  const handleSelectChange = (field, value) => {
    setPendingFilters(prev => ({ ...prev, [field]: value }));
  };

  const adjustPrice = (field, delta) => {
    setPendingFilters(prev => {
      const currentRaw = prev[field] === '' ? 0 : prev[field];
      const current = typeof currentRaw === 'number' ? currentRaw : parseInt(currentRaw, 10) || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [field]: next };
    });
  };

  const applyFilters = () => {
    setFilters(prev => ({
      ...prev,
      transmission: pendingFilters.transmission,
      minPrice: pendingFilters.minPrice === '' ? 0 : pendingFilters.minPrice,
      maxPrice: pendingFilters.maxPrice === '' ? '' : pendingFilters.maxPrice
    }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPendingFilters(INITIAL_PENDING_FILTERS);
  };

  return (
    <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto">
      <CategorySelector categories={categories} selectedCat={selectedCat} showHelper onSelect={(id) => {
        setSelectedCat(id);
        setTimeout(() => carSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }} />
      
      <AnimatePresence>
        {selectedCat && (
          <motion.section key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} ref={carSectionRef} className="scroll-mt-32">
            <div className="mb-12 border-b border-white/10 pb-10">
              <SectionTitle subtitle={categories.find(c => c.id === selectedCat)?.name} title="RÉSULTATS DE RECHERCHE" />
              <div className={`${GLASS} mt-8 p-6 rounded-[2rem] grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 items-center border-white/5`}>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[9px] font-black text-[#ff003c] uppercase tracking-widest block">Prix Min/Max</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-2xl px-2 w-full">
                      <button
                        type="button"
                        onClick={() => adjustPrice('minPrice', -100)}
                        className="w-6 h-6 flex items-center justify-center rounded-xl bg-black text-[#ff003c] text-xs font-black hover:bg-[#ff003c] hover:text-black transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        placeholder="Min"
                        value={pendingFilters.minPrice}
                        onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                        className="flex-1 bg-transparent border-none p-2 text-xs font-bold outline-none text-white placeholder:text-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => adjustPrice('minPrice', 100)}
                        className="w-6 h-6 flex items-center justify-center rounded-xl bg-black text-[#ff003c] text-xs font-black hover:bg-[#ff003c] hover:text-black transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-2xl px-2 w-full">
                      <button
                        type="button"
                        onClick={() => adjustPrice('maxPrice', -100)}
                        className="w-6 h-6 flex items-center justify-center rounded-xl bg-black text-[#ff003c] text-xs font-black hover:bg-[#ff003c] hover:text-black transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        placeholder="Max"
                        value={pendingFilters.maxPrice}
                        onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                        className="flex-1 bg-transparent border-none p-2 text-xs font-bold outline-none text-white placeholder:text-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => adjustPrice('maxPrice', 100)}
                        className="w-6 h-6 flex items-center justify-center rounded-xl bg-black text-[#ff003c] text-xs font-black hover:bg-[#ff003c] hover:text-black transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <LocationDropdown
                  label="Transmission"
                  icon={Car}
                  value={pendingFilters.transmission}
                  onChange={(val) => handleSelectChange('transmission', val)}
                  sites={TRANSMISSION_OPTIONS}
                  disabled={false}
                />
                <div className="flex items-end h-full justify-end gap-4">
                  <button
                    onClick={resetFilters}
                    className="text-[9px] font-black text-white/40 hover:text-[#ff003c] uppercase tracking-[0.2em]"
                  >
                    Reset
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-[#ff003c] text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white hover:text-black transition-all"
                  >
                    Appliquer
                  </button>
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
                  const imageUrl =
                    (car.primaryImage && car.primaryImage.image_url) ||
                    (Array.isArray(car.images) && car.images.length > 0
                      ? (car.images.find((img) => img.is_primary)?.image_url ||
                         (typeof car.images[0] === 'string' ? car.images[0] : car.images[0]?.image_url))
                      : null);
                  
                  const finalImageUrl = getImageUrl(imageUrl);
                  
                  return (
                    <div key={car.id} className="group bg-[#0a0a0a] rounded-[3rem] border border-white/5 overflow-hidden transition-all hover:border-[#ff003c]/30">
                      <div className="h-72 overflow-hidden relative">
                        <img src={finalImageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" alt={car.modele} />
                        <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                          <span className="text-[9px] font-black text-white uppercase italic tracking-tighter">{formatPrice(car.prix_par_jour)} MAD / J</span>
                        </div>
                        <div className="absolute top-6 right-6 bg-[#ff003c] backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                          <div className="flex items-center gap-2">
                            <Check size={12} className="text-white" />
                            <span className="text-[10px] font-black text-white uppercase italic tracking-tighter">DISPONIBLE</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-10 text-center md:text-left">
                        <h4 className="text-[10px] font-black text-[#ff003c] uppercase tracking-widest mb-1">{car.brand?.name || 'Marque'}</h4>
                        <h3 className="text-3xl font-black italic uppercase text-white mb-2">{car.modele}</h3>
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">
                            {car.display_variant || car.transmission || 'STANDARD'}
                          </p>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                            Transmission: <span className="text-white">{car.display_variant || car.transmission || '—'}</span>
                          </div>
                          <a href="tel:+212662719526" className="block w-full py-5 bg-white text-center text-black font-black uppercase italic rounded-2xl hover:bg-[#ff003c] hover:text-white transition-all shadow-xl">NOUS CONTACTER</a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>
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

const getCarStatusDisplay = (status) => {
  switch (status) {
    case 'DISPONIBLE':
      return { label: 'DISPONIBLE', style: 'text-green-400 border-green-400/30 bg-green-400/5' };
    case 'LOUE':
      return { label: 'LOUÉE', style: 'text-[#ff003c] border-[#ff003c]/30 bg-[#ff003c]/5' };
    case 'MAINTENANCE':
      return { label: 'MAINTENANCE', style: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5' };
    default:
      return { label: status || '—', style: 'text-white/30 border-white/10 bg-white/5' };
  }
};

const getBookingStatusDisplay = (status) => {
  switch (status) {
    case 'EN_ATTENTE':
      return { label: 'EN ATTENTE', style: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5' };
    case 'EN_COURS':
      return { label: 'EN COURS', style: 'text-[#ff003c] border-[#ff003c]/30 bg-[#ff003c]/5' };
    case 'TERMINE':
      return { label: 'TERMINE', style: 'text-green-400 border-green-400/30 bg-green-400/5' };
    case 'ANNULE':
      return { label: 'ANNULE', style: 'text-white/30 border-white/10 bg-white/5' };
    default:
      return { label: status || '—', style: 'text-white/30 border-white/10 bg-white/5' };
  }
};

const normalizeNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  if (value && typeof value.toNumber === 'function') return value.toNumber();
  return 0;
};

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const extractGroupCount = (row) => {
  if (!row) return 0;
  if (typeof row._count === 'number') return row._count;
  if (row._count && typeof row._count === 'object') {
    const countValue = Object.values(row._count)[0];
    return normalizeNumber(countValue);
  }
  if (row.count !== undefined) return normalizeNumber(row.count);
  return 0;
};

const getGroupCount = (rows, target) => {
  const match = normalizeArray(rows).find((item) =>
    item?.statut === target || item?.status === target || item?.name === target
  );
  return extractGroupCount(match);
};

const buildDashboardMetrics = (stats, bookingStats) => {
  const global = stats?.globalKPIs || {};
  const carsByStatus = global.cars?.byStatus || [];
  const totalCars = normalizeNumber(global.cars?.total);
  const availableCars = getGroupCount(carsByStatus, 'DISPONIBLE');
  const rentedCars = getGroupCount(carsByStatus, 'LOUE');
  const totalBookings = normalizeNumber(global.bookings?.total);
  const bookings30d = normalizeNumber(
    global.bookings?.last30Days ?? bookingStats?.statistics?.total_bookings
  );
  const totalRevenue = normalizeNumber(
    global.payments?.totalAmount ?? global.payments?.completed?.amount
  );
  const revenue30d = normalizeNumber(bookingStats?.statistics?.total_revenue);
  const bookingStatusRows = normalizeArray(bookingStats?.statistics?.bookings_by_status).map((row) => ({
    status: row.status || row.name || row.status_name || row.statut || row.status_id,
    count: normalizeNumber(row.count || row._count)
  }));

  const fallbackBookingRows = normalizeArray(global.bookings?.byStatus).map((row) => ({
    status: row.status || row.status_id,
    count: extractGroupCount(row)
  }));

  const resolvedBookingRows = bookingStatusRows.length ? bookingStatusRows : fallbackBookingRows;
  const recentBookings = normalizeArray(stats?.recentActivity?.bookings);

  return {
    totalCars,
    availableCars,
    rentedCars,
    totalBookings,
    totalRevenue,
    revenue30d,
    bookings30d,
    bookingStatusRows: resolvedBookingRows,
    recentBookings
  };
};

function StatCard({ label, value, sublabel, icon, accent = '#ff003c' }) {
  return (
    <div className={`${GLASS} p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden`}>
      <div className="absolute -top-10 -right-10 text-white/5">{icon}</div>
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">{label}</p>
      <p className="text-4xl font-black italic" style={{ color: accent }}>{value}</p>
      {sublabel && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mt-2">{sublabel}</p>}
    </div>
  );
}

function ProgressRow({ label, value, total, color }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">
        <span>{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [bookingStats, setBookingStats] = useState(null);
  const [topCars, setTopCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const [statsRes, bookingRes, bookingsRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getBookingStatistics({ period: '30d' }),
        adminService.listBookings({ page: 1, pageSize: 200, sortBy: 'date_creation', sortOrder: 'desc' })
      ]);

      if (!mounted) return;

      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      if (bookingRes.success) {
        setBookingStats(bookingRes.statistics);
      }

      if (bookingsRes.success) {
        const counts = new Map();
        bookingsRes.bookings.forEach((booking) => {
          const car = booking.car;
          const carId = car?.id || booking.car_id;
          if (!carId) return;
          const entry = counts.get(carId) || { car, count: 0 };
          entry.count += 1;
          counts.set(carId, entry);
        });
        const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 5);
        setTopCars(sorted);
      }

      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  const {
    totalCars,
    availableCars,
    rentedCars,
    totalBookings,
    totalRevenue,
    revenue30d,
    bookings30d,
    bookingStatusRows,
    recentBookings
  } = buildDashboardMetrics(stats, bookingStats);
  const totalStatusBookings = bookingStatusRows.reduce((sum, row) => sum + normalizeNumber(row.count), 0);

  if (loading) {
    return (
      <div className={`${GLASS} rounded-[3rem] p-12 border-white/5 text-center text-white/40 font-bold`}>
        Chargement des statistiques...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard label="Total Voitures" value={totalCars} icon={<Car size={140} />} />
        <StatCard label="Disponibles" value={availableCars} icon={<Check size={140} />} accent="#4ade80" />
        <StatCard label="Louées" value={rentedCars} icon={<TrendingUp size={140} />} accent="#ff003c" />
        <StatCard label="Réservations" value={totalBookings} icon={<Calendar size={140} />} accent="#fbbf24" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={`${GLASS} p-10 rounded-[3rem] border-white/5 xl:col-span-2`}>
          <h3 className="text-lg font-black italic uppercase text-white mb-8 flex items-center gap-3">
            <TrendingUp className="text-[#ff003c]" /> Revenus & activité
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Revenus totaux</p>
              <p className="text-3xl font-black italic text-[#ff003c]">{formatPrice(totalRevenue)} MAD</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Revenus 30j</p>
              <p className="text-3xl font-black italic text-white">{formatPrice(revenue30d)} MAD</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mt-2">{bookings30d} réservations</p>
            </div>
          </div>
          <div className="space-y-4">
            {bookingStatusRows.length === 0 ? (
              <div className="text-white/40 text-sm font-bold">Aucun statut disponible</div>
            ) : (
              bookingStatusRows.map((row) => (
                <ProgressRow
                  key={row.status}
                  label={row.status || 'INCONNU'}
                  value={row.count || 0}
                  total={totalStatusBookings}
                  color={row.status === 'EN_COURS' ? '#ff003c' : row.status === 'TERMINE' ? '#4ade80' : row.status === 'EN_ATTENTE' ? '#fbbf24' : '#94a3b8'}
                />
              ))
            )}
          </div>
        </div>

        <div className={`${GLASS} p-10 rounded-[3rem] border-white/5`}>
          <h3 className="text-lg font-black italic uppercase text-white mb-8 flex items-center gap-3">
            <Award className="text-[#ff003c]" /> Top véhicules
          </h3>
          <div className="space-y-4">
            {topCars.length === 0 ? (
              <div className="text-white/40 text-sm font-bold">Aucune donnée</div>
            ) : (
              topCars.map((entry, index) => (
                <div key={`${entry.car?.id || index}`} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">#{index + 1}</p>
                    <p className="text-sm font-bold text-white">{entry.car?.brand?.name || '—'} {entry.car?.modele || ''}</p>
                  </div>
                  <span className="text-[#ff003c] font-black text-sm">{entry.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={`${GLASS} p-10 rounded-[3rem] border-white/5`}>
        <h3 className="text-lg font-black italic uppercase text-white mb-8 flex items-center gap-3">
          <History className="text-[#ff003c]" /> Dernières réservations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recentBookings.length === 0 ? (
            <div className="text-white/40 text-sm font-bold">Aucune réservation récente</div>
          ) : (
            recentBookings.map((booking) => {
              const statusName = booking.status?.name || booking.status_name;
              const status = getBookingStatusDisplay(statusName);
              return (
                <div key={booking.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Réservation #{booking.id}</p>
                      <p className="text-sm font-bold text-white">{booking.car?.brand?.name || '—'} {booking.car?.modele || ''}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest ${status.style}`}>{status.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    <span>{booking.user?.prenom || 'Client'} {booking.user?.nom || ''}</span>
                    <span>{formatDateForDisplay(booking.date_debut)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function AdminCars() {
  const [cars, setCars] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [carImages, setCarImages] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePrimary, setImagePrimary] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    brand_id: '',
    modele: '',
    transmission: '',
    prix_par_jour: '',
    statut: 'DISPONIBLE'
  });

  const loadCars = async (page = 1) => {
    setLoading(true);
    const result = await adminService.listCars({ page, pageSize: 20, sortBy: 'date_creation', sortOrder: 'desc' });
    if (result.success) {
      setCars(result.cars || []);
      setPagination(result.pagination || null);
    }
    setLoading(false);
  };

  const loadLookups = async () => {
    const brandsRes = await adminService.listCarBrands({ page: 1, pageSize: 200 });
    if (brandsRes.success) setBrands(brandsRes.brands || []);
  };

  useEffect(() => {
    loadLookups();
    loadCars();
  }, []);

  const resetForm = () => {
    setForm({
      brand_id: '',
      modele: '',
      transmission: '',
      prix_par_jour: '',
      statut: 'DISPONIBLE'
    });
    setEditingId(null);
    setCarImages([]);
    setImageUrl('');
    setImageFile(null);
    setImagePrimary(true);
    setError(null);
  };

  const handleEdit = async (carId) => {
    const result = await adminService.getCarById(carId);
    if (result.success) {
      const car = result.car;
      setEditingId(carId);
      setForm({
        brand_id: car.brand_id?.toString() || '',
        modele: car.modele || '',
        transmission: car.transmission || '',
        prix_par_jour: car.prix_par_jour?.toString() || '',
        statut: car.statut || 'DISPONIBLE'
      });
      setCarImages(car.images || []);
      setImageUrl('');
      setImageFile(null);
      setImagePrimary(true);
    }
  };

  const handleDelete = async (carId) => {
    await adminService.deleteCar(carId);
    loadCars(pagination?.page || 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!form.brand_id || !form.modele?.trim() || !form.transmission || !form.prix_par_jour) {
      setError('La marque, le modele, la transmission et le prix sont obligatoires');
      return;
    }

    if (!editingId && !imageUrl?.trim() && !imageFile) {
      setError('La photo est obligatoire pour creer une annonce');
      return;
    }

    const basePayload = {
      brand_id: form.brand_id ? parseInt(form.brand_id) : undefined,
      modele: form.modele?.trim(),
      transmission: form.transmission?.trim(),
      prix_par_jour: form.prix_par_jour ? parseFloat(form.prix_par_jour) : undefined,
      statut: form.statut
    };

    const cleanedPayload = Object.fromEntries(
      Object.entries(basePayload).filter(([, value]) => value !== undefined && value !== '')
    );

    const result = editingId
      ? await adminService.updateCar(editingId, cleanedPayload)
      : await adminService.createCar(cleanedPayload);

    if (!result.success) {
      setError(result.error?.message || 'Erreur lors de la sauvegarde');
      return;
    }

    const carId = editingId || result.car?.id;
    if (carId) {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        // Just pass the file object directly, the service handles FormData
        const uploadRes = await adminService.uploadCarImage(imageFile);
        if (uploadRes.success) {
          // The service returns the url directly in the success object
          finalImageUrl = uploadRes.url;
        } else {
          setError(uploadRes.error?.message || 'Erreur lors de l’upload de l’image');
          return;
        }
      }
      
      if (finalImageUrl) {
        const imageResult = await adminService.createCarImage({ 
          car_id: carId, 
          image_url: finalImageUrl, 
          is_primary: imagePrimary 
        });

        if (!imageResult.success) {
          setError(imageResult.error?.message || 'La voiture a ete creee, mais l’image n’a pas pu etre associee');
          return;
        }
        
        // If we are editing, refresh the images list immediately
        if (editingId) {
          const updatedCarRes = await adminService.getCarById(editingId);
          if (updatedCarRes.success) {
            setCarImages(updatedCarRes.car.images || []);
          }
        }
      }
    }

    resetForm();
    loadCars(pagination?.page || 1);
  };

  const handleDeleteImage = async (imageId) => {
    await adminService.deleteCarImage(imageId);
    if (editingId) {
      const result = await adminService.getCarById(editingId);
      if (result.success) setCarImages(result.car.images || []);
    }
  };

  const getBrandName = (brandId) => brands.find((b) => b.id === brandId)?.name || '—';
  const getCarImage = (car) => {
    const primary = Array.isArray(car.images)
      ? (car.images.find((img) => img.is_primary)?.image_url || car.images[0]?.image_url)
      : null;
    return getImageUrl(primary);
  };

  return (
    <div className="space-y-10">
      <div className={`${GLASS} p-10 rounded-[3rem] border-white/5`}>
        <h3 className="text-xl font-black italic uppercase text-white mb-8 flex items-center gap-3">
          <Car className="text-[#ff003c]" /> {editingId ? 'Modifier la voiture' : 'Ajouter une voiture'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminSelect
              label="Marque"
              value={form.brand_id}
              onChange={(val) => setForm({ ...form, brand_id: val })}
              options={[
                { value: '', label: 'Sélectionner' },
                ...brands.map((brand) => ({
                  value: String(brand.id),
                  label: brand.name
                }))
              ]}
            />
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Modèle</label>
              <input value={form.modele} onChange={(e) => setForm({ ...form, modele: e.target.value })} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-bold outline-none focus:border-[#ff003c]" />
            </div>
            <AdminSelect
              label="Transmission"
              value={form.transmission}
              onChange={(val) => setForm({ ...form, transmission: val })}
              options={[
                { value: '', label: 'Sélectionner' },
                { value: 'Automatique', label: 'Automatique' },
                { value: 'Manuelle', label: 'Manuelle' }
              ]}
            />
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Prix / jour (MAD)</label>
              <input type="number" value={form.prix_par_jour} onChange={(e) => setForm({ ...form, prix_par_jour: e.target.value })} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-bold outline-none focus:border-[#ff003c]" />
            </div>
            <AdminSelect
              label="Statut"
              value={form.statut}
              onChange={(val) => setForm({ ...form, statut: val })}
              options={[
                { value: 'DISPONIBLE', label: 'DISPONIBLE' },
                { value: 'LOUE', label: 'LOUÉE' },
                { value: 'MAINTENANCE', label: 'MAINTENANCE' }
              ]}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Photo (URL)</label>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-bold outline-none focus:border-[#ff003c]" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Photo (upload)</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full bg-white/5 border border-white/10 p-3 rounded-2xl text-[10px] font-bold outline-none focus:border-[#ff003c]" />
            </div>
            <AdminSelect
              label="Image principale"
              value={imagePrimary ? 'true' : 'false'}
              onChange={(val) => setImagePrimary(val === 'true')}
              options={[
                { value: 'true', label: 'Oui' },
                { value: 'false', label: 'Non' }
              ]}
            />
          </div>
          {error && <div className="text-red-500 text-sm font-bold">{error}</div>}
          <div className="flex flex-wrap gap-4">
            <button type="submit" className="px-6 py-3 bg-[#ff003c] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:text-black transition-all">
              {editingId ? 'Mettre à jour' : 'Créer'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-6 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:border-[#ff003c] transition-all">
                Annuler
              </button>
            )}
          </div>
        </form>
        {editingId && carImages.length > 0 && (
          <div className="mt-8 space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Images existantes</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {carImages.map((img) => (
                <div key={img.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <img src={getImageUrl(img.image_url)} alt={img.alt_text || 'Car'} className="h-32 w-full object-cover" />
                  <div className="p-3 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/40">
                    <span>{img.is_primary ? 'Principale' : 'Secondaire'}</span>
                    <button type="button" onClick={() => handleDeleteImage(img.id)} className="text-red-400 hover:text-red-300">Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`${GLASS} p-10 rounded-[3rem] border-white/5`}>
        <h3 className="text-xl font-black italic uppercase text-white mb-8">Flotte actuelle</h3>
        {loading ? (
          <div className="text-white/40 font-bold">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {cars.map((car) => {
              const status = getCarStatusDisplay(car.statut);
              return (
                <div key={car.id} className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <div className="h-44 rounded-2xl overflow-hidden mb-5 bg-white/5 border border-white/10">
                    <img
                      src={getCarImage(car)}
                      alt={car.modele}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{car.brand?.name || getBrandName(car.brand_id)}</p>
                      <p className="text-xl font-black italic text-white">{car.modele}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest ${status.style}`}>{status.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    <span>{car.transmission || '—'}</span>
                    <span className="text-white">{formatPrice(car.prix_par_jour)} MAD</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-6">
                    <button type="button" onClick={() => handleEdit(car.id)} className="px-4 py-2 bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest rounded-2xl hover:border-[#ff003c] transition-all">
                      Modifier
                    </button>
                    <button type="button" onClick={() => handleDelete(car.id)} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-500/20 transition-all">
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [statuses, setStatuses] = useState(['EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ANNULE']);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadBookings = async () => {
    setLoading(true);
    const result = await adminService.listBookings({ page: 1, pageSize: 30, sortBy: 'date_creation', sortOrder: 'desc' });
    if (result.success) {
      setBookings(result.bookings || []);
    }
    setLoading(false);
  };

  const loadStatuses = async () => {
    const result = await adminService.listBookingStatuses({ page: 1, pageSize: 50 });
    if (result.success) {
      const names = result.statuses.map((status) => status.name).filter(Boolean);
      if (names.length) setStatuses(names);
    }
  };

  useEffect(() => {
    loadBookings();
    loadStatuses();
  }, []);

  const syncCarStatus = async (booking, newStatus) => {
    const carId = booking.car?.id || booking.car_id;
    if (!carId) return;
    if (newStatus === 'EN_COURS') {
      await adminService.updateCar(carId, { statut: 'LOUE' });
      return;
    }
    if (newStatus === 'TERMINE' || newStatus === 'ANNULE') {
      await adminService.updateCar(carId, { statut: 'DISPONIBLE' });
    }
  };

  const handleStatusChange = async (booking, newStatus) => {
    setUpdatingId(booking.id);
    const result = await adminService.updateBookingStatus(booking.id, { status: newStatus });
    if (result.success) {
      await syncCarStatus(booking, newStatus);
      setBookings((prev) => prev.map((item) => item.id === booking.id ? { ...item, status: result.booking?.status || { name: newStatus }, status_name: newStatus } : item));
    }
    setUpdatingId(null);
  };

  return (
    <div className={`${GLASS} p-10 rounded-[3rem] border-white/5`}>
      <h3 className="text-xl font-black italic uppercase text-white mb-8 flex items-center gap-3">
        <Calendar className="text-[#ff003c]" /> Réservations
      </h3>
      {loading ? (
        <div className="text-white/40 font-bold">Chargement...</div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const statusName = booking.status?.name || booking.status_name;
            const status = getBookingStatusDisplay(statusName);
            return (
              <div key={booking.id} className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Réservation #{booking.id}</p>
                    <p className="text-lg font-black italic text-white">{booking.car?.brand?.name || '—'} {booking.car?.modele || ''}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-2">
                      {booking.user?.prenom || 'Client'} {booking.user?.nom || ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-4 py-2 rounded-2xl border text-[9px] font-black uppercase tracking-widest ${status.style}`}>{status.label}</span>
                    <select
                      value={statusName || ''}
                      onChange={(e) => handleStatusChange(booking, e.target.value)}
                      disabled={updatingId === booking.id}
                      className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white/80 outline-none focus:border-[#ff003c] focus:text-white appearance-none cursor-pointer"
                    >
                      {statuses.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>{statusOption}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <span>Début: <span className="text-white">{formatDateForDisplay(booking.date_debut)}</span></span>
                  <span>Fin: <span className="text-white">{formatDateForDisplay(booking.date_fin)}</span></span>
                  <span>Prix: <span className="text-white">{formatPrice(booking.prix_total)} MAD</span></span>
                  <span>Paiement: <span className="text-white">{booking.paiement_effectue ? 'OK' : 'EN ATTENTE'}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto min-h-[90vh]">
      <SectionTitle subtitle="Control_Room" title="ADMIN CONSOLE" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={`${GLASS} p-8 rounded-[3rem] border-white/5 lg:col-span-3 h-fit`}>
          <div className="mb-8">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Connecté en tant que</p>
            <p className="text-lg font-black italic text-white">{user?.prenom} {user?.nom}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#ff003c]">{user?.role}</p>
          </div>
          <div className="space-y-4">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeTab === 'dashboard' ? 'bg-[#ff003c]/10 border-[#ff003c]/30 text-[#ff003c]' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}>
              Dashboard
            </button>
            <button onClick={() => setActiveTab('cars')} className={`w-full text-left px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeTab === 'cars' ? 'bg-[#ff003c]/10 border-[#ff003c]/30 text-[#ff003c]' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}>
              Voitures
            </button>
            <button onClick={() => setActiveTab('bookings')} className={`w-full text-left px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeTab === 'bookings' ? 'bg-[#ff003c]/10 border-[#ff003c]/30 text-[#ff003c]' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}>
              Réservations
            </button>
          </div>
        </div>
        <div className="lg:col-span-9 space-y-8">
          {activeTab === 'dashboard' && <AdminOverview />}
          {activeTab === 'cars' && <AdminCars />}
          {activeTab === 'bookings' && <AdminBookings />}
        </div>
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

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (currentView === 'admin' && user?.role !== 'ADMIN') {
      setCurrentView('home');
      if (!user) {
        setAuthOpen(true);
      }
    }
  }, [currentView, user]);

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
      {currentView === 'search-results' && <SearchResultsPage />}
      {currentView === 'profile' && user && <UserProfile />}
      {currentView === 'about' && <AboutPage setView={setCurrentView} />}
      {currentView === 'admin' && user?.role === 'ADMIN' && <AdminDashboard />}
      
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
