"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap, Check, ShieldCheck, X, Mail } from "lucide-react";

type Props = { isOpen: boolean; onClose: () => void };

export default function AuthPortal({ isOpen, onClose }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
                {mode === "login" ? (
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
                      <li className="flex items-center gap-4 group"><ShieldCheck size={18} className="text-[#ff003c]"/><span className="text-sm font-bold text-white/60 uppercase tracking-widest italic leading-tight text-left">Vérification d’identité rapide</span></li>
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
                  {mode === "login" ? "INITIALISER CONNEXION" : "VALIDER INSCRIPTION"}
                </button>
                <div className="relative py-4 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <span className="relative bg-[#050505] px-4 text-[8px] font-black uppercase text-white/20 tracking-[0.4em]">OU AVEC</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"><span className="text-[10px] font-black uppercase">Google</span></button>
                  <button type="button" className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"><span className="text-[10px] font-black uppercase">Apple</span></button>
                </div>
              </form>
              <div className="mt-12 pt-8 border-t border-white/5 text-center">
                {mode === "login" ? (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Nouveau sur Tomobilty ?</p>
                    <button onClick={() => setMode("register")} className="w-full py-4 border border-white/10 hover:border-[#ff003c] hover:text-[#ff003c] text-white/60 font-black uppercase italic rounded-[2rem] transition-all text-[10px] tracking-[0.2em]">CRÉER UN COMPTE</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Vous avez déjà un compte ?</p>
                    <button onClick={() => setMode("login")} className="w-full py-4 border border-white/10 hover:border-[#ff003c] hover:text-[#ff003c] text-white/60 font-black uppercase italic rounded-[2rem] transition-all text-[10px] tracking-[0.2em]">SE CONNECTER</button>
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

