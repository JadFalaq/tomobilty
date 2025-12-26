'use client';

import { useState, useEffect } from 'react';
import { voituresAPI } from '@/lib/api';
import api from '@/lib/api';

export default function TestVoitures() {
  const [voitures, setVoitures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    setApiUrl((api as any).defaults?.baseURL || '');
    chargerVoitures();
  }, []);

  const chargerVoitures = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Chargement des voitures...');
      const response = await voituresAPI.obtenirVoitures();
      console.log('✅ Réponse reçue:', response.data);
      setVoitures(response.data);
    } catch (err: any) {
      console.error('❌ Erreur:', err);
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Test API Voitures</h1>
        
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="font-semibold mb-2">Configuration:</h2>
          <p className="text-sm">API URL: <code className="bg-gray-100 px-2 py-1 rounded">{apiUrl}</code></p>
        </div>

        <button 
          onClick={chargerVoitures}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-6 hover:bg-blue-700"
        >
          Recharger
        </button>

        {loading && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Chargement en cours...
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Erreur:</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            ✅ {voitures.length} voitures chargées
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {voitures.map((voiture) => (
            <div key={voiture.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold text-lg">{voiture.marque} {voiture.modele}</h3>
              <p className="text-gray-600">Année: {voiture.annee}</p>
              <p className="text-green-600 font-semibold">{voiture.prix_par_jour} DH/jour</p>
              <p className="text-sm text-gray-500">
                {voiture.transmission} - {voiture.type_carburant}
              </p>
              <p className="text-sm text-gray-500">
                📍 {voiture.ville}
              </p>
              {voiture.images && voiture.images.length > 0 && (
                <img 
                  src={voiture.images[0]} 
                  alt={`${voiture.marque} ${voiture.modele}`}
                  className="w-full h-32 object-cover rounded mt-2"
                />
              )}
            </div>
          ))}
        </div>

        {voitures.length > 0 && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold mb-2">Données brutes (première voiture):</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(voitures[0], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
