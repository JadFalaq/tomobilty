import React, { useEffect, useMemo, useState } from 'react';
import { protectionsAPI, reservationsAPI, voituresAPI } from '@/lib/api';
import DateRangePicker from '@/components/DateRangePicker';
import PaymentProcessor from '@/components/PaymentProcessor';
import { ShieldCheck, X, Check, User, Mail, Clock, IdCard, Briefcase, Wallet, MapPin, ArrowLeft, ChevronRight, Shield } from 'lucide-react';

type PickupSite = { id: number; nom: string };
type Protection = { id: number; name: string; frais_par_jour: number };

type QuoteResponse = {
  success: boolean;
  data?: {
    totalPrice: number;
    breakdown_lines?: Array<{ code: string; description: string; amount: number }>;
    caution_amount?: number;
  };
  message?: string;
};

type BookingPayload = {
  car_id: number;
  date_debut: string; // ISO date string YYYY-MM-DD
  date_fin: string;   // ISO date string YYYY-MM-DD
  lieu_prise_en_charge?: string;
  lieu_retour?: string;
  mode_paiement: 'EN_LIGNE' | 'EN_AGENCE';
  protection_id?: number | null;
  additional_drivers?: Array<{
    nom: string; prenom: string; permis_numero: string; permis_date: string;
  }>;
};

