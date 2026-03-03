import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import bookingService from './services/booking.service';
import { 
  FaCar as Car,
  FaMapMarkerAlt as MapPin,
  FaCalendar as Calendar,
  FaSearch as Search,
  FaUser as User,
  FaChevronDown as ChevronDown,
  FaStar as Star,
  FaBolt as Zap,
  FaShieldAlt as ShieldCheck,
  FaCompass as Navigation,
  FaClock as Clock,
  FaArrowRight as ArrowRight,
  FaPlus as Plus,
  FaMinus as Minus,
  FaComment as MessageSquare,
  FaAward as Award,
  FaFilter as Filter,
  FaCheck as Check,
  FaTimes as X,
  FaChevronRight as ChevronRight,
  FaCog as Settings2,
  FaUsers as Users,
  FaTint as Droplet,
  FaLock as Lock,
  FaEnvelope as Mail,
  FaUserPlus as UserPlus,
  FaArrowLeft as ArrowLeft,
  FaHistory as History,
  FaDownload as Download,
  FaFileAlt as FileText,
  FaCreditCard as CreditCard,
  FaWallet as Wallet,
  FaSlidersH as SlidersHorizontal,
  FaShieldAlt as Shield,
  FaBriefcase as Briefcase,
  FaHome as Home,
  FaIdCard as IdCard,
  FaGlobe as Globe,
  FaMap as Map
} from 'react-icons/fa';

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

const AppleIcon = () => (
  <svg viewBox="0 0 384 512" width="18" height="18" fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

function Navbar({ currentView, setView, onOpenAuth }) {
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
          <button onClick={() => setView('bookings')} className={`hover:text-[#ff003c] transition-colors ${currentView === 'bookings' ? 'text-[#ff003c]' : ''}`}>Réservations</button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenAuth}
            className="bg-white/5 hover:bg-white hover:text-black border border-white/10 px-6 py-2.5 rounded-xl text-xs font-black uppercase italic transition-all duration-300 flex items-center gap-2 group"
          >
            <User size={14} className="text-[#ff003c] group-hover:text-black" />
            <span>Connexion | Inscription</span>
          </button>
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
        <span className="text-transparent stroke-text">{subtitle}</span>
      </div>
      <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white leading-none tracking-tight">{title}</h2>
    </div>
  );
}

