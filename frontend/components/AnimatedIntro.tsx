'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface AnimatedIntroProps {
  onComplete: () => void;
}

export default function AnimatedIntro({ onComplete }: AnimatedIntroProps) {
  useEffect(() => {
    // Auto-skip après 3 secondes
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center">
      <button 
        onClick={onComplete}
        className="absolute top-4 right-4 text-white/70 hover:text-white text-sm uppercase tracking-widest border border-white/30 px-4 py-2 rounded-full hover:bg-white/10 transition-all z-50"
      >
        Passer
      </button>
      <div className="text-center animate-fade-in">
        {/* Logo animé */}
        <div className="mb-8 animate-bounce-slow">
          <div className="relative w-48 h-48 mx-auto">
            <Image
              src="/logo_without_bg.png"
              alt="Tommobilty Logo"
              width={192}
              height={192}
              className="w-full h-auto drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Texte animé */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 animate-slide-up">
          Tommobilty
        </h1>
        <p className="text-xl md:text-2xl text-primary-100 animate-slide-up animation-delay-200">
          Votre partenaire de location au Maroc
        </p>

        {/* Barre de chargement */}
        <div className="mt-12 w-64 mx-auto">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full animate-loading-bar"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes loading-bar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-loading-bar {
          animation: loading-bar 3s ease-out;
        }
      `}</style>
    </div>
  );
}