const formatDateISO = (d: Date | null) => {
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function BookingFlow({ initialCarId }: { initialCarId?: number }) {
  const [carId, setCarId] = useState<number | undefined>(initialCarId);
  const [dateStart, setDateStart] = useState<Date | null>(null);
  const [dateEnd, setDateEnd] = useState<Date | null>(null);
  const [car, setCar] = useState<any>(null);
  const [pickupSites, setPickupSites] = useState<PickupSite[]>([]);
  const [pickup, setPickup] = useState<string>('');
  const [dropoff, setDropoff] = useState<string>('');
  const [protections, setProtections] = useState<Protection[]>([]);
  const [protectionId, setProtectionId] = useState<number | null>(null);
  const [modePaiement, setModePaiement] = useState<'EN_LIGNE' | 'EN_AGENCE'>('EN_LIGNE');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ bookingId: number; payment?: { payment_id: number; provider: string; status: string } } | null>(null);
  const [step, setStep] = useState<'protection' | 'checkout'>('protection');
  const [paymentModeChoice, setPaymentModeChoice] = useState<'CMI' | 'SITE'>('CMI');
  const [billingInfo, setBillingInfo] = useState({ country: 'Maroc', city: '', zipCode: '', address: '' });
  const [pilotInfo, setPilotInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    idNumber: '',
    licenseNumber: '',
    certifyAge: false,
    certifyLicenseOld: false,
  });

  useEffect(() => {
    voituresAPI.obtenirSitesRetrait().then(res => {
      const items: PickupSite[] = res.data?.data?.items || [];
      setPickupSites(items);
      if (items.length > 0) {
        setPickup(items[0].nom);
        setDropoff(items[0].nom);
      }
    }).catch(() => {});
    protectionsAPI.getAll().then(res => {
      const list: Protection[] = res.data?.data || res.data || [];
      setProtections(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const loadCar = async () => {
      if (!carId) return;
      try {
        const r = await voituresAPI.obtenirVoitureParId(String(carId));
        const cc = r?.data?.data?.car || r?.data?.car || r?.data?.data;
        setCar(cc || null);
      } catch {}
    };
    loadCar();
  }, [carId]);

  const canQuote = useMemo(() => {
    return !!carId && !!dateStart && !!dateEnd;
  }, [carId, dateStart, dateEnd]);

  useEffect(() => {
    const run = async () => {
      if (!canQuote) return;
      setLoadingQuote(true);
      setError(null);
      try {
        const payload = {
          car_id: carId,
          date_debut: formatDateISO(dateStart!),
          date_fin: formatDateISO(dateEnd!),
          protection_id: protectionId,
          lieu_prise_en_charge: pickup || undefined,
          lieu_retour: dropoff || undefined,
        };
        const res = await reservationsAPI.obtenirDevis(payload);
        setQuote(res.data as QuoteResponse);
      } catch {
        setQuote(null);
        setError('Erreur lors du calcul du prix');
      } finally {
        setLoadingQuote(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId, dateStart, dateEnd, protectionId, pickup, dropoff]);

  const numberOfDays = useMemo(() => {
    if (!dateStart || !dateEnd) return 0;
    const diff = Math.ceil((dateEnd.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [dateStart, dateEnd]);

  const createBooking = async () => {
    if (!carId || !dateStart || !dateEnd) {
      setError('Veuillez choisir la voiture et les dates');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const payload: BookingPayload = {
        car_id: carId,
        date_debut: formatDateISO(dateStart),
        date_fin: formatDateISO(dateEnd),
        lieu_prise_en_charge: pickup || undefined,
        lieu_retour: dropoff || undefined,
        mode_paiement: paymentModeChoice === 'SITE' ? 'EN_AGENCE' : 'EN_LIGNE',
        protection_id: protectionId,
        additional_drivers: [],
      };
      const res = await reservationsAPI.creerReservation(payload);
      const data = res.data?.data || {};
      const bookingId = data?.booking?.id || data?.id || res.data?.data?.id;
      const payment = data?.payment || null;
      setSuccess({ bookingId, payment: payment || undefined });
    } catch {
      setError('Erreur lors de la création de la réservation');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="pt-32 pb-40 px-6 max-w-7xl mx-auto text-white">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff003c]">Réservation</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-white/30 ml-1 tracking-widest">ID Voiture</label>
                <input
                  type="number"
                  value={carId ?? ''}
                  onChange={(e) => setCarId(parseInt(e.target.value || ''))}
                  placeholder="ID"
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-[#ff003c]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-white/30 ml-1 tracking-widest">Prise</label>
                <select
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-[#ff003c]"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                >
                  {pickupSites.map((s) => (
                    <option key={s.id} value={s.nom}>
                      {s.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-white/30 ml-1 tracking-widest">Retour</label>
                <select
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-[#ff003c]"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                >
                  {pickupSites.map((s) => (
                    <option key={s.id} value={s.nom}>
                      {s.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6">
              <DateRangePicker onChange={(start, end) => { setDateStart(start); setDateEnd(end); }} />
            </div>
          </div>

          {step === 'protection' && (
            <div>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-[2px] bg-[#ff003c]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff003c]">Protocol_Step_01</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black italic uppercase leading-none tracking-tight">Choisir votre protection</h2>
              </div>
              <div className="grid gap-6">
                <div
                  onClick={() => setProtectionId(null)}
                  className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer relative overflow-hidden ${protectionId === null ? 'bg-[#ff003c]/5 border-[#ff003c] shadow-lg' : 'bg-[#0a0a0a] border-white/5 hover:border-white/20'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${protectionId === null ? 'bg-[#ff003c] text-white' : 'bg-white/5 text-white/40'}`}>
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <div className="text-lg font-black italic uppercase">Aucune</div>
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Inclus dans le tarif de base</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black italic">+0</div>
                      <div className="text-[8px] font-black text-[#ff003c] uppercase italic">MAD / J</div>
                    </div>
                  </div>
                </div>
                {protections.map((prot) => (
                  <div
                    key={prot.id}
                    onClick={() => setProtectionId(prot.id)}
                    className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer relative overflow-hidden ${protectionId === prot.id ? 'bg-[#ff003c]/5 border-[#ff003c] shadow-lg' : 'bg-[#0a0a0a] border-white/5 hover:border-white/20'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${protectionId === prot.id ? 'bg-[#ff003c] text-white' : 'bg-white/5 text-white/40'}`}>
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <div className="text-lg font-black italic uppercase">{prot.name}</div>
                          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Pack</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black italic">+{prot.frais_par_jour}</div>
                        <div className="text-[8px] font-black text-[#ff003c] uppercase italic">MAD / J</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2">
                      {['assurance_tiers', 'protection_vol', 'assistance_route', 'franchise_zero', 'bris_de_glace'].map((key) => {
                        const props = (prot as any)?.proprietes as Record<string, boolean> | undefined;
                        const enabled = props ? Boolean(props[key]) : false;
                        return (
                          <div key={key} className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest ${enabled ? 'text-white/80' : 'text-white/40'}`}>
                            {enabled ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-red-500/30" />}
                            <span>{key.replace(/_/g, ' ')}</span>
                          </div>
                        );
                      })}
                    </div>
                    {protectionId === prot.id && <div className="absolute top-6 right-6 text-[#ff003c]"><Check size={20} /></div>}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep('checkout')}
                className="mt-10 w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-[#ff003c] hover:text-white transition-all shadow-2xl flex items-center justify-center gap-3"
              >
                Valider et continuer <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 'checkout' && (
            <div className="space-y-10">
              <button onClick={() => setStep('protection')} className="flex items-center gap-2 text-[10px] font-black uppercase text-white/40 hover:text-white">
                <ArrowLeft size={14} /> Retour à la protection
              </button>
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]">
                <div className="text-xl font-black italic uppercase mb-6">Profil Pilote</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Nom Complet</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input
                        type="text"
                        value={pilotInfo.fullName}
                        onChange={(e) => setPilotInfo({ ...pilotInfo, fullName: e.target.value })}
                        placeholder="Prénom Nom"
                        className="w-full bg_white/5 border border-white/10 p-3 pl-12 rounded-xl text-sm font-bold text-white outline-none focus:border-[#ff003c]"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">E-mail</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input
                        type="email"
                        value={pilotInfo.email}
                        onChange={(e) => setPilotInfo({ ...pilotInfo, email: e.target.value })}
                        placeholder="pilote@elite.ma"
                        className="w-full bg-white/5 border border-white/10 p-3 pl-12 rounded-xl text-sm font-bold text-white outline-none focus:border-[#ff003c]"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Téléphone</label>
                    <div className="relative group">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input
                        type="text"
                        value={pilotInfo.phone}
                        onChange={(e) => setPilotInfo({ ...pilotInfo, phone: e.target.value })}
                        placeholder="+212 ..."
                        className="w-full bg-white/5 border border-white/10 p-3 pl-12 rounded-xl text-sm font-bold text-white outline-none focus:border-[#ff003c]"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">CIN / Passeport</label>
                    <div className="relative group">
                      <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input
                        type="text"
                        value={pilotInfo.idNumber}
                        onChange={(e) => setPilotInfo({ ...pilotInfo, idNumber: e.target.value })}
                        placeholder="Numéro d'identité"
                        className="w-full bg-white/5 border border-white/10 p-3 pl-12 rounded-xl text-sm font-bold text-white outline-none focus:border-[#ff003c]"
                      />
                    </div>
                  </div>
                  <div className="space-y-3 sm:col-span-2">
                    <label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Numéro de Permis</label>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input
                        type="text"
                        value={pilotInfo.licenseNumber}
                        onChange={(e) => setPilotInfo({ ...pilotInfo, licenseNumber: e.target.value })}
                        placeholder="Référence du permis"
                        className="w-full bg-white/5 border border-white/10 p-3 pl-12 rounded-xl text-sm font-bold text-white outline-none focus:border-[#ff003c]"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 pt-2 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${pilotInfo.certifyAge ? 'bg-[#ff003c] border-[#ff003c]' : 'bg-white/5 border-white/10'}`}>
                        {pilotInfo.certifyAge && <Check size={14} className="text-white" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={pilotInfo.certifyAge} onChange={(e) => setPilotInfo({ ...pilotInfo, certifyAge: e.target.checked })} />
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest italic">Je certifie avoir plus de 21 ans.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${pilotInfo.certifyLicenseOld ? 'bg-[#ff003c] border-[#ff003c]' : 'bg-white/5 border-white/10'}`}>
                        {pilotInfo.certifyLicenseOld && <Check size={14} className="text-white" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={pilotInfo.certifyLicenseOld} onChange={(e) => setPilotInfo({ ...pilotInfo, certifyLicenseOld: e.target.checked })} />
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest italic">Mon permis a plus de deux ans.</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]">
                <div className="text-xl font-black italic uppercase mb-6 flex items-center gap-3">
                  <Shield className="text-[#ff003c]" /> Méthode de règlement
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentModeChoice('CMI')}
                    className={`py-6 border rounded-2xl font-black uppercase italic text-[10px] flex flex-col items-center gap-3 transition-all ${paymentModeChoice === 'CMI' ? 'border-[#ff003c] bg-[#ff003c]/10' : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'}`}
                  >
                    <Wallet size={22} /> Paiement Online (CMI)
                  </button>
                  <button
                    onClick={() => setPaymentModeChoice('SITE')}
                    className={`py-6 border rounded-2xl font-black uppercase italic text-[10px] flex flex-col items-center gap-3 transition-all ${paymentModeChoice === 'SITE' ? 'border-[#ff003c] bg-[#ff003c]/10' : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100'}`}
                  >
                    <MapPin size={22} /> Sur place à l'agence
                  </button>
                </div>
              </div>

              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem]">
                <div className="text-xl font-black italic uppercase mb-6 flex items-center gap-3">
                  <MapPin className="text-[#ff003c]" /> Adresse de facturation
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Pays</label>
                    <input
                      type="text"
                      value={billingInfo.country}
                      onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
                      placeholder="Maroc"
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-[#ff003c]"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Ville</label>
                    <input
                      type="text"
                      value={billingInfo.city}
                      onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                      placeholder="Casablanca"
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-[#ff003c]"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Code Postal</label>
                    <input
                      type="text"
                      value={billingInfo.zipCode}
                      onChange={(e) => setBillingInfo({ ...billingInfo, zipCode: e.target.value })}
                      placeholder="20000"
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-[#ff003c]"
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Adresse</label>
                    <input
                      type="text"
                      value={billingInfo.address}
                      onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                      placeholder="Numéro et nom de la rue"
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm font-bold text-white outline-none focus:border-[#ff003c]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {!success && (
                  <button
                    onClick={createBooking}
                    disabled={creating || !pilotInfo.fullName || !pilotInfo.email.includes('@') || !pilotInfo.certifyAge || !pilotInfo.certifyLicenseOld || !billingInfo.city || !billingInfo.address}
                    className={`w-full py-6 font-black uppercase italic rounded-[2rem] transition-all flex items-center justify-center gap-4 ${creating ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10' : 'bg-white text-black hover:bg-[#ff003c] hover:text-white'}`}
                  >
                    {creating ? 'Réservation…' : 'Confirmer la réservation'}
                  </button>
                )}
                {success && (
                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem]">
                    <div className="text-green-500 font-bold mb-2">Réservation créée: {success.bookingId}</div>
                    {paymentModeChoice === 'CMI' && (
                      <PaymentProcessor
                        bookingId={success.bookingId}
                        amount={quote?.data?.totalPrice ?? undefined}
                        currency="MAD"
                        onSuccess={() => {}}
                        onError={() => {}}
                      />
                    )}
                    {paymentModeChoice === 'SITE' && (
                      <div className="text-sm text-white/80">Paiement à l’agence lors du retrait.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Shield size={100} />
              </div>
              <img
                src={`/cars/${car?.id}.jpg`}
                alt={car?.modele || 'Voiture'}
                onError={(e) => (e.currentTarget.src = '/cars/default.jpg')}
                className="w-full h-40 object-cover rounded-xl mb-6"
              />
              <div className="text-2xl font-black italic uppercase leading-none tracking-tight mb-4">
                {(car?.brand?.name || '')} <br /> <span className="text-white/20">{car?.modele || ''}</span>
              </div>
              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex justify-between">
                  <p className="text-[9px] font-black uppercase text-white/30 italic">Pilote</p>
                  <p className="text-[10px] font-bold uppercase truncate max-w-[140px]">{pilotInfo.fullName || '...'}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[9px] font-black uppercase text-white/30 italic">Période</p>
                  <p className="text-[10px] font-bold uppercase tracking-tighter">
                    {dateStart ? new Date(dateStart).toLocaleDateString('fr-FR') : '—'} — {dateEnd ? new Date(dateEnd).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-[9px] font-black uppercase text-white/30 italic">Protection</p>
                  <p className="text-xs font-black text-[#ff003c] uppercase italic tracking-widest">
                    {protectionId ? (protections.find((p) => p.id === protectionId)?.name || '') : 'Aucune'}
                  </p>
                </div>
                {(billingInfo.city || billingInfo.address) && (
                  <div className="flex justify-between items-start border-t border-white/5 pt-4">
                    <p className="text-[9px] font-black uppercase text-white/30 italic">Facture</p>
                    <p className="text-[9px] font-bold uppercase tracking-tighter max-w-[160px]">
                      {billingInfo.address} {billingInfo.city && `, ${billingInfo.city}`} {billingInfo.zipCode && `(${billingInfo.zipCode})`}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase italic">
                  <span>Location ({numberOfDays}j)</span>
                  <span>{((quote?.data?.breakdown_lines || []) as any[]).find((l) => (l as any).code === 'BASE_RENT')?.amount ?? ''} MAD</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase italic">
                  <span>Pack Protection</span>
                  <span>+{protectionId ? protections.find((p) => p.id === protectionId)?.frais_par_jour ? (protections.find((p) => p.id === protectionId)!.frais_par_jour * Math.max(1, numberOfDays)) : 0 : 0} MAD</span>
                </div>
                <div className="flex justify-between items-end pt-6 border-t border-white/10">
                  <div>
                    <p className="text-[10px] font-black text-[#ff003c] uppercase italic mb-1 tracking-widest leading-none">Total TTC</p>
                    <p className="text-4xl font-black italic tracking-tighter leading-none">{quote?.data?.totalPrice ?? 0}</p>
                  </div>
                  <p className="text-xs font-black text-white/20 italic mb-1 ml-2">MAD</p>
                </div>
              </div>
              <div className="px-2 mt-4 flex items-center gap-2 text-[8px] font-black uppercase text-white/20 tracking-[0.2em] italic">
                <ShieldCheck size={14} className="text-green-500" /> Sécurisé
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
