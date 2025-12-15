'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Star, Users, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-primary-900 text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grain-pattern opacity-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">À Propos de Tomobilty</h1>
            <p className="text-xl text-primary-200 max-w-2xl mx-auto">
              L'excellence de la location de voitures de luxe au Maroc, redéfinie pour votre confort et votre plaisir.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-cream-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-serif font-bold text-primary-900">Notre Histoire</h2>
                <div className="w-20 h-1 bg-gold-500 rounded-full"></div>
                <p className="text-gray-700 leading-relaxed">
                  Fondée avec une passion pour l'automobile d'exception, Tomobilty s'est imposée comme la référence 
                  de la location de voitures de luxe au Maroc. Notre mission est simple : offrir une expérience 
                  de conduite inoubliable, sans compromis sur la qualité ou le service.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Que ce soit pour un voyage d'affaires, une escapade romantique ou simplement le plaisir de conduire, 
                  notre flotte soigneusement sélectionnée répond aux attentes les plus exigeantes.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <Shield className="h-10 w-10 text-gold-500 mb-4" />
                  <h3 className="font-bold text-primary-900 mb-2">Sécurité</h3>
                  <p className="text-sm text-gray-600">Véhicules entretenus et assurés tous risques.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <Star className="h-10 w-10 text-gold-500 mb-4" />
                  <h3 className="font-bold text-primary-900 mb-2">Qualité</h3>
                  <p className="text-sm text-gray-600">Une flotte premium de dernière génération.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <Users className="h-10 w-10 text-gold-500 mb-4" />
                  <h3 className="font-bold text-primary-900 mb-2">Service</h3>
                  <p className="text-sm text-gray-600">Assistance 24/7 et service personnalisé.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                  <Award className="h-10 w-10 text-gold-500 mb-4" />
                  <h3 className="font-bold text-primary-900 mb-2">Excellence</h3>
                  <p className="text-sm text-gray-600">Satisfaction client garantie.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
