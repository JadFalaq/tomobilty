'use client';
export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState, useMemo, useEffect } from 'react';
import { CreditCard, Shield, Car } from 'lucide-react';
import BookingPriceSummary from '@/components/BookingPriceSummary';
import { voituresAPI } from '@/lib/api';

export default function BookingOptionsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const carId = params.get('car_id') || '';
  const startDate = params.get('start_date') || '';
  const endDate = params.get('end_date') || '';

  const [paymentType, setPaymentType] = useState<'ONLINE' | 'AGENCE'>('ONLINE');
  const [mileageOption, setMileageOption] = useState<'KM_340' | 'KM_UNLIMITED'>('KM_340');
  const [carPricePerDay, setCarPricePerDay] = useState<number>(0);

  useEffect(()=> {
    const load = async () => {
      if (!carId) return;
      try {
        const res = await voituresAPI.obtenirVoitureParId(carId);
        const car = res.data.data?.car;
        const price = car?.prix_par_jour || car?.prixParJour || 0;
        setCarPricePerDay(Number(price));
      } catch(e){
        setCarPricePerDay(0);
      }
    };
    load();
  }, [carId]);

  const canProceed = useMemo(() => {
    return !!carId && !!startDate && !!endDate;
  }, [carId, startDate, endDate]);

  const numberOfDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const diff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime())/(1000*60*60*24));
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const subtotalEstimate = useMemo(()=> carPricePerDay * numberOfDays, [carPricePerDay, numberOfDays]);
  const agencyFee = useMemo(()=> paymentType === 'AGENCE' ? Math.round(subtotalEstimate * 0.025 * 100)/100 : 0, [paymentType, subtotalEstimate]);
  const mileageFeePerDay = useMemo(()=> mileageOption === 'KM_UNLIMITED' ? 50 : 0, [mileageOption]);

  const goNext = () => {
    const q = new URLSearchParams({
      car_id: carId,
      start_date: startDate,
      end_date: endDate,
      payment_type: paymentType,
      mileage_option: mileageOption
    }).toString();
    router.push(`/booking/protection?${q}`);
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-primary-100 p-6">
          <h1 className="text-2xl font-serif font-bold text-primary-900 mb-6">Options de paiement</h1>

          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-primary-900">Type de paiement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`p-4 rounded-lg border cursor-pointer transition-all ${paymentType === 'ONLINE' ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : 'border-gray-200 hover:border-gold-300'}`}>
                  <input
                    type="radio"
                    name="payment_type"
                    className="sr-only"
                    checked={paymentType === 'ONLINE'}
                    onChange={() => setPaymentType('ONLINE')}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className={`h-5 w-5 ${paymentType === 'ONLINE' ? 'text-gold-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-primary-800">En ligne</span>
                    </div>
                    <span className="text-sm text-primary-600">Paiement sécurisé</span>
                  </div>
                </label>
                <label className={`p-4 rounded-lg border cursor-pointer transition-all ${paymentType === 'AGENCE' ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : 'border-gray-200 hover:border-gold-300'}`}>
                  <input
                    type="radio"
                    name="payment_type"
                    className="sr-only"
                    checked={paymentType === 'AGENCE'}
                    onChange={() => setPaymentType('AGENCE')}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className={`h-5 w-5 ${paymentType === 'AGENCE' ? 'text-gold-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-primary-800">En agence</span>
                    </div>
                    <span className="text-sm text-primary-600">Règlement sur place</span>
                  </div>
                </label>
              </div>
            </div>

            <BookingPriceSummary
              basePricePerDay={carPricePerDay}
              durationDays={numberOfDays}
              paymentType={paymentType}
              mileageFeePerDay={mileageFeePerDay}
            />

            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-primary-900">Kilométrage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`p-4 rounded-lg border cursor-pointer transition-all ${mileageOption === 'KM_340' ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : 'border-gray-200 hover:border-gold-300'}`}>
                  <input
                    type="radio"
                    name="mileage_option"
                    className="sr-only"
                    checked={mileageOption === 'KM_340'}
                    onChange={() => setMileageOption('KM_340')}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Car className={`h-5 w-5 ${mileageOption === 'KM_340' ? 'text-gold-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-primary-800">340 km</span>
                    </div>
                    <span className="text-sm text-primary-600">Inclus dans la réservation</span>
                  </div>
                </label>
                <label className={`p-4 rounded-lg border cursor-pointer transition-all ${mileageOption === 'KM_UNLIMITED' ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : 'border-gray-200 hover:border-gold-300'}`}>
                  <input
                    type="radio"
                    name="mileage_option"
                    className="sr-only"
                    checked={mileageOption === 'KM_UNLIMITED'}
                    onChange={() => setMileageOption('KM_UNLIMITED')}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Car className={`h-5 w-5 ${mileageOption === 'KM_UNLIMITED' ? 'text-gold-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-primary-800">Kilométrage illimité</span>
                    </div>
                    <span className="text-sm text-primary-600">+50 MAD / jour</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={goNext}
                disabled={!canProceed}
                className={`px-6 py-3 rounded-xl font-semibold ${!canProceed ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-primary-900 text-white hover:bg-primary-800'}`}
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
