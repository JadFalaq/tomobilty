"use client";
import Link from "next/link";
import { Zap, User } from "lucide-react";

type Props = { onOpenAuth: () => void };

export default function Navbar({ onOpenAuth }: Props) {
  return (
    <nav className="fixed top-0 left-0 w-full z-[100] px-6 py-4">
      <div className="max-w-7xl mx-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-4 flex justify-between items-center border-[#ff003c]/20 shadow-2xl">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <div className="bg-[#ff003c] p-1.5 rounded-lg rotate-12 shadow-[0_0_10px_#ff003c]">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="text-2xl font-black italic tracking-tighter text-white">TOMOBILTY</span>
        </Link>
        <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
          <Link href="/" className="hover:text-[#ff003c] transition-colors">Accueil</Link>
          <Link href="/voitures" className="hover:text-[#ff003c] transition-colors">Nos Voitures</Link>
          <Link href="/mes-reservations" className="hover:text-[#ff003c] transition-colors">Réservations</Link>
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

