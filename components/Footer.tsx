import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary-950 text-white mt-auto border-t border-primary-900 relative overflow-hidden">
      {/* Grain pattern overlay */}
      <div className="absolute inset-0 bg-grain-pattern opacity-5 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Tomobilty Logo" 
                width={500} 
                height={200}
                className="h-32 w-auto brightness-0 invert opacity-90"
              />
            </div>
            <p className="text-primary-200 max-w-md text-lg font-light leading-relaxed">
              Votre partenaire de confiance pour la location de voitures de luxe au Maroc. 
              Une expérience de conduite exceptionnelle alliant élégance et confort.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-3 text-primary-200 group hover:text-gold-400 transition-colors cursor-pointer">
                <div className="p-2 bg-primary-900/50 rounded-lg group-hover:bg-primary-800 transition-colors">
                  <Phone className="h-5 w-5 text-gold-500" />
                </div>
                <span className="font-medium">+212 5XX-XXXXXX</span>
              </div>
              <div className="flex items-center space-x-3 text-primary-200 group hover:text-gold-400 transition-colors cursor-pointer">
                <div className="p-2 bg-primary-900/50 rounded-lg group-hover:bg-primary-800 transition-colors">
                  <Mail className="h-5 w-5 text-gold-500" />
                </div>
                <span className="font-medium">contact@tomobilty.ma</span>
              </div>
              <div className="flex items-center space-x-3 text-primary-200">
                <div className="p-2 bg-primary-900/50 rounded-lg">
                  <MapPin className="h-5 w-5 text-gold-500" />
                </div>
                <span className="font-medium">Casablanca, Maroc</span>
              </div>
            </div>

            {/* Réseaux Sociaux */}
            <div className="pt-6">
              <h4 className="text-sm font-bold text-gold-500 uppercase tracking-wider mb-4">Suivez-nous</h4>
              <div className="flex space-x-4">
                <a href="#" className="bg-primary-900/50 p-3 rounded-full text-primary-300 hover:bg-gold-500 hover:text-white transition-all duration-300 transform hover:-translate-y-1">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="bg-primary-900/50 p-3 rounded-full text-primary-300 hover:bg-gold-500 hover:text-white transition-all duration-300 transform hover:-translate-y-1">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="bg-primary-900/50 p-3 rounded-full text-primary-300 hover:bg-gold-500 hover:text-white transition-all duration-300 transform hover:-translate-y-1">
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Liens Utiles */}
          <div>
            <h3 className="text-xl font-serif font-bold text-white mb-6 relative inline-block">
              Liens Utiles
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-gold-500 rounded-full"></span>
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/a-propos" className="text-primary-300 hover:text-gold-400 transition-all hover:translate-x-1 inline-block">
                  À Propos
                </Link>
              </li>
              <li>
                <Link href="/voitures" className="text-primary-300 hover:text-gold-400 transition-all hover:translate-x-1 inline-block">
                  Nos Voitures
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-primary-300 hover:text-gold-400 transition-all hover:translate-x-1 inline-block">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/conditions" className="text-primary-300 hover:text-gold-400 transition-all hover:translate-x-1 inline-block">
                  Conditions Générales
                </Link>
              </li>
            </ul>
          </div>

          {/* Informations légales */}
          <div>
            <h3 className="text-xl font-serif font-bold text-white mb-6 relative inline-block">
              Informations
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-gold-500 rounded-full"></span>
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/confidentialite" className="text-primary-300 hover:text-gold-400 transition-all hover:translate-x-1 inline-block">
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-primary-300 hover:text-gold-400 transition-all hover:translate-x-1 inline-block">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/aide" className="text-primary-300 hover:text-gold-400 transition-all hover:translate-x-1 inline-block">
                  Aide
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-900 mt-16 pt-8 text-center">
          <p className="text-primary-400 text-sm">
            &copy; {new Date().getFullYear()} Tomobilty. Tous droits réservés. 
            <span className="mx-2 text-primary-700">|</span> 
            Fait avec élégance au Maroc
          </p>
        </div>
      </div>
    </footer>
  );
}
