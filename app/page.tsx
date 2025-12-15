'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnimatedIntro from '@/components/AnimatedIntro';
import { Car, Shield, Clock, MapPin, Search, Star, ArrowRight, CheckCircle, Mail, ChevronRight, Quote } from 'lucide-react';

export default function Home() {
  // Vérifier immédiatement si l'intro a été vue (côté client uniquement)
  const [showIntro, setShowIntro] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Vérifier si l'intro a déjà été vue dans cette session
    const hasWatchedIntro = sessionStorage.getItem('introWatched');
    
    if (hasWatchedIntro) {
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem('introWatched', 'true');
    } catch (e) {
      console.error('Erreur sessionStorage:', e);
    }
    setShowIntro(false);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Merci de votre inscription avec ${email} !`);
    setEmail('');
  };

  const FEATURED_CARS = [
    { 
      name: "Mercedes Classe S", 
      category: "Luxe",
      image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80", 
      price: "1500 DH",
      features: ["Automatique", "Diesel", "5 Places"]
    },
    { 
      name: "Range Rover Sport", 
      category: "SUV Premium",
      image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=800&q=80", 
      price: "2000 DH",
      features: ["Automatique", "Hybride", "5 Places"]
    },
    { 
      name: "Porsche Panamera", 
      category: "Sport",
      image: "https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&w=800&q=80", 
      price: "2500 DH",
      features: ["Automatique", "Essence", "4 Places"]
    },
  ];

  const TESTIMONIALS = [
    {
      name: "Karim Benjelloun",
      role: "Client Business",
      content: "Un service irréprochable. La Mercedes Classe S était dans un état neuf. La livraison à l'aéroport a été ponctuelle. Je recommande vivement Tomobilty pour vos déplacements professionnels.",
      stars: 5
    },
    {
      name: "Sophie Martin",
      role: "Touriste",
      content: "Nous avons loué un Range Rover pour notre voyage dans l'Atlas. Une expérience fantastique, voiture puissante et confortable. Le service client est très réactif.",
      stars: 5
    },
    {
      name: "Youssef Alami",
      role: "Client Fidèle",
      content: "C'est ma 3ème location chez eux. Jamais déçu. Les prix sont transparents et la qualité des véhicules est toujours au rendez-vous.",
      stars: 4
    }
  ];

  if (showIntro) {
    return <AnimatedIntro onComplete={handleIntroComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-primary-900 bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-primary-950">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1920&q=80" 
            alt="Luxury Car Background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary-950/80 via-primary-900/60 to-primary-950"></div>
          <div className="absolute inset-0 bg-grain-pattern opacity-20"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6 px-4 py-1 rounded-full border border-gold-500/30 bg-gold-500/10 backdrop-blur-sm animate-fade-in">
            <span className="text-gold-300 text-sm tracking-widest uppercase font-serif">L'Excellence au Maroc</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 text-white leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Conduisez Vos <span className="text-gold-400">Rêves</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-primary-100/90 mb-10 max-w-2xl mx-auto font-light animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Découvrez une flotte exclusive de véhicules premium pour une expérience de conduite inoubliable.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link 
              href="/voitures" 
              className="bg-gold-500 hover:bg-gold-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-gold-500/30 flex items-center"
            >
              <Search className="mr-2 h-5 w-5" />
              Trouver une voiture
            </Link>
            <Link 
              href="/contact" 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 backdrop-blur-sm flex items-center"
            >
              Nous contacter
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-white/50">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-scroll-down"></div>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-24 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-900 mb-4">Nos Véhicules Vedettes</h2>
            <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full mb-6"></div>
            <p className="text-primary-600 max-w-2xl mx-auto">
              Sélectionnés pour leur prestige, leur confort et leur performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURED_CARS.map((car, index) => (
              <div key={index} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-primary-100">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={car.image} 
                    alt={car.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute top-4 right-4 bg-primary-900/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                    {car.category}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-primary-900 mb-2 font-serif">{car.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-primary-500 mb-6">
                    {car.features.map((feature, i) => (
                      <span key={i} className="flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1 text-gold-500" />
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-primary-50">
                    <div>
                      <span className="text-2xl font-bold text-gold-600">{car.price}</span>
                      <span className="text-primary-400 text-sm"> / jour</span>
                    </div>
                    <Link 
                      href="/voitures" 
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-50 text-primary-900 hover:bg-gold-500 hover:text-white transition-colors duration-300"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/voitures" 
              className="inline-flex items-center text-primary-900 font-bold hover:text-gold-600 transition-colors border-b-2 border-gold-500 pb-1"
            >
              Voir toute la flotte <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-gold-100/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-primary-100/50 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-900 mb-4">Pourquoi Nous Choisir ?</h2>
            <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { icon: Clock, title: "Support 24/7", desc: "Une équipe dédiée à votre écoute à tout moment." },
              { icon: Shield, title: "Assurance Incluse", desc: "Voyagez l'esprit tranquille avec notre couverture complète." },
              { icon: Car, title: "Véhicules Premium", desc: "Une flotte récente et méticuleusement entretenue." },
              { icon: Star, title: "Meilleurs Prix", desc: "Le luxe accessible avec nos tarifs compétitifs." }
            ].map((item, index) => (
              <div key={index} className="text-center group p-6 rounded-2xl hover:bg-primary-50 transition-colors duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-800 rounded-2xl mb-6 group-hover:bg-gold-500 group-hover:text-white transition-all duration-300 transform group-hover:-translate-y-2 shadow-sm group-hover:shadow-lg">
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-primary-900 mb-3">{item.title}</h3>
                <p className="text-primary-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-primary-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grain-pattern opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Comment Ça Marche ?</h2>
            <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full mb-6"></div>
            <p className="text-primary-200">Louer votre voiture de rêve n'a jamais été aussi simple.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop only) */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-primary-700 z-0"></div>

            {[
              { step: "01", title: "Sélectionnez", desc: "Choisissez le véhicule parfait parmi notre large gamme." },
              { step: "02", title: "Réservez", desc: "Remplissez le formulaire en ligne en quelques clics." },
              { step: "03", title: "Conduisez", desc: "Récupérez votre voiture et profitez de la route." }
            ].map((item, index) => (
              <div key={index} className="relative z-10 text-center group">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-800 border-4 border-primary-700 rounded-full text-3xl font-serif font-bold text-gold-400 mb-8 group-hover:border-gold-500 group-hover:scale-110 transition-all duration-300 shadow-xl">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold mb-4 font-serif">{item.title}</h3>
                <p className="text-primary-200 px-6 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loyalty Program Section */}
      <section className="py-24 bg-gold-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grain-pattern opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-8 backdrop-blur-sm animate-pulse">
            <Star className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">Programme de Fidélité Tomobilty</h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Rejoignez notre programme exclusif et gagnez des points à chaque voyage. 
            Échangez vos points contre des remises exceptionnelles sur vos prochaines locations.
            Plus vous roulez, plus vous gagnez !
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/mes-reservations" 
              className="bg-white text-gold-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center"
            >
              Voir mes points
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/voitures" 
              className="bg-gold-700/50 hover:bg-gold-700 text-white border border-white/30 px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 backdrop-blur-sm flex items-center"
            >
              Commencer à cumuler
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto">
            {[
              { title: "Gagnez des Points", desc: "1 Point pour chaque 100 DH dépensés sur nos locations." },
              { title: "Échangez Facilement", desc: "Utilisez vos points directement lors de votre prochaine réservation." },
              { title: "Avantages VIP", desc: "Accès prioritaire et surclassements pour nos membres fidèles." }
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
                <h3 className="font-bold text-xl mb-2 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-white/80" /> {item.title}
                </h3>
                <p className="text-white/80 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-900 mb-4">Ce Que Disent Nos Clients</h2>
            <div className="w-24 h-1 bg-gold-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-primary-100 relative">
                <Quote className="absolute top-6 right-6 h-8 w-8 text-gold-200" />
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-900">{testimonial.name}</h4>
                    <span className="text-sm text-primary-500">{testimonial.role}</span>
                  </div>
                </div>
                <div className="flex mb-4 text-gold-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < testimonial.stars ? 'fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-primary-600 italic leading-relaxed">
                  "{testimonial.content}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-white border-t border-primary-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-100 text-gold-600 rounded-full mb-6">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-primary-900 mb-4">Restez Informé</h2>
          <p className="text-primary-600 mb-8">
            Inscrivez-vous à notre newsletter pour recevoir nos offres exclusives et nos dernières nouveautés.
          </p>
          
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-6 py-4 rounded-full border border-primary-200 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 bg-primary-50/50"
            />
            <button
              type="submit"
              className="bg-primary-900 text-white px-8 py-4 rounded-full font-bold hover:bg-primary-800 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              S'inscrire <ChevronRight className="ml-2 h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
