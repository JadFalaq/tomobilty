'use client';
export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useEffect, useMemo, useState } from 'react';
import { Shield, Check, X } from 'lucide-react';
import { protectionsAPI } from '@/lib/api';
import BookingPriceSummary from '@/components/BookingPriceSummary';
import { voituresAPI } from '@/lib/api';

function Content() {
  const params = useSearchParams();
  const router = useRouter();
  const carId = params.get('car_id') || '';
  const varianteId = params.get('variante_car_id') || '';
  const startDate = params.get('start_date') || '';
  const endDate = params.get('end_date') || '';
  const paymentType = params.get('payment_type') || 'ONLINE';
  const mileageOption = params.get('mileage_option') || 'KM_340';
  const [protection, setProtection] = useState<'BASIQUE' | 'COMPLETE' | 'PREMIUM'>('BASIQUE');
  const [protections, setProtections] = useState<Array<{id:number; type:'BASIQUE'|'COMPLETE'|'PREMIUM'; frais_par_jour:number; proprietes:{vol_collision:boolean;pneus_vitres:boolean;interieure:boolean;occupants:boolean;mobilite:boolean}}>>([]);
  const [selectedProtectionId, setSelectedProtectionId] = useState<number | null>(null);
  const [basePricePerDay, setBasePricePerDay] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await protectionsAPI.getAll();
        const list = res.data.data?.protections || [];
        setProtections(list.map((p:any)=>{
          const t = p.type as 'BASIQUE'|'COMPLETE'|'PREMIUM';
          let val = typeof p.frais_par_jour === 'number' ? p.frais_par_jour : parseFloat(String(p.frais_par_jour));
          if (isNaN(val)) {
            val = t === 'COMPLETE' ? 100 : t === 'PREMIUM' ? 170 : 0;
          }
          let propsSrc = p.proprietes;
          if (typeof propsSrc === 'string') {
            try { propsSrc = JSON.parse(propsSrc); } catch { propsSrc = {}; }
          }
          const props = propsSrc || {};
          return {id:p.id, type:t, frais_par_jour: val, proprietes:{
            vol_collision: !!props.vol_collision,
            pneus_vitres: !!props.pneus_vitres,
            interieure: !!props.interieure,
            occupants: !!props.occupants,
            mobilite: !!props.mobilite
          }};
        }));
        // Default selection BASIQUE
        const def = list.find((p:any)=>p.type==='BASIQUE');
        if (def) {
          setProtection('BASIQUE');
          setSelectedProtectionId(def.id);
        }
      } catch(e){
        setProtections([]);
      }
    };
    load();
  }, []);

  useEffect(()=> {
    const run = async () => {
      if (!carId) return;
      try {
        const res = await voituresAPI.obtenirVoitureParId(carId);
        const car = res.data.data?.car;
        const price = car?.prix_par_jour || car?.prixParJour || 0;
        setBasePricePerDay(Number(price));
      } catch(e){
        setBasePricePerDay(0);
      }
    };
    run();
  }, [carId]);

  const numberOfDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const diff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime())/(1000*60*60*24));
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const selected = useMemo(()=> protections.find(p=>p.type===protection) || null, [protections, protection]);
  const surcharge = useMemo(()=> selected ? selected.frais_par_jour * numberOfDays : 0, [selected, numberOfDays]);
  useEffect(()=> {
    if (selected) {
      console.log('selectedProtection.properties', selected.proprietes);
    }
  }, [selected]);

  const continueToPayment = () => {
    const q = new URLSearchParams({
      car_id: carId,
      variante_car_id: varianteId,
      start_date: startDate,
      end_date: endDate,
      payment_type: paymentType,
      mileage_option: mileageOption,
      protection,
      protection_id: selectedProtectionId ? String(selectedProtectionId) : ''
    }).toString();
    router.push(`/booking/paiement?${q}`);
  };

  return (
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary-900 mb-6">
            DE QUELLES PROTECTION AVEZ-VOUS BESOIN ?
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['BASIQUE','COMPLETE','PREMIUM'] as const).map((opt) => (
              <div
                key={opt}
                className={`p-6 rounded-2xl border cursor-pointer transition-all ${protection === opt ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : 'border-gray-200 hover:border-gold-300 bg-white'}`}
                onClick={() => {
                  setProtection(opt);
                  const p = protections.find(pp=>pp.type===opt);
                  setSelectedProtectionId(p?.id || null);
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Shield className={`h-6 w-6 ${protection === opt ? 'text-gold-600' : 'text-gray-400'}`} />
                  <h3 className="font-semibold text-primary-900">{opt}</h3>
                </div>
                <div className="space-y-2">
                  {[
                    {key:'vol_collision', label:'Protection vol et collision'},
                    {key:'pneus_vitres', label:'Protection pneus et vitres'},
                    {key:'interieure', label:'Protection intérieure'},
                    {key:'occupants', label:'Protection occupants accident'},
                    {key:'mobilite', label:'Garantie mobilité'},
                  ].map((row)=> {
                    const p = protections.find(pp=>pp.type===opt);
                    const enabled = p ? (p.proprietes as any)[row.key] : false;
                    return (
                      <div key={row.key} className={`flex items-center gap-2 text-sm ${enabled ? 'text-primary-800' : 'text-primary-400'}`}>
                        {enabled ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-gray-400" />}
                        <span>{row.label}</span>
                      </div>
                    );
                  })}
                </div>
                {protection === opt && (
                  <div className="flex items-center gap-2 mt-3 text-gold-700 text-sm">
                    <Check className="h-4 w-4" />
                    Sélectionné
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mb-6">
            <BookingPriceSummary
              basePricePerDay={basePricePerDay}
              durationDays={numberOfDays}
              paymentType={paymentType as 'ONLINE' | 'AGENCE'}
              protectionFeePerDay={selected ? selected.frais_par_jour : 0}
              mileageFeePerDay={(mileageOption === 'KM_UNLIMITED') ? 50 : 0}
            />
          </div>
          
          <div className="mt-4 bg-white rounded-xl border border-primary-100 p-4">
            <p className="text-sm text-primary-700">
              Frais de protection par jour: <span className="font-semibold">{selected ? `${selected.frais_par_jour} MAD` : '—'}</span>
            </p>
            <p className="text-sm text-primary-700">
              Durée: <span className="font-semibold">{numberOfDays} jour(s)</span>
            </p>
            <p className="text-sm text-primary-900">
              Surcharge de protection: <span className="font-bold">{surcharge} MAD</span>
            </p>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={continueToPayment}
              className="px-6 py-3 rounded-xl font-semibold bg-primary-900 text-white hover:bg-primary-800"
            >
              Continuer
            </button>
          </div>
        </div>
      </main>
  );
}

export default function BookingProtectionPage() {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <Navbar />
      <Suspense fallback={<div className="p-8">Chargement…</div>}>
        <Content />
      </Suspense>
      <Footer />
    </div>
  );
}
