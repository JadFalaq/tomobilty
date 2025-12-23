'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VoitureCard from '@/components/VoitureCard';
import { voituresAPI } from '@/lib/api';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown } from 'lucide-react';

const MARQUES_POPULAIRES = [
  'Toutes', 'Dacia', 'Renault', 'Peugeot', 'Volkswagen', 'Mercedes', 
  'BMW', 'Audi', 'Toyota', 'Hyundai', 'Kia', 'Range Rover'
];

const OPTIONS_TRI = [
  { label: 'Plus récents', value: 'date_creation', order: 'desc' },
  { label: 'Prix croissant', value: 'prix_par_jour', order: 'asc' },
  { label: 'Prix décroissant', value: 'prix_par_jour', order: 'desc' },
  { label: 'Marque A-Z', value: 'marque', order: 'asc' },
];

export default function VoituresPage() {
  const [voitures, setVoitures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtres, setFiltres] = useState({
    marque: '',
    prix_max: '',
    trier_par: 'date_creation',
    ordre: 'desc'
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      chargerVoitures();
    }, 300);
    return () => clearTimeout(timer);
  }, [filtres]);

  const chargerVoitures = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filtres.marque && filtres.marque !== 'Toutes') params.marque = filtres.marque;
      if (filtres.prix_max) params.prix_max = filtres.prix_max;
      params.trier_par = filtres.trier_par;
      params.ordre = filtres.ordre;

      const response = await voituresAPI.obtenirVoitures(params);
      setVoitures(response.data.data.cars || response.data.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFiltres(prev => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (value: string) => {
    const option = OPTIONS_TRI.find(o => o.label === value);
    if (option) {
      setFiltres(prev => ({ 
        ...prev, 
        trier_par: option.value, 
        ordre: option.order 
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-slate-800">
      <Navbar />
      
      {/* En-tête simplifié */}
      <div className="bg-white border-b border-gray-200 pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">
            Trouvez votre véhicule idéal
          </h1>
          <p className="text-gray-500">
            Une large sélection de voitures pour tous vos besoins et budgets.
          </p>
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Barre de contrôle (Filtres & Tri) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 sticky top-20 z-20">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Filtres Rapides */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <div className="relative min-w-[140px]">
                <select
                  value={filtres.marque || 'Toutes'}
                  onChange={(e) => handleFilterChange('marque', e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  {MARQUES_POPULAIRES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative min-w-[140px]">
                 <input
                  type="number"
                  placeholder="Budget Max (DH)"
                  value={filtres.prix_max}
                  onChange={(e) => handleFilterChange('prix_max', e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-medium placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Tri et Mobile Toggle */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0 min-w-[180px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full appearance-none pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  {OPTIONS_TRI.map(o => (
                    <option key={o.label} value={o.label}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Grille de résultats */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : voitures.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {voitures.map((voiture: any) => (
              <VoitureCard key={voiture.id} voiture={voiture} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun véhicule trouvé</h3>
            <p className="text-gray-500">Essayez d'ajuster vos filtres pour voir plus de résultats.</p>
            <button 
              onClick={() => setFiltres({ marque: '', prix_max: '', trier_par: 'date_creation', ordre: 'desc' })}
              className="mt-4 text-primary-600 font-medium hover:text-primary-700 hover:underline"
            >
              Effacer tous les filtres
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
