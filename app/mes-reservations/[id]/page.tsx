'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Footer from '@/components/Footer';
import { reservationsAPI } from '@/lib/api';
import { formatDate, formatPrice, getStatutBadgeColor, getStatutLabel } from '@/lib/utils';

export default function ReservationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/connexion?redirect=/mes-reservations/' + id);
      return;
    }
    charger();
  }, [id]);

  const charger = async () => {
    try {
      setLoading(true);
      const res = await reservationsAPI.obtenirReservationParId(id);
      setBooking(res.data.data.booking);
      setError(null);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const annuler = async () => {
    if (!confirm('Confirmer l’annulation ?')) return;
    try {
      await reservationsAPI.annulerReservation(id);
      router.push('/mes-reservations');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur lors de l’annulation');
    }
  };

  const telecharger = async () => {
    try {
      const res = await reservationsAPI.telechargerFacture(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Facture non disponible');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-800">Chargement...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
            <p className="text-primary-800">Contactez le support</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const statutName = booking.status?.name;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow bg-cream-50 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-primary-900 font-serif">Détail de la réservation #{booking.id}</h1>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${getStatutBadgeColor(statutName)}`}>
              {getStatutLabel(statutName)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-primary-100 p-6">
              <h2 className="font-serif text-xl font-bold text-primary-900 mb-4">Voiture</h2>
              <p className="text-primary-800">{booking.car?.brand?.name} {booking.car?.modele}</p>
              <p className="text-primary-700 text-sm">{booking.car?.category?.name}</p>
            </div>

            <div className="bg-white rounded-xl border border-primary-100 p-6">
              <h2 className="font-serif text-xl font-bold text-primary-900 mb-4">Dates</h2>
              <p className="text-primary-800">{formatDate(booking.date_debut)} - {formatDate(booking.date_fin)}</p>
            </div>

            <div className="bg-white rounded-xl border border-primary-100 p-6">
              <h2 className="font-serif text-xl font-bold text-primary-900 mb-4">Montant</h2>
              <p className="text-primary-900 font-serif text-2xl">{formatPrice(booking.prix_total)}</p>
              <p className="text-primary-700 text-sm mt-1">{booking.is_paid ? 'Payé' : 'Non payé'}</p>
            </div>

            <div className="bg-white rounded-xl border border-primary-100 p-6">
              <h2 className="font-serif text-xl font-bold text-primary-900 mb-4">Options</h2>
              {booking.protection && <p className="text-primary-800">Protection: {booking.protection.name}</p>}
              {booking.km_option && <p className="text-primary-800">Option KM: {booking.km_option}</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-primary-100 p-6 mt-6">
            <h2 className="font-serif text-xl font-bold text-primary-900 mb-4">Détails de facturation</h2>
            <ul className="space-y-2">
              {(booking.breakdown_lines || []).map((l: any, idx: number) => (
                <li key={idx} className="flex justify-between">
                  <span className="text-primary-800">{l.description || l.code}</span>
                  <span className="text-primary-900">{formatPrice(l.amount || 0)}</span>
                </li>
              ))}
            </ul>
            <p className="text-primary-800 mt-2">Caution: {formatPrice(booking.caution_amount || 0)}</p>
          </div>

          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={() => router.push('/mes-reservations')}
              className="px-5 py-2 rounded-full border border-primary-200"
            >
              Retour
            </button>
            {statutName === 'EN_ATTENTE' && (
              <button
                onClick={annuler}
                className="px-5 py-2 rounded-full border border-red-200 text-red-600"
              >
                Annuler
              </button>
            )}
            {booking.has_invoice && (
              <button
                onClick={telecharger}
                className="px-5 py-2 rounded-full bg-primary-900 text-white"
              >
                Télécharger facture
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