function CategorySelector({ selectedCat, onSelect }) {
  return (
    <section className="mb-20">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-[#ff003c] font-black uppercase tracking-[0.4em] text-[10px] mb-4 italic">Architecture de Flotte</span>
        <h1 className="text-5xl md:text-8xl font-black italic uppercase text-white leading-none tracking-tighter">
          DISCIPLINE <br /> <span className="text-transparent stroke-text">ESTHÉTIQUE</span>
        </h1>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {CATEGORIES.map((cat) => (
          <motion.div
            key={cat.id}
            whileHover={{ scale: 1.02, y: -5 }}
            onClick={() => onSelect(cat.id)}
            className={`cursor-pointer p-6 md:p-8 rounded-[2rem] border-2 transition-all duration-500 relative overflow-hidden group ${selectedCat === cat.id ? 'bg-[#ff003c] border-[#ff003c] shadow-lg' : 'bg-[#0a0a0a] border-white/5 hover:border-white/20'}`}
          >
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6 ${selectedCat === cat.id ? 'bg-white text-[#ff003c]' : 'bg-white/5 text-white/50 group-hover:text-white'}`}>
              <cat.icon size={28} />
            </div>
            <h3 className="text-xl md:text-2xl font-black italic uppercase mb-2 text-white leading-none">{cat.name}</h3>
            <p className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest ${selectedCat === cat.id ? 'text-white/80' : 'text-white/40'}`}>{cat.description}</p>
            {selectedCat === cat.id && (
                <motion.div layoutId="active-cat-marker" className="absolute top-4 right-4 text-white"><Check size={20} /></motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function AuthPortal({ isOpen, onClose }) {
  const [mode, setMode] = useState('login'); 
  
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    console.log("Appel API vers la route d'authentification...");
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
              <form onSubmit={handleAuthSubmit} className="space-y-8">
                <div className="space-y-4 text-left">
                  <label className="text-[10px] font-black text-[#ff003c] uppercase tracking-[0.4em] ml-2">Votre e-mail</label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#ff003c] transition-colors" size={20} />
                    <input type="email" required placeholder="exemple@domaine.ma" className="w-full bg-white/5 border border-white/10 p-6 pl-16 rounded-[2rem] text-sm font-bold text-white outline-none focus:border-[#ff003c] transition-all placeholder:text-white/10" />
                  </div>
                </div>
                <button type="submit" className="w-full py-6 bg-[#ff003c] text-white font-black uppercase italic rounded-[2rem] shadow-[0_15px_30px_rgba(255,0,60,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-widest">
                   {mode === 'login' ? 'INITIALISER CONNEXION' : 'VALIDER INSCRIPTION'}
                </button>
                <div className="relative py-4 text-center">
                   <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                   <span className="relative bg-[#050505] px-4 text-[8px] font-black uppercase text-white/20 tracking-[0.4em]">OU AVEC</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <button type="button" className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"><GoogleIcon/><span className="text-[10px] font-black uppercase">Google</span></button>
                   <button type="button" className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"><AppleIcon/><span className="text-[10px] font-black uppercase">Apple</span></button>
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

function SearchSection({ isSticky }) {
  return (
    <motion.div className={`${isSticky ? 'fixed top-24 inset-x-0 z-[90] flex justify-center px-4 md:px-0' : 'relative w-full'}`}>
      <div className={`${GLASS} p-2 rounded-3xl border-[#ff003c]/30 ${GLOW_RED} transition-all duration-500 w-full max-w-6xl`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="flex flex-col p-3 border-r border-white/10 group"><label className="text-[8px] font-black text-[#ff003c] uppercase mb-1 text-left">Lieu de Retrait</label><div className="flex items-center gap-2"><MapPin size={16} className="text-white/40" /><input type="text" placeholder="Casablanca..." className="bg-transparent border-none outline-none text-white text-xs font-bold w-full" /></div></div>
          <div className="flex flex-col p-3 border-r border-white/10"><label className="text-[8px] font-black text-[#ff003c] uppercase mb-1 text-left">Lieu de Retour</label><div className="flex items-center gap-2"><Navigation size={16} className="text-white/40" /><input type="text" placeholder="Même ville..." className="bg-transparent border-none outline-none text-white text-xs font-bold w-full" /></div></div>
          <div className="flex flex-col p-3 border-r border-white/10"><label className="text-[8px] font-black text-[#ff003c] uppercase mb-1 text-left">Départ</label><div className="flex items-center gap-2"><Calendar size={16} className="text-white/40" /><input type="date" className="bg-transparent border-none outline-none text-white text-xs font-bold w-full [color-scheme:dark]" /></div></div>
          <div className="flex flex-col p-3 border-r border-white/10"><label className="text-[8px] font-black text-[#ff003c] uppercase mb-1 text-left">Retour</label><div className="flex items-center gap-2"><Clock size={16} className="text-white/40" /><input type="date" className="bg-transparent border-none outline-none text-white text-xs font-bold w-full [color-scheme:dark]" /></div></div>
          <button className="bg-[#ff003c] hover:bg-white hover:text-black transition-all rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase italic py-4 md:py-0"><Search size={20} /></button>
        </div>
      </div>
    </motion.div>
  );
}

function HomeView({ setView, setSelectedCat }) {
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

  return (
    <>
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
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
          <SearchSection isSticky={stickySearch} />
          <div className="mt-20 flex justify-center gap-10 md:gap-24 text-center">
            <div className="group cursor-default"><p className="text-4xl font-black text-white italic group-hover:text-[#ff003c] transition-colors duration-300">500+</p><p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Véhicules</p></div>
            <div className="group cursor-default"><p className="text-4xl font-black text-white italic group-hover:text-[#ff003c] transition-colors duration-300">24/7</p><p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Support VIP</p></div>
            <div className="group cursor-default"><p className="text-4xl font-black text-[#ff003c] italic">4.9</p><p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Satisfaction</p></div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 space-y-48 pb-40 text-center md:text-left">
        <CategorySelector onSelect={handleHomeCatSelect} />

        <section>
          <SectionTitle subtitle="Succès Catalogue" title="Les Plus Demandées" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {TOP_CARS.map((car) => (
              <div key={car.id} className="group relative overflow-hidden rounded-[3rem] bg-[#0a0a0a] border border-white/5 cursor-pointer" onClick={() => setView('cars')}>
                <img src={car.image} className="w-full h-[450px] object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-105" alt={car.name} />
                <div className="absolute bottom-0 left-0 w-full p-10 bg-gradient-to-t from-black via-black/40 to-transparent">
                  <h4 className="text-3xl font-black italic uppercase text-white mb-2 tracking-tighter text-left">{car.name}</h4>
                  <p className="text-[#ff003c] font-black italic text-xl text-left">À partir de {car.price} MAD/jour</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle subtitle="Exclusivités" title="Promotions du Moment" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROMOS.map((promo) => (
              <motion.div key={promo.id} whileHover={{ y: -15, borderColor: '#ff003c' }} className={`${GLASS} p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden group cursor-pointer transition-all duration-500`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff003c]/10 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-1000" />
                <h4 className="text-white/40 font-bold uppercase text-[10px] mb-3 tracking-widest text-left">{promo.car}</h4>
                <p className="text-2xl font-black uppercase italic mb-4 text-white text-left">{promo.title}</p>
                <p className="text-7xl font-black text-[#ff003c] italic tracking-tighter group-hover:text-white transition-colors text-left">{promo.discount}</p>
                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-white italic group-hover:translate-x-2 transition-all">Activer le code <ArrowRight size={14} /></div>
              </motion.div>
            ))}
          </div>
        </section>

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

function CarsPage({ selectedCat, setSelectedCat, setView }) {
  const [filters, setFilters] = useState({ transmission: 'Tous', minPrice: 0, maxPrice: 5000, fuel: 'Tous' });
  const [bookingCar, setBookingCar] = useState(null);
  const [checkResult, setCheckResult] = useState(null);
  const carSectionRef = useRef(null);

  const filteredCars = useMemo(() => {
    return MOCK_CARS.filter(car => {
      const matchCat = selectedCat ? car.categoryId === selectedCat : true;
      const matchTrans = filters.transmission === 'Tous' ? true : car.transmission === filters.transmission;
      const matchPrice = car.prix_par_jour >= filters.minPrice && car.prix_par_jour <= filters.maxPrice;
      const matchFuel = filters.fuel === 'Tous' ? true : car.variantes[0].type_carburant === filters.fuel;
      return matchCat && matchTrans && matchPrice && matchFuel;
    });
  }, [selectedCat, filters]);

  const handleCheckAvailability = async () => {
    setCheckResult('checking');
    setTimeout(() => setCheckResult(Math.random() > 0.3 ? 'available' : 'unavailable'), 1500);
  };

  const confirmReservation = async () => {
    setView('home');
  };

  return (
    <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto">
      <CategorySelector selectedCat={selectedCat} onSelect={(id) => {
        setSelectedCat(id);
        setTimeout(() => carSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }} />
      <AnimatePresence>
        {selectedCat && (
          <motion.section key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} ref={carSectionRef} className="scroll-mt-32">
            <div className="mb-12 border-b border-white/10 pb-10">
               <SectionTitle subtitle={CATEGORIES.find(c => c.id === selectedCat)?.name} title="RÉSULTATS DE RECHERCHE" />
               <div className={`${GLASS} mt-8 p-6 rounded-[2rem] grid grid-cols-2 md:grid-cols-5 gap-6 items-center border-white/5`}>
                 <div className="space-y-2"><label className="text-[9px] font-black text-[#ff003c] uppercase tracking-widest block">Prix Min/Max</label>
                   <div className="flex items-center gap-2">
                     <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => setFilters({...filters, minPrice: parseInt(e.target.value) || 0})} className="bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold w-full outline-none focus:border-[#ff003c]" />
                     <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value) || 5000})} className="bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold w-full outline-none focus:border-[#ff003c]" />
                   </div>
                 </div>
                 <div className="space-y-2"><label className="text-[9px] font-black text-[#ff003c] uppercase tracking-widest block">Transmission</label>
                   <select value={filters.transmission} onChange={(e) => setFilters({...filters, transmission: e.target.value})} className="bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold w-full outline-none cursor-pointer">
                     <option value="Tous">Tous</option><option value="Automatique">Automatique</option><option value="Manuelle">Manuelle</option>
                   </select>
                 </div>
                
                 <div className="space-y-2"><label className="text-[9px] font-black text-[#ff003c] uppercase tracking-widest block">Carburant</label>
                   <select value={filters.fuel} onChange={(e) => setFilters({...filters, fuel: e.target.value})} className="bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold w-full outline-none cursor-pointer">
                     <option value="Tous">Tous</option><option value="Essence">Essence</option><option value="Diesel">Diesel</option><option value="Électrique">Électrique</option>
                   </select>
                 </div>
                 <div className="flex items-end h-full"><button onClick={() => setFilters({ minPrice: 0, maxPrice: 5000, transmission: 'Tous', fuel: 'Tous' })} className="text-[9px] font-black text-white/40 hover:text-[#ff003c] uppercase tracking-[0.2em]">Reset</button></div>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredCars.map((car) => (
                <div key={car.id} className="group bg-[#0a0a0a] rounded-[3rem] border border-white/5 overflow-hidden transition-all hover:border-[#ff003c]/30">
                  <div className="h-72 overflow-hidden relative">
                    <img src={car.images[0]} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110" alt={car.modele} />
                    <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10"><span className="text-[9px] font-black text-white uppercase italic tracking-tighter">{car.prix_par_jour} MAD / J</span></div>
                  </div>
                  <div className="p-10 text-center md:text-left">
                    <h4 className="text-[10px] font-black text-[#ff003c] uppercase tracking-widest mb-1">{car.brand.name}</h4>
                    <h3 className="text-3xl font-black italic uppercase text-white mb-6">{car.modele}</h3>
                    <button onClick={() => setBookingCar(car)} className="w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-[#ff003c] hover:text-white transition-all shadow-xl">VÉRIFIER DISPONIBILITÉ</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <section className="mt-40 pt-20 border-t border-white/10 text-center md:text-left">
        <SectionTitle subtitle="Succès Flotte" title="LES PLUS DEMANDÉES" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
           {MOCK_CARS.slice(0, 3).map((car) => (
              <motion.div key={car.id} whileHover={{ y: -10 }} className="group relative rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer bg-[#0a0a0a]" onClick={() => {setSelectedCat(car.categoryId); window.scrollTo({ top: 0, behavior: 'smooth' });}}>
                 <div className="h-64 overflow-hidden"><img src={car.images[0]} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Hot" /></div>
                 <div className="p-8"><h4 className="text-xl font-black italic uppercase text-white text-left">{car.brand.name} {car.modele}</h4></div>
              </motion.div>
           ))}
        </div>
      </section>
      <AnimatePresence>
        {bookingCar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-black/95 backdrop-blur-3xl">
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="max-w-4xl w-full bg-[#111] border border-white/10 rounded-[3.5rem] p-10 md:p-16 relative overflow-hidden shadow-2xl text-left">
              <button onClick={() => {setBookingCar(null); setCheckResult(null);}} className="absolute top-10 right-10 text-white hover:text-[#ff003c] transition-colors"><X size={32} /></button>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white mb-10 tracking-tighter">{bookingCar.brand.name} <span className="text-transparent stroke-text">{bookingCar.modele}</span></h2>
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                   <div className="space-y-3"><label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 italic">Début</label><input type="date" className="bg-white/5 w-full p-6 rounded-3xl border border-white/10 text-white outline-none focus:border-[#ff003c] [color-scheme:dark] font-bold" /></div>
                   <div className="space-y-3"><label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 italic">Fin</label><input type="date" className="bg-white/5 w-full p-6 rounded-3xl border border-white/10 text-white outline-none focus:border-[#ff003c] [color-scheme:dark] font-bold" /></div>
                </div>
                <div className="flex flex-col gap-4">
                    <button onClick={handleCheckAvailability} className="w-full py-6 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-[#ff003c] hover:text-white transition-all shadow-xl">{checkResult === 'checking' ? 'Vérification...' : 'VÉRIFIER LA DISPONIBILITÉ'}</button>
                    {checkResult === 'available' && (<motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={confirmReservation} className="w-full py-6 bg-[#ff003c] text-white font-black uppercase italic rounded-2xl shadow-lg">CONFIRMER LA RÉSERVATION</motion.button>)}
                    {checkResult === 'unavailable' && (<div className="p-6 bg-red-600/10 border border-red-600/30 rounded-3xl text-center text-red-500 font-black uppercase italic tracking-widest">VÉHICULE NON DISPONIBLE</div>)}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookingsPage({ setView }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const result = await bookingService.getMyBookings();
        if (result.success) {
          setBookings(result.bookings);
        } else {
          console.error("Error fetching bookings:", result.error);
          setError("Impossible de charger les réservations.");
        }
      } catch (err) {
        console.error("Exception fetching bookings:", err);
        setError("Erreur de connexion.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'EN_ATTENTE': return { label: 'EN ATTENTE', style: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5', icon: <Clock size={12}/> };
      case 'EN_COURS': return { label: 'MISSION ACTIVE', style: 'text-[#ff003c] border-[#ff003c]/30 bg-[#ff003c]/5 shadow-lg', icon: <Zap size={12} className="animate-pulse"/> };
      case 'TERMINE': return { label: 'TERMINEE', style: 'text-green-400 border-green-400/30 bg-green-400/5', icon: <Check size={12}/> };
      case 'ANNULE': return { label: 'ANNULE', style: 'text-white/20 border-white/10 bg-white/5', icon: <X size={12}/> };
      default: return { label: status, style: 'text-white/40', icon: null };
    }
  };
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  const downloadInvoice = async (invoiceId) => {
    console.log("Demande de téléchargement de la facture...");
  };

  if (loading) {
    return (
      <div className="pt-40 pb-40 px-6 max-w-7xl mx-auto min-h-[90vh] flex items-center justify-center">
        <div className="text-[#ff003c] animate-pulse font-black uppercase tracking-widest">Chargement des missions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-40 pb-40 px-6 max-w-7xl mx-auto min-h-[90vh] flex flex-col items-center justify-center gap-4">
        <div className="text-red-500 font-bold">{error}</div>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="pt-40 pb-40 px-6 max-w-7xl mx-auto min-h-[90vh]">
      <SectionTitle subtitle="Protocol_Archives" title="MES RÉSERVATIONS" />
      <div className="grid gap-10">
        {bookings.length === 0 ? (
          <div className="text-white/30 text-center py-20 font-black uppercase italic tracking-widest border border-white/5 rounded-[3rem] bg-white/5">
            Aucune mission trouvée
          </div>
        ) : (
          bookings.map((book) => {
          const status = getStatusDisplay(book.status?.name || book.status_name);
          // Backend provides car directly in the booking object
          const car = book.car;
          if (!car) return null;

          return (
            <motion.div key={book.id} whileHover={{ y: -5 }} className={`${GLASS} rounded-[3.5rem] border border-white/5 flex flex-col md:flex-row overflow-hidden group transition-all duration-500`}>
              <div className="w-full md:w-64 h-64 md:h-auto overflow-hidden border-r border-white/5 relative">
                {(car.primaryImage?.image_url || car.images?.[0]?.image_url || car.images?.[0]) && (
                  <img src={car.primaryImage?.image_url || car.images?.[0]?.image_url || car.images?.[0]} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt="Car" />
                )}
                <div className="absolute top-6 left-6">
                  <div className={`px-4 py-1.5 border rounded-full text-[9px] font-black uppercase flex items-center gap-2 backdrop-blur-md ${status.style}`}>
                    {status.icon} {status.label}
                  </div>
                </div>
              </div>
              <div className="flex-1 p-10 flex flex-col justify-between text-left">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div>
                    <p className="text-[9px] font-black text-[#ff003c] uppercase mb-2 italic">#{book.id}_MISSION</p>
                    <h4 className="text-3xl font-black italic uppercase text-white mb-4 tracking-tighter text-left">{car.brand?.name} {car.modele}</h4>
                    <div className="flex gap-8 text-[10px] font-bold text-white/40 uppercase tracking-widest text-left">
                       <div className="flex items-center gap-2 text-left"><MapPin size={14} className="text-[#ff003c]"/> {book.lieu_prise_en_charge}</div>
                       <div className="flex items-center gap-2 text-left"><Calendar size={14}/> {formatDate(book.date_debut)} — {formatDate(book.date_fin)}</div>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                     <p className="text-[9px] font-black text-white/20 uppercase mb-1 tracking-widest">Prix Total</p>
                     <p className="text-3xl font-black text-white italic">{book.prix_total} MAD</p>
                  </div>
                </div>
                <div className="mt-10 pt-6 border-t border-white/5 flex gap-4">
                  {book.invoices && book.invoices.length > 0 ? (
                    <button onClick={() => downloadInvoice(book.invoices[0].id)} className="flex-1 py-4 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-[#ff003c] hover:text-white transition-all text-[11px] flex items-center justify-center gap-2 shadow-lg"><Download size={16}/> Télécharger Facture</button>
                  ) : (
                    <div className="flex-1 py-4 bg-white/5 border border-white/10 text-white/20 font-black uppercase italic rounded-2xl text-[10px] flex items-center justify-center gap-2 cursor-not-allowed"><FileText size={16}/> En attente de paiement</div>
                  )}
                  <button className="px-10 py-4 border border-white/10 hover:border-[#ff003c] rounded-2xl text-[11px] font-black uppercase italic transition-all text-white">Support</button>
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

export default function App() {
  const { scrollY } = useScroll();
  const [isStickySearch, setIsStickySearch] = useState(false);
  const [view, setView] = useState('home'); 
  const [selectedCat, setSelectedCat] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsStickySearch(latest > 500);
    });
    return () => unsubscribe();
  }, [scrollY]);

  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  const scaleX = useSpring(useTransform(scrollY, [0, 5000], [0, 1]), { stiffness: 100, damping: 30 });

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#ff003c] overflow-x-hidden font-sans">
      
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-[#ff003c] z-[120] origin-left shadow-[0_0_15px_#ff003c]" style={{ scaleX }} />

      <Navbar currentView={view} setView={setView} onOpenAuth={() => setShowAuthModal(true)} />

      <AuthPortal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <AnimatePresence mode="wait">
        <motion.main key={view} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5 }}>
          {view === 'home' && <HomeView setView={setView} setSelectedCat={setSelectedCat} />}
          {view === 'cars' && <CarsPage selectedCat={selectedCat} setSelectedCat={setSelectedCat} setView={setView} />}
          {view === 'bookings' && <BookingsPage setView={setView} />}
        </motion.main>
      </AnimatePresence>

      <AnimatePresence>
        {isStickySearch && view === 'home' && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="fixed top-24 left-0 w-full z-[100] px-6">
            <SearchSection isSticky={true} />
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="bg-black border-t border-white/10 py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-20">
          <div className="max-w-sm text-center md:text-left mx-auto md:mx-0">
            <h5 className="text-5xl font-black italic uppercase tracking-tighter mb-8 text-[#ff003c]">TOMMOBILTY</h5>
            <p className="text-[11px] font-black uppercase text-white/20 tracking-[0.4em] leading-loose text-left">Propelled by Speed & Excellence. Le standard absolu de l'élite automobile au Maroc.</p>
          </div>
          <div className="flex gap-24 text-left text-xs font-bold uppercase text-white/30 tracking-widest mx-auto md:mx-0">
            <div className="space-y-4">
              <p className="text-[#ff003c] font-black italic mb-6">Navigation</p>
              <p className="cursor-pointer hover:text-white transition-all text-left" onClick={() => setView('home')}>Accueil</p>
              <p className="cursor-pointer hover:text-white transition-all text-left" onClick={() => setView('cars')}>Catalogue</p>
              <p className="cursor-pointer hover:text-white transition-all text-left" onClick={() => setView('bookings')}>Réservations</p>
            </div>
            <div className="space-y-4">
              <p className="text-[#ff003c] font-black italic mb-6">Contact</p>
              <p className="text-left">Casablanca / Rabat</p>
              <p className="text-white text-left">+212 522 00 00 00</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
