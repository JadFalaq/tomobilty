'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, SkipForward } from 'lucide-react';

interface VideoIntroProps {
  onComplete: () => void;
}

export default function VideoIntro({ onComplete }: VideoIntroProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    const handleEnded = () => {
      onComplete();
    };

    const handleError = () => {
      console.log('Erreur de chargement de la vidéo, passage automatique...');
      // Si la vidéo n'existe pas, passer après 3 secondes
      setTimeout(() => {
        onComplete();
      }, 3000);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Auto-play la vidéo
    video.play().catch(err => {
      console.log('Autoplay bloqué:', err);
      // Si l'autoplay est bloqué, passer après 3 secondes
      setTimeout(() => {
        onComplete();
      }, 3000);
    });

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [onComplete]);

  const handleSkip = () => {
    onComplete();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* Vidéo en plein écran */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted={isMuted}
        playsInline
      >
        {/* Vous pouvez mettre plusieurs sources pour la compatibilité */}
        <source src="/videos/intro.mp4" type="video/mp4" />
        <source src="/videos/intro.webm" type="video/webm" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>

      {/* Overlay avec contrôles */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30">
        {/* Boutons de contrôle en haut à droite */}
        <div className="absolute top-6 right-6 flex items-center space-x-4">
          {/* Bouton mute/unmute */}
          <button
            onClick={toggleMute}
            className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all"
            aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </button>

          {/* Bouton skip */}
          <button
            onClick={handleSkip}
            className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full hover:bg-white/30 transition-all flex items-center space-x-2"
          >
            <span className="font-medium">Passer</span>
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {/* Barre de progression en bas */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Logo ou texte optionnel */}
        <div className="absolute bottom-20 left-6">
          <h1 className="text-white text-4xl font-bold drop-shadow-lg">
            Tomobilty
          </h1>
          <p className="text-white/80 text-lg mt-2 drop-shadow-lg">
            Votre partenaire de location au Maroc
          </p>
        </div>
      </div>
    </div>
  );
}
