'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import VoitureCard from '@/components/VoitureCard';
import { voituresAPI } from '@/lib/api';

function Content() {
  const params = useSearchParams();
  const router = useRouter();
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startDate = params.get('start_date') || params.get('date_debut') || '';
  const endDate = params.get('end_date') || params.get('date_fin') || '';
  const pickup = params.get('pickup_location') || params.get('location') || '';
  const ret = params.get('return_location') || pickup || '';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const res = await voituresAPI.obtenirVoituresDisponibles({
          start_date: startDate,
          end_date: endDate,
        });
        const list = res.data.data?.cars || [];
        setCars(list);
      } catch (e: any) {
        console.error('[AVAILABLE CARS] Frontend catch error:', {
          status: e?.response?.status,
          data: e?.response?.data,
          message: e?.message
        });
        const errs: Array<{ field?: string; message?: string }> = e?.response?.data?.errors || [];
        const joined = errs.length ? errs.map(er => `${er.field || 'field'}: ${er.message || ''}`).join(', ') : null;
        setErrorMessage(joined || e?.response?.data?.message || 'Erreur lors du chargement des voitures disponibles.');
        setCars([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [startDate, endDate, pickup]);

  const handleSelect = (carId: number) => {
    const q = new URLSearchParams({
      car_id: String(carId),
      start_date: startDate,
      end_date: endDate
    }).toString();
    router.push(`/booking/options?${q}`);
  };

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary-900 mb-6">
        Voitures disponibles
      </h1>
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
          {errorMessage}
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : !errorMessage && cars.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-primary-700">Aucune voiture disponible pour ces critères.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((c: any) => (
            <div key={c.id} onClick={() => handleSelect(c.id)} className="cursor-pointer">
              <VoitureCard voiture={c} showReserveButton={false} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function DisponiblesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Suspense fallback={<div className="p-8">Chargement…</div>}>
        <Content />
      </Suspense>
      <Footer />
    </div>
  );
}
