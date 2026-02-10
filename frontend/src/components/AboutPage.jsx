import React from 'react';
import { motion } from 'framer-motion';
import { FaCar as Car, FaStar as Star, FaShieldAlt as Shield, FaUsers as Users } from 'react-icons/fa';

const GLASS = "bg-black/60 backdrop-blur-xl border border-white/10";

function SectionTitle({ subtitle, title }) {
  return (
    <div className="mb-12 text-center md:text-left">
      <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
        <div className="w-8 h-[2px] bg-[#ff003c]" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff003c]">{subtitle}</span>
      </div>
      <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white leading-none tracking-tight">{title}</h2>
    </div>
  );
}

export default function AboutPage({ setView }) {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-24"
      >
        {/* Hero Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <SectionTitle subtitle="Notre Histoire" title="L'Excellence Automobile" />
            <div className="space-y-6 text-white/60 font-medium leading-relaxed">
              <p>
                <strong className="text-white">Tommobilty</strong> est né d'une passion inébranlable pour l'automobile d'exception. 
                Nous ne sommes pas simplement une agence de location de voitures, nous sommes les gardiens d'une expérience de conduite inégalée au Maroc.
              </p>
              <p>
                Basés à <span className="text-white">Casablanca et Rabat</span>, nous avons redéfini les standards du luxe et de la performance. 
                Notre mission est simple : offrir à nos clients l'accès aux véhicules les plus prestigieux du monde, avec un service digne des plus grands palaces.
              </p>
              <p>
                Que ce soit pour un voyage d'affaires, une escapade romantique ou simplement le plaisir pur de conduire, 
                Tommobilty transforme chaque trajet en un souvenir inoubliable.
              </p>
            </div>
          </div>
          <div className={`${GLASS} p-2 rounded-3xl rotate-2 hover:rotate-0 transition-all duration-500`}>
             <div className="aspect-video bg-[#1a1a1a] rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                   <h3 className="text-6xl font-black italic uppercase text-white/5 tracking-tighter">Tommobilty</h3>
                </div>
                {/* Placeholder for an image if available, otherwise stylistic background */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#ff003c]/20 to-transparent mix-blend-overlay"></div>
             </div>
          </div>
        </section>

        {/* Values Section */}
        <section>
          <div className="text-center mb-16">
            <h3 className="text-3xl font-black italic uppercase text-white mb-4">Pourquoi Nous Choisir ?</h3>
            <p className="text-white/40 max-w-2xl mx-auto">Nous repoussons les limites pour vous offrir bien plus qu'une simple location.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Car, title: "Flotte Premium", desc: "Une sélection rigoureuse des derniers modèles de luxe et de sport." },
              { icon: Star, title: "Service VIP", desc: "Assistance 24/7, livraison personnalisée et conciergerie dédiée." },
              { icon: Shield, title: "Sécurité Totale", desc: "Véhicules entretenus méticuleusement et assurances tous risques incluses." },
              { icon: Users, title: "Expertise Locale", desc: "Une connaissance parfaite du Maroc pour vous guider sur les meilleures routes." }
            ].map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${GLASS} p-8 rounded-3xl border-white/5 hover:border-[#ff003c]/50 transition-colors group`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#ff003c]/10 flex items-center justify-center mb-6 group-hover:bg-[#ff003c] transition-colors">
                  <item.icon size={20} className="text-[#ff003c] group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-xl font-black italic uppercase text-white mb-3">{item.title}</h4>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className={`${GLASS} p-12 rounded-[3rem] text-center border-[#ff003c]/20 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#ff003c]/5 to-transparent pointer-events-none" />
          <h3 className="text-4xl md:text-5xl font-black italic uppercase text-white mb-6 relative z-10">
            Prêt à prendre la route ?
          </h3>
          <p className="text-white/60 mb-8 max-w-xl mx-auto relative z-10">
            Découvrez notre collection exclusive et réservez votre véhicule de rêve dès aujourd'hui.
          </p>
          <button 
            onClick={() => setView('cars')}
            className="bg-[#ff003c] hover:bg-white hover:text-black text-white px-10 py-4 rounded-2xl font-black uppercase italic tracking-wider transition-all relative z-10"
          >
            Voir nos véhicules
          </button>
        </section>
      </motion.div>
    </div>
  );
}
