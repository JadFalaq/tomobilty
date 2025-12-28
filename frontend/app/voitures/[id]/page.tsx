'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';
import DateRangePicker from '@/components/DateRangePicker';
import { voituresAPI, reservationsAPI, authAPI } from '@/lib/api';
import { formatPrice, calculerNombreJours } from '@/lib/utils';
import { Car, Users, User, Fuel, Settings, MapPin, Calendar, Shield, Check, Gift, CreditCard } from 'lucide-react';
import { jsPDF } from 'jspdf';
import PaymentProcessor from '@/components/PaymentProcessor';

export default function VoitureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sp = useSearchParams();
  const LOCATIONS = [
    'Casablanca (Ville)',
    'Casablanca – Aéroport Mohammed V (CMN)',
    'Rabat (Ville)',
    'Rabat – Aéroport Rabat-Salé (RBA)'
  ];
  const [voiture, setVoiture] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
  const [reservation, setReservation] = useState({
    dateDebut: '',
    dateFin: '',
    lieuPriseEnCharge: '',
    lieuRetour: '',
    assurance: 'basique',
    modePaiement: 'carte_bancaire',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    cinNumero: '',
    permisNumero: '',
    dateNaissance: '',
    adresse: '',
    ville: '',
    codePostal: '',
    profession: '',
    optionChauffeur: false
  });
  const [paymentType, setPaymentType] = useState<'ONLINE' | 'AGENCE'>('ONLINE');
  const [mileageOption, setMileageOption] = useState<'INCLUDED_340' | 'UNLIMITED'>('INCLUDED_340');
  const [prixTotal, setPrixTotal] = useState(0);
  const [disponible, setDisponible] = useState(true);
  const [verificationEnCours, setVerificationEnCours] = useState(false);
  const [reservationEnCours, setReservationEnCours] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [utiliserPoints, setUtiliserPoints] = useState(false);

  

  useEffect(() => {
    if (params.id) {
      chargerVoiture();
    }
    const sd = sp.get('start_date') || '';
    const ed = sp.get('end_date') || '';
    const pl = sp.get('pickup_location') || '';
    const rl = sp.get('return_location') || '';
    setReservation(prev => ({
      ...prev,
      dateDebut: sd || prev.dateDebut,
      dateFin: ed || prev.dateFin,
      lieuPriseEnCharge: pl || prev.lieuPriseEnCharge,
      lieuRetour: rl || pl || prev.lieuRetour
    }));
    // Charger l'utilisateur
    const loadUser = async () => {
      const localData = localStorage.getItem('user');
      if (localData) {
        setUser(JSON.parse(localData));
        try {
           const res = await authAPI.obtenirProfil();
           const userData = res.data.data.user;
           setUser(userData);
           localStorage.setItem('user', JSON.stringify(userData));
           // Pre-fill user data
           setReservation(prev => ({
             ...prev,
             nom: userData.nom || '',
             prenom: userData.prenom || '',
             email: res.data.email || '',
             telephone: res.data.telephone || '',
             permisNumero: res.data.permisNumero || ''
           }));
        } catch(e) { console.error(e); }
      }
    };
    loadUser();
  }, [params.id]);

  useEffect(() => {
    if (reservation.dateDebut && reservation.dateFin && voiture) {
      calculerPrix();
    }
  }, [reservation.dateDebut, reservation.dateFin, reservation.assurance, reservation.optionChauffeur, utiliserPoints, user, voiture]);

  const chargerVoiture = async () => {
    try {
      setLoading(true);
      const response = await voituresAPI.obtenirVoitureParId(params.id as string);
      const carData = response.data.data.car;
      setVoiture(carData);
      setReservation(prev => ({
        ...prev,
        lieuPriseEnCharge: carData.agence_ville || '',
        lieuRetour: carData.agence_ville || '',
      }));
    } catch (error) {
      console.error('Erreur lors du chargement de la voiture:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculerPrix = () => {
    if (!voiture || !reservation.dateDebut || !reservation.dateFin) return;

    const nombreJours = calculerNombreJours(reservation.dateDebut, reservation.dateFin);
    const prixParJour = voiture.prix_par_jour || voiture.prixParJour || 0;
    let total = prixParJour * nombreJours;

    // Assurance
    const prixAssurance: { [key: string]: number } = {
      basique: 50,
      complete: 100,
      premium: 150,
    };
    total += prixAssurance[reservation.assurance] * nombreJours;

    // Chauffeur
    if (reservation.optionChauffeur) {
      total += 300 * nombreJours; // 300 DH/jour
    }

    // Fidélité
    if (utiliserPoints && user && user.pointsFidelite > 0) {
      const VALEUR_POINT = 5;
      const maxPointsUtilisables = Math.floor(total / VALEUR_POINT);
      const pointsAUtiliser = Math.min(user.pointsFidelite, maxPointsUtilisables);
      const reduction = pointsAUtiliser * VALEUR_POINT;
      total -= reduction;
    }

    setPrixTotal(total);
  };

  const handleVerifierDisponibilite = async () => {
    if (!reservation.dateDebut || !reservation.dateFin) {
      alert('Veuillez sélectionner les dates.');
      return;
    }
    if (
      !reservation.lieuPriseEnCharge ||
      !reservation.lieuRetour ||
      !LOCATIONS.includes(reservation.lieuPriseEnCharge) ||
      !LOCATIONS.includes(reservation.lieuRetour)
    ) {
      alert('Veuillez choisir les lieux parmi les options proposées.');
      return;
    }
    setVerificationEnCours(true);
    try {
      const response = await voituresAPI.verifierDisponibilite(params.id as string, {
        date_debut: reservation.dateDebut,
        date_fin: reservation.dateFin,
      });
      if (response.data.data.available) {
        setDisponible(true);
        setStep(2);
      } else {
        setDisponible(false);
        alert('Désolé, aucune voiture de ce modèle n\'est disponible pour ces dates.');
      }
    } catch (error) {
      console.error('Erreur disponibilité:', error);
      alert('Erreur lors de la vérification de disponibilité.');
    } finally {
      setVerificationEnCours(false);
    }
  };

  

  const genererContratPDF = () => {
    const doc = new jsPDF();
    const lineHeight = 10;
    let y = 20;

    doc.setFontSize(20);
    doc.text("CONTRAT DE LOCATION DE VOITURE", 105, y, { align: "center" });
    y += 20;

    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, y);
    y += lineHeight;

    doc.text("ENTRE LES SOUSSIGNÉS:", 20, y);
    y += lineHeight;
    doc.text("L'Agence TOMMOBILTY (Le Loueur)", 20, y);
    y += lineHeight;
    doc.text(`ET M./Mme ${reservation.nom} ${reservation.prenom} (Le Locataire)`, 20, y);
    y += lineHeight * 2;

    doc.text("IL A ÉTÉ CONVENU CE QUI SUIT:", 20, y);
    y += lineHeight;

    doc.text(`1. VÉHICULE: ${voiture.marque} ${voiture.modele} (${voiture.annee})`, 20, y);
    y += lineHeight;
    doc.text(`   Immatriculation: ${voiture.immatriculation || 'N/A'}`, 20, y);
    y += lineHeight;

    doc.text(`2. DURÉE: Du ${new Date(reservation.dateDebut).toLocaleDateString()} au ${new Date(reservation.dateFin).toLocaleDateString()}`, 20, y);
    y += lineHeight;

    doc.text(`3. PRIX TOTAL: ${formatPrice(prixTotal)}`, 20, y);
    y += lineHeight;
    doc.text(`   Assurance: ${reservation.assurance}`, 20, y);
    y += lineHeight;
    if (reservation.optionChauffeur) {
      doc.text(`   Option Chauffeur: OUI`, 20, y);
      y += lineHeight;
    }

    doc.text(`4. CONDUCTEUR:`, 20, y);
    y += lineHeight;
    doc.text(`   Permis N°: ${reservation.permisNumero}`, 20, y);
    y += lineHeight;
    doc.text(`   CIN N°: ${reservation.cinNumero}`, 20, y);
    y += lineHeight * 2;

    doc.text("SIGNATURES:", 20, y);
    y += lineHeight * 3;
    doc.text("Le Locataire                     Le Loueur", 20, y);

    doc.save("contrat_location_tommobilty.pdf");
  };

  const handleReservation = async () => {
    if (!user) {
      alert('Veuillez vous connecter pour effectuer une réservation.');
      router.push('/auth/login');
      return;
    }

    // Validation des champs obligatoires
    if (!reservation.nom || !reservation.prenom || !reservation.email || !reservation.telephone) {
      alert('Veuillez remplir les champs Nom, Prénom, Email et Téléphone.');
      return;
    }

    setReservationEnCours(true);
    try {
      const reservationData = {
        car_id: parseInt(params.id as string),
        date_debut: reservation.dateDebut,
        date_fin: reservation.dateFin,
        lieu_prise_en_charge: reservation.lieuPriseEnCharge,
        lieu_retour: reservation.lieuRetour,
        assurance: reservation.assurance,
        mode_paiement: reservation.modePaiement,
        payment_type: paymentType,
        mileage_option: mileageOption,
        nom: reservation.nom,
        prenom: reservation.prenom,
        email: reservation.email,
        telephone: reservation.telephone,
        cin_numero: reservation.cinNumero,
        permis_numero: reservation.permisNumero,
        date_naissance: reservation.dateNaissance,
        adresse: reservation.adresse,
        ville: reservation.ville,
        code_postal: reservation.codePostal,
        profession: reservation.profession,
        option_chauffeur: reservation.optionChauffeur,
        prix_total: prixTotal,
        utiliser_points: utiliserPoints
      };

      const response = await reservationsAPI.creerReservation(reservationData);
      const bookingId = response.data.data.booking?.id || response.data.data.id;
      
      // Stocker l'ID de la réservation créée
      setCreatedBookingId(bookingId);
      
      // Générer le contrat
      genererContratPDF();

      if (reservation.modePaiement === 'EN_LIGNE') {
        // Passer à l'étape de paiement
        setStep(5);
      } else {
        alert('Réservation confirmée ! Le contrat a été téléchargé.');
        router.push('/mes-reservations');
      }
    } catch (error: any) {
      console.error('Erreur réservation:', error);
      alert(error.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setReservationEnCours(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div></div>;
  if (!voiture) return <div className="min-h-screen flex items-center justify-center">Voiture non trouvée</div>;

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-gold-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {s}
                </div>
                {s < 5 && <div className={`w-16 h-1 bg-gray-200 ${step > s ? 'bg-gold-500' : ''}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Wizard) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            
            {/* Step 1: Dates & Location */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold font-serif text-primary-900">1. Dates et Lieux</h2>
                <DateRangePicker
                  startDate={reservation.dateDebut}
                  endDate={reservation.dateFin}
                  onStartDateChange={(date) => setReservation(prev => ({ ...prev, dateDebut: date }))}
                  onEndDateChange={(date) => setReservation(prev => ({ ...prev, dateFin: date }))}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de prise en charge</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <select
                        value={reservation.lieuPriseEnCharge}
                        onChange={(e) => setReservation({ ...reservation, lieuPriseEnCharge: e.target.value })}
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 text-black bg-white"
                        required
                      >
                        <option value="" disabled>Sélectionner un lieu</option>
                        {LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de retour</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <select
                        value={reservation.lieuRetour}
                        onChange={(e) => setReservation({ ...reservation, lieuRetour: e.target.value })}
                        className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 text-black bg-white"
                        required
                      >
                        <option value="" disabled>Sélectionner un lieu</option>
                        {LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleVerifierDisponibilite}
                  disabled={verificationEnCours}
                  className="w-full bg-primary-900 text-white py-3 rounded-lg hover:bg-primary-800 transition-colors"
                >
                  {verificationEnCours ? 'Vérification...' : 'Vérifier la disponibilité et continuer'}
                </button>
              </div>
            )}

            {/* Step 2: Options */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold font-serif text-primary-900">2. Paiement & Kilométrage</h2>
                
                {/* Type de paiement */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-primary-900">Type de paiement</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className={`p-4 rounded-lg border cursor-pointer transition-all ${paymentType === 'ONLINE' ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : 'border-gray-200 hover:border-gold-300'}`}>
                      <input
                        type="radio"
                        name="payment_type"
                        className="sr-only"
                        checked={paymentType === 'ONLINE'}
                        onChange={() => { setPaymentType('ONLINE'); setReservation(prev => ({ ...prev, modePaiement: 'EN_LIGNE' })); }}
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
                        onChange={() => { setPaymentType('AGENCE'); setReservation(prev => ({ ...prev, modePaiement: 'EN_AGENCE' })); }}
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
                
                {/* Kilométrage */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-primary-900">Kilométrage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className={`p-4 rounded-lg border cursor-pointer transition-all ${mileageOption === 'INCLUDED_340' ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : 'border-gray-200 hover:border-gold-300'}`}>
                      <input
                        type="radio"
                        name="mileage_option"
                        className="sr-only"
                        checked={mileageOption === 'INCLUDED_340'}
                        onChange={() => setMileageOption('INCLUDED_340')}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className={`h-5 w-5 ${mileageOption === 'INCLUDED_340' ? 'text-gold-600' : 'text-gray-400'}`} />
                          <span className="font-medium text-primary-800">340 km inclus</span>
                        </div>
                        <span className="text-sm text-primary-600">Au-delà: facturation standard</span>
                      </div>
                    </label>
                    <label className={`p-4 rounded-lg border cursor-pointer transition-all ${mileageOption === 'UNLIMITED' ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : 'border-gray-200 hover:border-gold-300'}`}>
                      <input
                        type="radio"
                        name="mileage_option"
                        className="sr-only"
                        checked={mileageOption === 'UNLIMITED'}
                        onChange={() => setMileageOption('UNLIMITED')}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Car className={`h-5 w-5 ${mileageOption === 'UNLIMITED' ? 'text-gold-600' : 'text-gray-400'}`} />
                          <span className="font-medium text-primary-800">Kilométrage illimité</span>
                        </div>
                        <span className="text-sm text-primary-600">+50 MAD / jour</span>
                      </div>
                    </label>
                  </div>
                  {mileageOption === 'UNLIMITED' && (
                    <div className="bg-gold-50 border border-gold-200 rounded-lg p-3 text-sm text-gold-800">
                      Kilométrage illimité: +50 MAD / jour.
                    </div>
                  )}
                </div>
                
                {/* Anciennes options (Chauffeur & Assurance) */}
                <h3 className="font-semibold text-lg text-primary-900">Options et Services</h3>
                {/* Chauffeur Option */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-6 w-6 text-gold-500" />
                    <div>
                      <h3 className="font-semibold text-primary-900">Chauffeur Privé</h3>
                      <p className="text-sm text-gray-600">Profitez d'un voyage sans stress avec nos chauffeurs professionnels.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-primary-900">+300 DH/jour</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={reservation.optionChauffeur} 
                        onChange={(e) => setReservation({...reservation, optionChauffeur: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                    </label>
                  </div>
                </div>

                {/* Assurance Options */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-primary-900">Protection et Assurance</h3>
                  {['basique', 'complete', 'premium'].map((type) => (
                    <div key={type} 
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${reservation.assurance === type ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : 'border-gray-200 hover:border-gold-300'}`}
                      onClick={() => setReservation({...reservation, assurance: type})}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Shield className={`h-5 w-5 ${reservation.assurance === type ? 'text-gold-600' : 'text-gray-400'}`} />
                          <span className="capitalize font-medium text-primary-800">{type}</span>
                        </div>
                        <span className="font-bold text-primary-900">
                          {type === 'basique' ? '+50' : type === 'complete' ? '+100' : '+150'} DH/jour
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 rounded-lg text-primary-900">Retour</button>
                  <button onClick={() => setStep(3)} className="flex-grow bg-primary-900 text-white py-2 rounded-lg hover:bg-primary-800 transition-colors">Continuer</button>
                </div>
              </div>
            )}

            {/* Step 3: Info & OCR */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold font-serif text-primary-900">3. Vos Informations</h2>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Nom *" value={reservation.nom} onChange={e => setReservation({...reservation, nom: e.target.value})} className="p-3 border rounded-lg text-black" required />
                  <input type="text" placeholder="Prénom *" value={reservation.prenom} onChange={e => setReservation({...reservation, prenom: e.target.value})} className="p-3 border rounded-lg text-black" required />
                  <input type="email" placeholder="Email *" value={reservation.email} onChange={e => setReservation({...reservation, email: e.target.value})} className="p-3 border rounded-lg text-black" required />
                  <input type="tel" placeholder="Téléphone *" value={reservation.telephone} onChange={e => setReservation({...reservation, telephone: e.target.value})} className="p-3 border rounded-lg text-black" required />
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setStep(2)} className="px-6 py-2 border border-gray-300 rounded-lg text-primary-900">Retour</button>
                  <button 
                    onClick={() => {
                      if (!reservation.nom || !reservation.prenom || !reservation.email || !reservation.telephone) {
                        alert('Veuillez remplir les champs Nom, Prénom, Email et Téléphone.');
                        return;
                      }
                      setStep(4);
                    }} 
                    className="flex-grow bg-primary-900 text-white py-2 rounded-lg hover:bg-primary-800 transition-colors"
                  >
                    Continuer
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Points de Fidélité */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold font-serif text-primary-900">4. Points de Fidélité (Optionnel)</h2>
                
                {user && user.pointsFidelite > 0 ? (
                  <div className="bg-gold-50 border border-gold-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Gift className="h-6 w-6 text-gold-600" />
                      <h3 className="font-bold text-gold-900">Utilisez vos points de fidélité</h3>
                    </div>
                    <p className="text-gold-800 mb-4">
                      Vous avez <span className="font-bold">{user.pointsFidelite} points</span> disponibles. 
                      Chaque point vaut 5 MAD de réduction.
                    </p>
                    
                    <div className="bg-white rounded-lg p-4 border border-gold-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">Utiliser mes points de fidélité</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={utiliserPoints} 
                            onChange={(e) => setUtiliserPoints(e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-600"></div>
                        </label>
                      </div>
                      
                      {utiliserPoints && (
                        <div className="text-sm text-gold-700 bg-gold-100 p-3 rounded-lg">
                          <p>
                            Points utilisés: <span className="font-bold">
                              {Math.min(user.pointsFidelite, Math.floor(prixTotal / 5))} points
                            </span>
                          </p>
                          <p>
                            Réduction: <span className="font-bold">
                              -{formatPrice(Math.min(user.pointsFidelite, Math.floor(prixTotal / 5)) * 5)}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                    <Gift className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-600 mb-2">Aucun point de fidélité disponible</h3>
                    <p className="text-gray-500">
                      Effectuez des réservations pour gagner des points et bénéficier de réductions futures !
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setStep(3)} className="px-6 py-2 border border-gray-300 rounded-lg text-primary-900">Retour</button>
                  <button 
                    onClick={handleReservation}
                    disabled={reservationEnCours}
                    className="flex-grow bg-primary-900 text-white py-2 rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50"
                  >
                    {reservationEnCours ? 'Création...' : 'Créer la réservation'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Payment */}
            {step === 5 && createdBookingId && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold font-serif text-primary-900">5. Paiement</h2>
                
                {/* Récapitulatif de la réservation */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Réservation créée avec succès</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Réservation #{createdBookingId} - Montant à payer: <span className="font-semibold">{formatPrice(prixTotal)}</span>
                  </p>
                </div>

                {/* Points de fidélité */}
                {user && user.pointsFidelite > 0 && (
                  <div className="flex items-center justify-between bg-gold-50 p-4 rounded-lg border border-gold-200">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-gold-600" />
                      <span className="font-medium text-gold-900">Utiliser mes points de fidélité ({user.pointsFidelite} pts)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={utiliserPoints} onChange={(e) => setUtiliserPoints(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-600"></div>
                    </label>
                  </div>
                )}

                {/* Composant de paiement CMI */}
                <PaymentProcessor
                  bookingId={createdBookingId}
                  amount={prixTotal}
                  currency="MAD"
                  onSuccess={(paymentData) => {
                    console.log('Paiement réussi:', paymentData);
                    // La redirection sera gérée par le composant PaymentProcessor
                  }}
                  onError={(error) => {
                    console.error('Erreur de paiement:', error);
                    alert('Erreur lors du paiement: ' + error);
                  }}
                />

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => {
                      setStep(4);
                      setCreatedBookingId(null);
                    }} 
                    className="px-6 py-2 border border-gray-300 rounded-lg text-primary-900"
                  >
                    Retour
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h3 className="text-xl font-bold font-serif mb-4 text-black">Récapitulatif</h3>
              
              <div className="mb-4">
                <img
                  src={`/cars/${voiture.id}.jpg`}
                  alt={voiture.modele}
                  onError={(e) => (e.currentTarget.src = '/cars/default.jpg')}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
                <h4 className="font-bold text-lg text-black">{voiture.marque} {voiture.modele}</h4>
              </div>

              <div className="space-y-3 text-sm text-black border-t pt-4">
                <div className="flex justify-between">
                  <span>Prix par jour</span>
                  <span className="text-black font-medium">{formatPrice(voiture.prix_par_jour || voiture.prixParJour || 0)}</span>
                </div>
                {reservation.dateDebut && reservation.dateFin && (
                  <div className="flex justify-between">
                    <span>Durée</span>
                    <span className="text-black font-medium">{calculerNombreJours(reservation.dateDebut, reservation.dateFin)} jours</span>
                  </div>
                )}
                {reservation.assurance !== 'basique' && (
                  <div className="flex justify-between text-gold-700">
                    <span>Assurance {reservation.assurance}</span>
                    <span className="font-medium">+{reservation.assurance === 'complete' ? 100 : 150} DH/j</span>
                  </div>
                )}
                {reservation.optionChauffeur && (
                  <div className="flex justify-between text-gold-700">
                    <span>Chauffeur privé</span>
                    <span className="font-medium">+300 DH/j</span>
                  </div>
                )}
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center font-bold text-xl text-black">
                    <span>Total</span>
                    <span className="text-black">{formatPrice(prixTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
