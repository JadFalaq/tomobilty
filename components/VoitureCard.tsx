'use client';

import Link from 'next/link';
import { Car, Users, Fuel, Settings, MapPin, ArrowRight } from 'lucide-react';
import { formatPrice, getStatutBadgeColor, getStatutLabel } from '@/lib/utils';

interface VoitureCardProps {
  voiture: {
    id: number;
    marque: string;
    modele: string;
    annee: number;
    images?: string[];
    prix_par_jour: number;
    type_carburant: string;
    transmission: string;
    nombre_places: number;
    statut: string;
    ville?: string;
    agence_ville?: string;
  };
  showReserveButton?: boolean;
}

export default function VoitureCard({ voiture, showReserveButton = true }: VoitureCardProps) {
  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-primary-100 hover:border-gold-300 flex flex-col h-full">
      <div className="relative h-56 bg-primary-50 overflow-hidden">
        <img
          src={`/cars/${voiture.id}.jpg`}
          alt={`${voiture.marque} ${voiture.modele}`}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/cars/default.jpg'; }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${getStatutBadgeColor(voiture.statut)}`}>
            {getStatutLabel(voiture.statut)}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow relative">
        <div className="mb-4">
            <div className="flex justify-between items-start mb-1">
                <h3 className="text-xl font-serif font-bold text-primary-900 group-hover:text-gold-600 transition-colors">
                {voiture.marque} {voiture.modele}
                </h3>
                <span className="text-sm text-primary-400 font-medium bg-primary-50 px-2 py-1 rounded-md border border-primary-100">
                    {voiture.annee}
                </span>
            </div>
            {(voiture.ville || voiture.agence_ville) && (
                <div className="flex items-center text-xs text-primary-400 mb-3">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{voiture.ville || voiture.agence_ville}</span>
                </div>
            )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="flex flex-col items-center justify-center p-2 bg-primary-50 rounded-xl group-hover:bg-cream-100 transition-colors">
            <Users className="h-5 w-5 text-gold-500 mb-1" />
            <span className="text-xs font-medium text-primary-600">{voiture.nombre_places} Places</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 bg-primary-50 rounded-xl group-hover:bg-cream-100 transition-colors">
            <Fuel className="h-5 w-5 text-gold-500 mb-1" />
            <span className="text-xs font-medium text-primary-600 truncate w-full text-center">{voiture.type_carburant}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 bg-primary-50 rounded-xl group-hover:bg-cream-100 transition-colors">
            <Settings className="h-5 w-5 text-gold-500 mb-1" />
            <span className="text-xs font-medium text-primary-600 truncate w-full text-center">{voiture.transmission}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-primary-50">
          <div>
            <p className="text-xs text-primary-400 font-bold uppercase tracking-wider">Prix par jour</p>
            <p className="text-2xl font-serif font-bold text-primary-900">
              {formatPrice(voiture.prix_par_jour)}
            </p>
          </div>
          {showReserveButton && (
            <Link
              href={`/voitures/${voiture.id}`}
              className="group/btn relative bg-primary-900 text-white px-6 py-2.5 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-primary-900/30"
            >
              <span className="relative z-10 flex items-center font-medium">
                  Réserver <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gold-500 transform scale-x-0 origin-left group-hover/btn:scale-x-100 transition-transform duration-300 ease-out"></div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
