"use client";
import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import SectionTitle from "@/components/ui/SectionTitle";
import { CATEGORIES } from "@/lib/mockData";
import { voituresAPI } from "@/lib/api";

function CategorySelector({ selectedCat, onSelect }: { selectedCat: number | null; onSelect: (id: number) => void }) {
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
              <span className="font-black">#{cat.id}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black italic uppercase mb-2 text-white leading-none">{cat.name}</h3>
            <p className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest ${selectedCat === cat.id ? 'text-white/80' : 'text-white/40'}`}>{cat.description}</p>
            {selectedCat === cat.id && (
              <motion.div layoutId="active-cat-marker" className="absolute top-4 right-4 text-white"><span>✓</span></motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function CarsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCat = searchParams.get("category") ? parseInt(searchParams.get("category") as string, 10) : null;
  const [selectedCat, setSelectedCat] = useState<number | null>(initialCat);
  const [filters, setFilters] = useState({ transmission: "Tous", minPrice: 0, maxPrice: 5000, seats: "Tous", fuel: "Tous" });
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingCar, setBookingCar] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<"checking" | "available" | "unavailable" | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [pickupSiteId, setPickupSiteId] = useState<string>("");
  const [returnSiteId, setReturnSiteId] = useState<string>("");
  const carSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const qsStart = searchParams.get('start_date') || searchParams.get('startDate') || '';
    const qsEnd = searchParams.get('end_date') || searchParams.get('endDate') || '';
    const qsPickup = searchParams.get('pickup_site_id') || '';
    const qsReturn = searchParams.get('return_site_id') || '';
    setStartDate(qsStart);
    setEndDate(qsEnd);
    setPickupSiteId(qsPickup);
    setReturnSiteId(qsReturn);
    const hadDates = !!qsStart && !!qsEnd;
    if (hadDates) {
      setLoading(true);
      setError(null);
      voituresAPI.obtenirVoituresDisponibles({ start_date: qsStart, end_date: qsEnd })
        .then((res) => {
          const list = res.data?.data?.cars || res.data?.cars || res.data?.data?.items || [];
          setCars(Array.isArray(list) ? list : []);
        })
        .catch(() => setError("Erreur lors du chargement des voitures disponibles"))
        .finally(() => setLoading(false));
    }
    if (carSectionRef.current && selectedCat) {
      setTimeout(() => carSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, []);

  useEffect(() => {
    const params: any = {};
    if (selectedCat) params.category_id = selectedCat;
    if (filters.transmission !== "Tous") params.transmission = filters.transmission;
    if (filters.minPrice) params.prix_min = filters.minPrice;
    if (filters.maxPrice) params.prix_max = filters.maxPrice;
    if (filters.seats !== "Tous") params.seats = filters.seats;
    if (filters.fuel !== "Tous") params.fuel = filters.fuel;
    setLoading(true);
    setError(null);
    const hasDateQuery = !!startDate && !!endDate;
    const loader = hasDateQuery 
      ? voituresAPI.obtenirVoituresDisponibles({ start_date: startDate, end_date: endDate })
      : voituresAPI.obtenirVoitures(params);
    loader
    .then((res) => {
      const list = res.data?.data?.cars || res.data?.cars || res.data?.data?.items || res.data?.items || res.data;
      setCars(Array.isArray(list) ? list : []);
    })
    .catch(() => setError("Erreur lors du chargement des voitures"))
    .finally(() => setLoading(false));
  }, [selectedCat, filters]);

  const handleCheckAvailability = async () => {
    setCheckResult("checking");
    try {
      const res = await voituresAPI.verifierDisponibilite(String(bookingCar?.id), { start: startDate, end: endDate });
      const ok = res.data?.data?.available ?? res.data?.available ?? false;
      setCheckResult(ok ? "available" : "unavailable");
    } catch {
      setCheckResult("unavailable");
    }
  };

  const confirmReservation = async () => {
    if (!bookingCar?.id || !startDate || !endDate || !pickupSiteId || !returnSiteId) {
      setCheckResult('unavailable');
      return;
    }
    try {
      const res = await (await import('@/lib/api')).reservationsAPI.creerReservation({
        car_id: bookingCar.id,
        date_debut: startDate,
        date_fin: endDate,
        pickup_site_id: parseInt(pickupSiteId, 10),
        return_site_id: parseInt(returnSiteId, 10),
        mode_paiement: 'EN_LIGNE'
      });
      const bookingId =
        res?.data?.data?.booking?.id ||
        res?.data?.data?.id ||
        res?.data?.booking?.id ||
        res?.data?.id;
      if (bookingId) {
        router.push(`/mes-reservations?created=${bookingId}`);
      } else {
        setCheckResult('unavailable');
      }
    } catch {
      setCheckResult('unavailable');
    }
  };

  return (
    <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto">
      <CategorySelector selectedCat={selectedCat} onSelect={(id) => setSelectedCat(id)} />
      <AnimatePresence>
        {selectedCat && (
          <motion.section key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} ref={carSectionRef} className="scroll-mt-32">
            <div className="mb-12 border-b border-white/10 pb-10">
              <SectionTitle subtitle={CATEGORIES.find(c => c.id === selectedCat)?.name || ""} title="RÉSULTATS DE RECHERCHE" />
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 mt-8 p-6 rounded-[2rem] grid grid-cols-2 md:grid-cols-5 gap-6 items-center border-white/5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#ff003c] uppercase tracking-widest block">Prix Min/Max</label>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: parseInt(e.target.value || "0", 10) })} className="bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold w-full outline-none focus:border-[#ff003c]" />
                    <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value || "5000", 10) })} className="bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold w-full outline-none focus:border-[#ff003c]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#ff003c] uppercase tracking-widest block">Transmission</label>
                  <select value={filters.transmission} onChange={(e) => setFilters({ ...filters, transmission: e.target.value })} className="bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold w-full outline-none cursor-pointer">
                    <option value="Tous">Tous</option>
                    <option value="Automatique">Automatique</option>
                    <option value="Manuelle">Manuelle</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#ff003c] uppercase tracking-widest block">Places</label>
                  <select value={filters.seats} onChange={(e) => setFilters({ ...filters, seats: e.target.value })} className="bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold w-full outline-none cursor-pointer">
                    <option value="Tous">Tous</option>
                    <option value="2">2 Places</option>
                    <option value="4">4 Places</option>
                    <option value="5">5 Places</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#ff003c] uppercase tracking-widest block">Carburant</label>
                  <select value={filters.fuel} onChange={(e) => setFilters({ ...filters, fuel: e.target.value })} className="bg-white/5 border border-white/10 p-2 rounded-lg text-xs font-bold w-full outline-none cursor-pointer">
                    <option value="Tous">Tous</option>
                    <option value="Essence">Essence</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Électrique">Électrique</option>
                  </select>
                </div>
                <div className="flex items-end h-full">
                  <button onClick={() => setFilters({ minPrice: 0, maxPrice: 5000, transmission: "Tous", seats: "Tous", fuel: "Tous" })} className="text-[9px] font-black text-white/40 hover:text-[#ff003c] uppercase tracking-[0.2em]">Reset</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {loading && (
                <div className="col-span-full text-center text-white/60 text-sm font-bold uppercase tracking-widest">Chargement...</div>
              )}
              {error && (
                <div className="col-span-full text-center text-red-500 text-sm font-bold uppercase tracking-widest">Une erreur est survenue</div>
              )}
              {!loading && !error && cars.map((car) => (
                <div key={car.id} className="group bg-[#0a0a0a] rounded-[3rem] border border-white/5 overflow-hidden transition-all hover:border-[#ff003c]/30">
                  <div className="h-72 overflow-hidden relative">
                    <div className="absolute inset-0">
                      <Image
                        src={
                          car.images?.[0]?.image_url ||
                          car.images?.[0] ||
                          car.image ||
                          "/cars/default.jpg"
                        }
                        alt={car.modele || ""}
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10"><span className="text-[9px] font-black text-white uppercase italic tracking-tighter">{car.prix_par_jour} MAD / J</span></div>
                  </div>
                  <div className="p-10 text-center md:text-left">
                    <h4 className="text-[10px] font-black text-[#ff003c] uppercase tracking-widest mb-1">{car.brand?.name || car.brand_name}</h4>
                    <h3 className="text-3xl font-black italic uppercase text-white mb-6">{car.modele || car.model}</h3>
                    <button onClick={() => setBookingCar(car)} className="w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-[#ff003c] hover:text-white transition-all shadow-xl">VÉRIFIER DISPONIBILITÉ</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      {!loading && !error && !!startDate && !!endDate && cars.length === 0 && (
        <div className="mt-10 text-center text-white/60 text-sm font-bold uppercase tracking-widest">
          Aucune voiture disponible pour ces dates.
        </div>
      )}
      <section className="mt-40 pt-20 border-t border-white/10 text-center md:text-left">
        <SectionTitle subtitle="Succès Flotte" title="LES PLUS DEMANDÉES" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {cars.slice(0, 3).map((car) => (
            <motion.div key={car.id} whileHover={{ y: -10 }} className="group relative rounded-[2.5rem] overflow-hidden border border-white/5 cursor-pointer bg-[#0a0a0a]" onClick={() => { setSelectedCat(car.categoryId); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  <div className="h-64 overflow-hidden relative">
                    <Image
                      src={
                        car.images?.[0]?.image_url ||
                        car.images?.[0] ||
                        car.image ||
                        "/cars/default.jpg"
                      }
                      alt="Hot"
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                />
              </div>
              <div className="p-8"><h4 className="text-xl font-black italic uppercase text-white text-left">{car.brand?.name || car.brand_name} {car.modele || car.model}</h4></div>
            </motion.div>
          ))}
        </div>
      </section>
      <AnimatePresence>
        {bookingCar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-black/95 backdrop-blur-3xl">
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="max-w-4xl w-full bg-[#111] border border-white/10 rounded-[3.5rem] p-10 md:p-16 relative overflow-hidden shadow-2xl text-left">
              <button onClick={() => { setBookingCar(null); setCheckResult(null); }} className="absolute top-10 right-10 text-white hover:text-[#ff003c] transition-colors"><X size={32} /></button>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white mb-10 tracking-tighter">{bookingCar?.brand?.name || bookingCar?.brand_name} <span className="text-transparent stroke-text">{bookingCar?.modele || bookingCar?.model}</span></h2>
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div className="space-y-3"><label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 italic">Début</label><input value={startDate} onChange={(e)=>setStartDate(e.target.value)} type="date" className="bg-white/5 w-full p-6 rounded-3xl border border-white/10 text-white outline-none focus:border-[#ff003c] [color-scheme:dark] font-bold" /></div>
                  <div className="space-y-3"><label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 italic">Fin</label><input value={endDate} onChange={(e)=>setEndDate(e.target.value)} type="date" className="bg-white/5 w-full p-6 rounded-3xl border border-white/10 text-white outline-none focus:border-[#ff003c] [color-scheme:dark] font-bold" /></div>
                </div>
                <div className="flex flex-col gap-4">
                  <button onClick={handleCheckAvailability} className="w-full py-6 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-[#ff003c] hover:text-white transition-all shadow-xl">{checkResult === "checking" ? "Vérification..." : "VÉRIFIER LA DISPONIBILITÉ"}</button>
                  {checkResult === "available" && (<motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={confirmReservation} className="w-full py-6 bg-[#ff003c] text-white font-black uppercase italic rounded-2xl shadow-lg">CONFIRMER LA RÉSERVATION</motion.button>)}
                  {checkResult === "unavailable" && (<div className="p-6 bg-red-600/10 border border-red-600/30 rounded-3xl text-center text-red-500 font-black uppercase italic tracking-widest">VÉHICULE NON DISPONIBLE</div>)}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
