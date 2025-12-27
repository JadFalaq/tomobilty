"use client";
import { useEffect, useState } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import { MapPin, Calendar, Clock, Zap, Check, X, Download, FileText } from "lucide-react";
import { reservationsAPI } from "@/lib/api";
import Image from "next/image";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (!token) {
      setLoading(false);
      return;
    }
    reservationsAPI.obtenirMesReservations()
      .then((res) => {
        const list = res.data?.data?.bookings || res.data?.data?.items || res.data?.bookings || res.data?.items || [];
        setBookings(Array.isArray(list) ? list : []);
      })
      .catch(() => setError("Erreur lors du chargement de vos réservations"))
      .finally(() => setLoading(false));
  }, []);
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "EN_ATTENTE": return { label: "EN ATTENTE", style: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5", icon: <Clock size={12}/> };
      case "EN_COURS": return { label: "MISSION ACTIVE", style: "text-[#ff003c] border-[#ff003c]/30 bg-[#ff003c]/5 shadow-lg", icon: <Zap size={12} className="animate-pulse"/> };
      case "TERMINE": return { label: "TERMINEE", style: "text-green-400 border-green-400/30 bg-green-400/5", icon: <Check size={12}/> };
      case "ANNULE": return { label: "ANNULE", style: "text-white/20 border-white/10 bg-white/5", icon: <X size={12}/> };
      default: return { label: status, style: "text-white/40", icon: null };
    }
  };
  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const downloadInvoice = async (invoiceId: number) => {
    try {
      const res = await reservationsAPI.telechargerFacture(String(invoiceId));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture_${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {}
  };
  return (
    <div className="pt-40 pb-40 px-6 max-w-7xl mx-auto min-h-[90vh]">
      <SectionTitle subtitle="Protocol_Archives" title="MES RÉSERVATIONS" />
      {!isLoggedIn && (
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[3.5rem] p-10 text-center">
          <p className="text-white/60 font-bold text-sm uppercase tracking-widest mb-6">Veuillez vous connecter pour voir vos réservations</p>
          <button
            onClick={() => window.dispatchEvent(new Event("open-auth"))}
            className="px-8 py-4 bg-[#ff003c] text-white font-black uppercase italic rounded-2xl"
          >
            Connexion | Inscription
          </button>
        </div>
      )}
      {loading && <div className="text-center text-white/60 text-sm font-bold uppercase tracking-widest">Chargement...</div>}
      {error && <div className="text-center text-red-500 text-sm font-bold uppercase tracking-widest">Une erreur est survenue</div>}
      <div className="grid gap-10">
        {bookings.map((book) => {
          const status = getStatusDisplay(book.status_name);
          const car = book.varianteCar?.car || book.car;
          return (
            <div key={book.id} className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[3.5rem] flex flex-col md:flex-row overflow-hidden group transition-all duration-500">
              <div className="w-full md:w-64 h-64 md:h-auto overflow-hidden border-r border-white/5 relative">
                <div className="absolute inset-0">
                  <Image
                    src={car?.images?.[0]?.image_url || car?.images?.[0] || car?.image || "/cars/default.jpg"}
                    alt="Car"
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                </div>
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
                    <h4 className="text-3xl font-black italic uppercase text-white mb-4 tracking-tighter text-left">{car.brand?.name || car.brand_name} {car.modele || car.model}</h4>
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
                  {book.invoices?.length > 0 ? (
                    <button onClick={() => downloadInvoice(book.invoices[0].id)} className="flex-1 py-4 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-[#ff003c] hover:text-white transition-all text-[11px] flex items-center justify-center gap-2 shadow-lg"><Download size={16}/> Télécharger Facture</button>
                  ) : (
                    <div className="flex-1 py-4 bg-white/5 border border-white/10 text-white/20 font-black uppercase italic rounded-2xl text-[10px] flex items-center justify-center gap-2 cursor-not-allowed"><FileText size={16}/> En attente de paiement</div>
                  )}
                  <button className="px-10 py-4 border border-white/10 hover:border-[#ff003c] rounded-2xl text-[11px] font-black uppercase italic transition-all text-white">Support</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
