'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-primary-900 text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grain-pattern opacity-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Contactez-nous</h1>
            <p className="text-xl text-primary-200 max-w-2xl mx-auto">
              Notre équipe est à votre disposition pour répondre à toutes vos questions et vous accompagner.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-cream-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-primary-900 mb-6">Nos Coordonnées</h2>
                  <p className="text-gray-700 mb-8">
                    N'hésitez pas à nous contacter par téléphone, email ou en nous rendant visite à notre agence.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gold-500/10 p-3 rounded-full">
                      <Phone className="h-6 w-6 text-gold-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-900">Téléphone</h3>
                      <p className="text-gray-600">+212 5XX-XXXXXX</p>
                      <p className="text-sm text-gray-500">Lun - Dim: 9h00 - 20h00</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-gold-500/10 p-3 rounded-full">
                      <Mail className="h-6 w-6 text-gold-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-900">Email</h3>
                      <p className="text-gray-600">contact@tomobilty.ma</p>
                      <p className="text-sm text-gray-500">Réponse sous 24h</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-gold-500/10 p-3 rounded-full">
                      <MapPin className="h-6 w-6 text-gold-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-900">Adresse</h3>
                      <p className="text-gray-600">Casablanca, Maroc</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form (Placeholder) */}
              <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-2xl font-serif font-bold text-primary-900 mb-6">Envoyez-nous un message</h3>
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" placeholder="Votre nom" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" placeholder="votre@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" placeholder="Sujet de votre message" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" placeholder="Comment pouvons-nous vous aider ?"></textarea>
                  </div>
                  <button className="w-full bg-primary-900 text-white py-3 rounded-lg font-bold hover:bg-primary-800 transition-colors flex items-center justify-center">
                    <Send className="h-5 w-5 mr-2" />
                    Envoyer le message
                  </button>
                </form>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
