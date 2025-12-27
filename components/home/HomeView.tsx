"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import { Zap, ArrowRight, Award, MapPin, Calendar, Search, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import SectionTitle from "@/components/ui/SectionTitle";
import { CATEGORIES, PROMOS, TOP_CARS } from "@/lib/mockData";
import Image from "next/image";
import { voituresAPI } from "@/lib/api";

function CategorySelector({ onSelect }: { onSelect: (id: number) => void }) {
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
            className="cursor-pointer p-6 md:p-8 rounded-[2rem] border-2 transition-all duration-500 relative overflow-hidden group bg-[#0a0a0a] border-white/5 hover:border-white/20"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6 bg-white/5 text-white/50 group-hover:text-white">
              <Zap size={28} />
            </div>
            <h3 className="text-xl md:text-2xl font-black italic uppercase mb-2 text-white leading-none">{cat.name}</h3>
            <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-white/40">{cat.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SearchSection({ isSticky: _isSticky }: { isSticky: boolean }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pickupSites, setPickupSites] = useState<{ id: number; nom: string }[]>([]);
  const [selectedPickupSiteId, setSelectedPickupSiteId] = useState<number | null>(null);
  const [selectedReturnSiteId, setSelectedReturnSiteId] = useState<number | null>(null);
  const router = useRouter();
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      setApiError("API URL not configured. Set NEXT_PUBLIC_API_URL in .env.local");
      return;
    }
    voituresAPI.obtenirSitesRetrait()
      .then((res) => {
        const items = res?.data?.data?.items || [];
        setPickupSites(items);
      })
      .catch((e) => {
        setApiError("API unreachable");
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to load pickup sites:", e?.response?.status, e?.config?.url);
        }
      });
  }, []);
  return (
    <motion.div layout className="relative w-full" initial={false}>
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-3xl border-[#ff003c]/30 shadow-[0_0_20px_rgba(255,0,60,0.4)] transition-all duration-500">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="flex flex-col p-3 border-r border-white/10 group">
            <label className="text-[8px] font-black text-[#ff003c] uppercase mb-1 text-left">Lieu de Retrait</label>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-white/40" />
              <select
                value={selectedPickupSiteId ?? ''}
                onChange={(e) => setSelectedPickupSiteId(e.target.value ? parseInt(e.target.value) : null)}
                className="bg-transparent border-none outline-none text-white text-xs font-bold w-full"
              >
                <option value="">Sélectionner un site</option>
                {pickupSites.map((site) => (
                  <option key={site.id} value={site.id}>{site.nom}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col p-3 border-r border-white/10">
            <label className="text-[8px] font-black text-[#ff003c] uppercase mb-1 text-left">Lieu de Retour</label>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-white/40" />
              <select
                value={selectedReturnSiteId ?? ''}
                onChange={(e) => setSelectedReturnSiteId(e.target.value ? parseInt(e.target.value) : null)}
                className="bg-transparent border-none outline-none text-white text-xs font-bold w-full"
              >
                <option value="">Sélectionner un site</option>
                {pickupSites.map((site) => (
                  <option key={site.id} value={site.id}>{site.nom}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col p-3 border-r border-white/10"><label className="text-[8px] font-black text-[#ff003c] uppercase mb-1 text-left">Départ</label><div className="flex items-center gap-2"><Calendar size={16} className="text-[#ff003c]" /><input value={startDate} onChange={(e)=>setStartDate(e.target.value)} type="date" className="bg-transparent border-none outline-none text-white text-xs font-bold w-full [color-scheme:dark]" /></div></div>
          <div className="flex flex-col p-3 border-r border-white/10"><label className="text-[8px] font-black text-[#ff003c] uppercase mb-1 text-left">Retour</label><div className="flex items-center gap-2"><Clock size={16} className="text-white/40" /><input value={endDate} onChange={(e)=>setEndDate(e.target.value)} type="date" className="bg-transparent border-none outline-none text-white text-xs font-bold w-full [color-scheme:dark]" /></div></div>
          <button
            onClick={async () => {
              setError(null);
              if (!selectedPickupSiteId || !selectedReturnSiteId || !startDate || !endDate) {
                setError("Veuillez remplir tous les champs requis");
                return;
              }
              if (new Date(endDate) <= new Date(startDate)) {
                setError("La date de fin doit être postérieure à la date de début");
                return;
              }
              const q = new URLSearchParams({
                start_date: startDate,
                end_date: endDate,
                pickup_site_id: String(selectedPickupSiteId),
                return_site_id: String(selectedReturnSiteId),
              }).toString();
              router.push(`/voitures?${q}`);
            }}
            className="bg-[#ff003c] hover:bg-white hover:text-black transition-all rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase italic py-4 md:py-0"
          >
            <Search size={20} />
          </button>
        </div>
      </div>
      {apiError && <div className="text-center text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2">{apiError}</div>}
      {error && <div className="text-center text-red-500 text-xs font-bold uppercase tracking-widest mt-2">{error}</div>}
    </motion.div>
  );
}

export default function HomeView() {
  const { scrollY } = useScroll();
  const [isStickySearch, setIsStickySearch] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsStickySearch(latest > 500);
    });
    return () => unsubscribe();
  }, [scrollY]);
  const scaleX = useSpring(useTransform(scrollY, [0, 5000], [0, 1]), { stiffness: 100, damping: 30 });
  return (
    <>
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#ff003c]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-black/0 blur-[120px] rounded-full animate-pulse" />
        <div className="max-w-7xl w-full z-10 text-center">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-[12vw] font-black italic uppercase leading-none tracking-tighter mb-4 text-transparent stroke-text opacity-20 font-choplin">TOMMOBILTY</motion.h1>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-5xl md:text-8xl font-black italic uppercase text-white mb-16 mt-[-6vw]">L'Élite du Car Rental <br /> <span className="text-[#ff003c]">Au Maroc.</span></motion.h2>
          <SearchSection isSticky={false} />
          <div className="mt-20 flex justify-center gap-10 md:gap-24 text-center">
            <div className="group cursor-default"><p className="text-4xl font-black text-white italic group-hover:text-[#ff003c] transition-colors duration-300">500+</p><p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Véhicules</p></div>
            <div className="group cursor-default"><p className="text-4xl font-black text-white italic group-hover:text-[#ff003c] transition-colors duration-300">24/7</p><p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Support VIP</p></div>
            <div className="group cursor-default"><p className="text-4xl font-black text-[#ff003c] italic">4.9</p><p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Satisfaction</p></div>
          </div>
        </div>
      </section>
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-[#ff003c] z-[120] origin-left shadow-[0_0_15px_#ff003c]" style={{ scaleX }} />
      <div className="max-w-7xl mx-auto px-6 space-y-48 pb-40 text-center md:text-left">
        <CategorySelector onSelect={(id) => router.push(`/voitures?category=${id}`)} />
        <section>
          <SectionTitle subtitle="Succès Catalogue" title="Les Plus Demandées" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {TOP_CARS.map((car) => (
              <div key={car.id} className="group relative overflow-hidden rounded-[3rem] bg-[#0a0a0a] border border-white/5 cursor-pointer" onClick={() => router.push("/voitures")}>
                <div className="relative w-full h-[450px]">
                  <Image
                    src={car.image}
                    alt={car.name}
                    fill
                    className="object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
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
              <motion.div key={promo.id} whileHover={{ y: -15, borderColor: "#ff003c" }} className="bg-black/60 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] relative overflow-hidden group cursor-pointer transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff003c]/10 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform duration-1000" />
                <h4 className="text-white/40 font-bold uppercase text-[10px] mb-3 tracking-widest text-left">{promo.car}</h4>
                <p className="text-2xl font-black uppercase italic mb-4 text-white text-left">{promo.title}</p>
                <p className="text-7xl font-black text-[#ff003c] italic tracking-tighter group-hover:text-white transition-colors text-left">{promo.discount}</p>
                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-white italic group-hover:translate-x-2 transition-all">Activer le code <ArrowRight size={14} /></div>
              </motion.div>
            ))}
          </div>
        </section>
        <section className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[4rem] p-16 md:p-32 border-[#ff003c]/20 relative overflow-hidden group text-center">
          <div className="absolute top-0 right-0 p-20 opacity-5 group-hover:rotate-12 transition-transform duration-1000"><Award size={400} /></div>
          <SectionTitle subtitle="Elite Club" title="Points Tommobilty" />
          <p className="text-white/60 font-bold text-xl mb-12 max-w-2xl mx-auto leading-relaxed italic text-center">Chaque kilomètre parcouru se transforme en points <span className="text-white">T-Points</span> pour débloquer l'élite automobile.</p>
          <button className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase italic hover:bg-[#ff003c] hover:text-white transition-all shadow-2xl">Rejoindre le Cercle</button>
        </section>
      </div>
      <AnimatePresence>
        {isStickySearch && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="fixed top-24 left-0 w-full z-[100] px-6">
            <div className="max-w-7xl mx-auto">
              <SearchSection isSticky />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
