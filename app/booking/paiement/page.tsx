'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BookingPriceSummary from '@/components/BookingPriceSummary';
import { voituresAPI, protectionsAPI, reservationsAPI } from '@/lib/api';

export default function BookingPaymentPage() {
  const params = useSearchParams();
  const carId = params.get('car_id') || '';
  const startDate = params.get('start_date') || '';
  const endDate = params.get('end_date') || '';
  const paymentType = (params.get('payment_type') || 'ONLINE') as 'ONLINE' | 'AGENCE';
  const mileageOption = params.get('mileage_option') || 'KM_340';
  const protectionType = params.get('protection') || '';
  const protectionId = params.get('protection_id') || '';

  const [basePricePerDay, setBasePricePerDay] = useState(0);
  const [car, setCar] = useState<any>(null);
  const [protectionFeePerDay, setProtectionFeePerDay] = useState(0);
  const [mileageFeePerDay, setMileageFeePerDay] = useState(mileageOption === 'KM_UNLIMITED' ? 50 : 0);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [loyaltyInfo, setLoyaltyInfo] = useState<any>(null);
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<number>(0);
  const [quote, setQuote] = useState<any>(null);
  const [entreprise, setEntreprise] = useState<string>('');
  const [prenom, setPrenom] = useState<string>('');
  const [nom, setNom] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [pays, setPays] = useState<string>('Maroc');
  const [telephone, setTelephone] = useState<string>('');
  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(true);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);
  const [reserveLoading, setReserveLoading] = useState<boolean>(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const t = localStorage.getItem('token');
        setToken(t);
      } catch {}
      if (!carId) return;
      const carRes = await voituresAPI.obtenirVoitureParId(carId);
      const cc = carRes.data.data?.car;
      setCar(cc);
      setBasePricePerDay(Number(cc?.prix_par_jour || cc?.prixParJour || 0));
      if (protectionId) {
        const protRes = await protectionsAPI.getAll();
        const list = protRes.data.data?.protections || [];
        const p = list.find((x:any)=> String(x.id) === String(protectionId));
        setProtectionFeePerDay(p ? Number(p.frais_par_jour) : 0);
      }
      try {
        const li = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/loyalty/me`, {
          credentials:'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
        }).then(r=>r.json());
        if (li?.success) setLoyaltyInfo(li.data);
      } catch {}
      try {
        const qres = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/bookings/quote`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({
            carId: parseInt(carId),
            start_date: startDate,
            end_date: endDate,
            mode_paiement: paymentType === 'AGENCE' ? 'EN_AGENCE' : 'EN_LIGNE',
            kilometrage: mileageOption,
            protectionId: protectionId ? parseInt(protectionId) : undefined
          })
        }).then(r=>r.json());
        if (qres?.success) setQuote(qres.data);
      } catch {}
      // Create booking draft if not present
      if (!bookingId) {
        try {
          const payload = {
            car_id: parseInt(carId),
            date_debut: startDate,
            date_fin: endDate,
            mode_paiement: 'EN_AGENCE',
            protection_id: protectionId ? parseInt(protectionId) : undefined,
            // store mileage in metadata later via backend
            mileage_option: mileageOption
          };
          const res = await reservationsAPI.creerReservation(payload);
          const id = res.data.data?.booking?.id || res.data.data?.id;
          if (id) setBookingId(id);
        } catch {}
      }
    };
    load();
  }, [carId, protectionId]);

  const numberOfDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const diff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime())/(1000*60*60*24));
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const applyLoyalty = async () => {
    if (!bookingId || !pointsToRedeem || pointsToRedeem <= 0) return;
    if (!token) { setReserveError('Token d\'accès manquant'); return; }
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/bookings/${bookingId}/apply-loyalty`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      credentials: 'include',
      body: JSON.stringify({ points_to_redeem: pointsToRedeem })
    }).then(r=>r.json());
    if (res?.success) {
      setLoyaltyDiscount(res.data.discount_mad);
      setShowLoyalty(false);
    }
  };

  const confirmAgence = async () => {
    if (!bookingId) return;
    if (!token) { setReserveError('Token d\'accès manquant'); return; }
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/bookings/${bookingId}/confirm-agence`;
    const res = await fetch(url, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
      credentials:'include',
      body: JSON.stringify({
        prenom: car?.user?.prenom || 'Client',
        nom: car?.user?.nom || 'Tomobilty',
        email: car?.user?.email || '',
        pays: 'Maroc',
        telephone: car?.user?.telephone || '',
        ageConfirmed: true,
        termsAccepted: true,
        billing_address: {}
      })
    }).then(r=>r.json());
    if (res?.success) {
      alert('Réservation confirmée en agence');
    } else {
      alert(res?.message || 'Erreur confirmation');
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-serif font-bold text-primary-900">REVOIR VOTRE RÉSERVATION</h1>
          <BookingPriceSummary
            basePricePerDay={quote?.base_price_per_day ?? basePricePerDay}
            durationDays={quote?.days ?? numberOfDays}
            paymentType={'AGENCE'}
            protectionFeePerDay={quote?.protection_price_per_day ?? protectionFeePerDay}
            mileageFeePerDay={quote?.km_option_price_per_day ?? mileageFeePerDay}
            loyaltyDiscountMad={loyaltyDiscount}
            cautionAmount={quote?.caution_amount ?? (car?.caution || 0)}
            breakdown={quote?.breakdown_lines?.map((l:any)=>({ label: l.label, amount: l.amount })) ?? undefined}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-primary-100 p-6 payment-form">
              <h2 className="text-lg font-semibold text-primary-900 mb-4">Qui va conduire ?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="border rounded-lg p-3 text-gray-900 bg-white" placeholder="Entreprise (optionnel)" value={entreprise} onChange={e=>setEntreprise(e.target.value)} />
                <input className="border rounded-lg p-3 text-gray-900 bg-white" placeholder="Prénom (requis)" value={prenom} onChange={e=>setPrenom(e.target.value)} />
                <input className="border rounded-lg p-3 text-gray-900 bg-white" placeholder="Nom de famille (requis)" value={nom} onChange={e=>setNom(e.target.value)} />
                <input className="border rounded-lg p-3 text-gray-900 bg-white" placeholder="Adresse e-mail (requis)" value={email} onChange={e=>setEmail(e.target.value)} />
                <input className="border rounded-lg p-3 text-gray-900 bg-white" placeholder="Pays" value={pays} onChange={e=>setPays(e.target.value)} />
                <input className="border rounded-lg p-3 text-gray-900 bg-white" placeholder="Téléphone (requis)" value={telephone} onChange={e=>setTelephone(e.target.value)} />
              </div>
              <div className="mt-3">
                <label className="flex items-center gap-2 text-sm text-gray-900">
                  <input type="checkbox" checked={ageConfirmed} onChange={e=>setAgeConfirmed(e.target.checked)} className="rounded" />
                  J’ai 23 ans ou plus
                </label>
              </div>
              <div className="mt-3 bg-primary-50 border border-primary-100 text-primary-800 rounded-lg p-3 text-sm">
                Les conducteurs doivent avoir leur permis de conduire depuis au moins 2 an(s)…
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-primary-100 p-6">
              <h2 className="text-lg font-semibold text-primary-900 mb-4">Coupon et programme de fidélité</h2>
              <button onClick={()=> setShowLoyalty(true)} className="text-primary-700 underline">Ajouter un programme de fidélité</button>

              {showLoyalty && (
                <div className="mt-4 border rounded-xl p-4">
                  {loyaltyInfo ? (
                    <div className="space-y-3">
                      <div className="text-sm text-primary-700">Points disponibles: <span className="font-semibold">{loyaltyInfo.account?.points_balance || 0}</span></div>
                      <div className="text-sm text-primary-700">Niveau: <span className="font-semibold">{loyaltyInfo.tier?.name || '—'}</span></div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={0}
                          max={loyaltyInfo.account?.points_balance || 0}
                          value={pointsToRedeem}
                          onChange={(e)=> setPointsToRedeem(parseInt(e.target.value || '0'))}
                          className="border rounded-lg p-2 w-32"
                          placeholder="Points"
                        />
                        <span className="text-sm text-primary-700">Équivalent: <span className="font-semibold">{(pointsToRedeem || 0).toFixed(2)} MAD</span></span>
                        <button onClick={applyLoyalty} className="px-4 py-2 bg-primary-900 text-white rounded-lg">Appliquer</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-primary-700">Aucun programme de fidélité disponible</div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-primary-100 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary-900">Total</h2>
                <button className="text-gray-700 underline" onClick={()=>{}}>Détails du prix</button>
              </div>
              <div className="text-sm text-primary-700 mt-2">
                Caution remboursable: Une caution supplémentaire de {(quote?.caution_amount ?? (car?.caution ?? 0))} MAD sera prélevée…
              </div>
              <div className="mt-3">
                <label className="flex items-center gap-2 text-sm text-gray-900">
                  <input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} className="rounded" />
                  J’ai lu et j’accepte les informations de location, les conditions générales, et la politique de confidentialité.
                </label>
              </div>
              <div className="mt-4">
                {reserveError && <div className="mb-2 text-red-600 text-sm">{reserveError}</div>}
                <button
                  onClick={async ()=>{
                    setReserveError(null);
                    if (!prenom || !nom || !email || !telephone) {
                      setReserveError('Veuillez remplir Prénom, Nom, Email et Téléphone.');
                      return;
                    }
                    if (!ageConfirmed) {
                      setReserveError('Veuillez confirmer avoir 23 ans ou plus.');
                      return;
                    }
                    if (!termsAccepted) {
                      setReserveError('Veuillez accepter les conditions.');
                      return;
                    }
                    try {
                      setReserveLoading(true);
                      // Create booking
                      if (!token) { throw new Error('Token d\'accès manquant'); }
                      const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/bookings`, {
                        method:'POST',
                        headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
                        credentials:'include',
                        body: JSON.stringify({
                          car_id: parseInt(carId),
                          date_debut: startDate,
                          date_fin: endDate,
                          mode_paiement: 'EN_AGENCE',
                          protection_id: protectionId ? parseInt(protectionId) : undefined,
                          mileage_option: mileageOption,
                          // optional: places if available in query
                          lieu_prise_en_charge: undefined,
                          lieu_retour: undefined
                        })
                      }).then(r=>r.json());
                      if (!createRes?.success) {
                        throw new Error(createRes?.message || 'Erreur lors de la création de la réservation');
                      }
                      const bid = createRes.data?.id || createRes.data?.booking?.id;
                      setBookingId(bid);
                      // Confirm agence
                      const confRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/bookings/${bid}/confirm-agence`, {
                        method:'POST',
                        headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
                        credentials:'include',
                        body: JSON.stringify({
                          entreprise,
                          prenom,
                          nom,
                          email,
                          pays,
                          telephone,
                          ageConfirmed,
                          termsAccepted,
                          billing_address: {}
                        })
                      }).then(r=>r.json());
                      if (!confRes?.success) {
                        throw new Error(confRes?.message || 'Erreur confirmation agence');
                      }
                      // Redirect confirmation/mes-reservations
                      alert('Réservation confirmée en agence');
                      window.location.href = '/mes-reservations';
                    } catch (e:any) {
                      setReserveError(e?.message || 'Erreur lors de la réservation');
                    } finally {
                      setReserveLoading(false);
                    }
                  }}
                  disabled={reserveLoading}
                  className={`w-full ${reserveLoading ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-primary-900 text-white hover:bg-primary-800'} py-3 rounded-xl`}
                >
                  {reserveLoading ? 'Réservation…' : 'Réserver'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-primary-100 p-6">
              <h3 className="text-lg font-semibold text-primary-900 mb-3">Récapitulatif</h3>
              <div className="text-sm text-primary-700">
                <div className="mb-3">
                  <img
                    src={`/cars/${car?.id}.jpg`}
                    alt={car?.modele || 'Voiture'}
                    onError={(e) => (e.currentTarget.src = '/cars/default.jpg')}
                    className="w-full h-48 object-cover rounded-lg border border-primary-100"
                  />
                </div>
                <div className="mb-2">{car?.brand?.name} {car?.modele}</div>
                <div>{numberOfDays} jours de location</div>
                <div>Prise: {new Date(startDate).toLocaleString('fr-FR')}</div>
                <div>Retour: {new Date(endDate).toLocaleString('fr-FR')}</div>
              </div>
              <div className="mt-4">
                <div className="font-medium text-primary-900 mb-1">Aperçu de votre réservation</div>
                <ul className="text-sm text-primary-700 space-y-1">
                  <li>- Protection: {protectionType || 'BASIQUE'}</li>
                  <li>- Kilométrage: {mileageOption === 'KM_UNLIMITED' ? 'Illimité (+50/jour)' : '340 km'}</li>
                  <li>- Paiement: En agence {paymentType === 'AGENCE' ? '(+2,5%)' : ''}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
