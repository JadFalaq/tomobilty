import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  ShieldCheck, 
  Zap, 
  Award, 
  TrendingUp, 
  History, 
  Mail, 
  Phone, 
  IdCard, 
  Briefcase,
  ChevronRight,
  Info,
  Star
} from 'lucide-react';

// --- DESIGN TOKENS ---
const GLASS = "bg-black/60 backdrop-blur-xl border border-white/10";
const RED_GLOW = "shadow-[0_0_20px_rgba(255,0,60,0.2)]";

/**
 * // BACKEND SYNC : Données Utilisateur & Fidélité
 * Ces données doivent provenir de l'appel : GET /api/users/profile
 * Prisma : user.findUnique({ include: { loyaltyAccount: { include: { tier: true, transactions: true } } } })
 */
const MOCK_USER_DATA = {
  prenom: "Karim",
  nom: "Bennani",
  email: "k.bennani@elite.ma",
  telephone: "+212 6 61 00 00 00",
  cin_number: "BE123456",
  license_number: "01/12345/6789",
  date_creation: "2024-01-10T10:00:00Z",
  loyaltyAccount: {
    points_balance: 1250,
    lifetime_points: 4250,
    tier: {
      name: "GOLD ELITE",
      discount_percent: 15.00,
      points_multiplier: 1.5,
      min_points: 3000,
      max_points: 10000,
      benefits: "Accès prioritaire, Surclassement gratuit, Nettoyage VIP offert"
    },
    recent_transactions: [
      { id: 1, points: 450, type: "EARNED", description: "Location Porsche Taycan S", date: "2024-12-28" },
      { id: 2, points: -200, type: "REDEEMED", description: "Remise fidélité appliquée", date: "2024-12-15" },
      { id: 3, points: 100, type: "BONUS", description: "Bonus parrainage", date: "2024-11-20" }
    ]
  }
};

export default function UserProfile() {
  const user = MOCK_USER_DATA;
  const account = user.loyaltyAccount;
  const tier = account.tier;

  // Calcul du progrès vers le prochain grade (si applicable)
  const progress = useMemo(() => {
    if (!tier.max_points) return 100;
    const currentInTier = account.lifetime_points - tier.min_points;
    const totalRequiredInTier = tier.max_points - tier.min_points;
    return Math.min(100, Math.max(0, (currentInTier / totalRequiredInTier) * 100));
  }, [account, tier]);

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-40 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* EN-TÊTE PROFIL */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#ff003c] to-black p-[2px] shadow-2xl">
              <div className="w-full h-full bg-black rounded-[1.9rem] flex items-center justify-center overflow-hidden">
                <User size={48} className="text-white/20" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
                {user.prenom} <span className="text-transparent stroke-text">{user.nom}</span>
              </h1>
              <p className="text-[10px] font-black uppercase text-[#ff003c] tracking-[0.4em] mt-3 italic">
                Status Pilote : Certifié
              </p>
            </div>
          </div>
          <button className="px-8 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-[#ff003c] hover:text-[#ff003c] transition-all">
            Modifier le profil
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLONNE GAUCHE : INFOS PERSONNELLES */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`${GLASS} p-10 rounded-[3rem] ${RED_GLOW}`}>
              <h3 className="text-xl font-black italic uppercase mb-8 flex items-center gap-3">
                <IdCard className="text-[#ff003c]" /> Credentials
              </h3>
              <div className="space-y-6">
                <InfoItem icon={<Mail size={16} />} label="Contact" value={user.email} />
                <InfoItem icon={<Phone size={16} />} label="Mobile" value={user.telephone} />
                <InfoItem icon={<ShieldCheck size={16} />} label="Identité (CIN)" value={user.cin_number} />
                <InfoItem icon={<Briefcase size={16} />} label="Permis" value={user.license_number} />
              </div>
            </div>

            {/* CONCEPT FIDÉLITÉ EXPLIQUE */}
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
                    <p className="text-lg font-black">x{tier.points_multiplier}</p>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl text-left">
                    <p className="text-[8px] font-black text-[#ff003c] uppercase mb-1">Remise Fixe</p>
                    <p className="text-lg font-black">-{tier.discount_percent}%</p>
                 </div>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : FIDÉLITÉ & POINTS */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* SCORE CARD */}
            <div className={`${GLASS} p-12 rounded-[4rem] relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <Award size={200} />
              </div>
              
              <div className="flex flex-col md:flex-row justify-between gap-12 relative z-10">
                <div className="text-left">
                  <p className="text-[10px] font-black text-[#ff003c] uppercase tracking-[0.4em] mb-4 italic">Solde de Points Actuel</p>
                  <div className="flex items-end gap-3">
                    <span className="text-8xl font-black italic tracking-tighter leading-none">{account.points_balance}</span>
                    <span className="text-2xl font-black text-white/20 mb-2 uppercase italic">Points</span>
                  </div>
                </div>
                
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4 italic">Grade Actuel</p>
                  <div className="bg-white text-black px-6 py-3 rounded-full inline-flex items-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
                    <Star size={16} fill="black" />
                    <span className="text-sm font-black italic uppercase tracking-tighter">{tier.name}</span>
                  </div>
                  <p className="text-[10px] font-bold text-white/40 mt-4 max-w-xs md:ml-auto">
                    Privilèges : {tier.benefits}
                  </p>
                </div>
              </div>

              {/* PROGRESS BAR */}
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
                  {tier.max_points - account.lifetime_points} points restants pour upgrader votre flotte
                </p>
              </div>
            </div>

            {/* TRANSACTIONS RÉCENTES */}
            <div className={`${GLASS} p-10 rounded-[3rem] text-left`}>
              <h3 className="text-xl font-black italic uppercase mb-8 flex items-center gap-3">
                <History className="text-[#ff003c]" /> Archives T-Points
              </h3>
              <div className="space-y-4">
                {account.recent_transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${tx.type === 'REDEEMED' ? 'bg-white/5 text-white' : 'bg-[#ff003c]/10 text-[#ff003c]'}`}>
                        {tx.type === 'EARNED' ? <TrendingUp size={16} /> : tx.type === 'REDEEMED' ? <Zap size={16} /> : <Award size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tighter">{tx.description}</p>
                        <p className="text-[9px] font-medium text-white/20 uppercase">{tx.date}</p>
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
      
      <style>{`
        .stroke-text { -webkit-text-stroke: 1px rgba(255, 255, 255, 0.2); }
      `}</style>
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
        <p className="text-sm font-bold text-white tracking-tight truncate max-w-[200px]">{value || "Non renseigné"}</p>
      </div>
    </div>
  );
}