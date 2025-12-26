"use client";
import HomeView from "@/components/home/HomeView";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#ff003c] overflow-x-hidden font-sans">
      <HomeView />
      <footer className="bg-black border-t border-white/10 py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-20">
          <div className="max-w-sm text-center md:text-left mx-auto md:mx-0">
            <h5 className="text-5xl font-black italic uppercase tracking-tighter mb-8 text-[#ff003c]">TOMOBILTY</h5>
            <p className="text-[11px] font-black uppercase text-white/20 tracking-[0.4em] leading-loose text-left">Propelled by Speed & Excellence. Le standard absolu de l'élite automobile au Maroc.</p>
          </div>
          <div className="flex gap-24 text-left text-xs font-bold uppercase text-white/30 tracking-widest mx-auto md:mx-0">
            <div className="space-y-4">
              <p className="text-[#ff003c] font-black italic mb-6">Navigation</p>
              <p className="text-left">Casablanca / Rabat</p>
              <p className="text-white text-left">+212 522 00 00 00</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
