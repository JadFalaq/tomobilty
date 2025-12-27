'use client';

import Footer from '@/components/Footer';

export default function ConditionsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-primary-900 text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grain-pattern opacity-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Conditions Générales</h1>
            <p className="text-xl text-primary-200 max-w-2xl mx-auto">
              Les règles et conditions d'utilisation de nos services de location.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-cream-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg border border-gray-100 prose prose-lg max-w-none text-gray-700">
              
              <h3 className="text-2xl font-serif font-bold text-primary-900 mb-4">1. Conditions de Location</h3>
              <p className="mb-6">
                Le locataire doit être âgé d'au moins 21 ans et être titulaire d'un permis de conduire valide depuis plus de 2 ans.
                Une pièce d'identité valide (CIN ou Passeport) est obligatoire lors de la prise en charge du véhicule.
              </p>

              <h3 className="text-2xl font-serif font-bold text-primary-900 mb-4">2. Réservation et Paiement</h3>
              <p className="mb-6">
                La réservation est confirmée après paiement d'un acompte ou de la totalité du montant de la location.
                Le paiement peut être effectué en ligne par carte bancaire ou sur place.
                Une caution est exigée au moment de la prise en charge du véhicule.
              </p>

              <h3 className="text-2xl font-serif font-bold text-primary-900 mb-4">3. Utilisation du Véhicule</h3>
              <p className="mb-6">
                Le véhicule doit être utilisé en "bon père de famille". Il est interdit de sous-louer le véhicule ou de l'utiliser pour le transport de personnes ou de marchandises à titre onéreux (sauf accord spécifique).
                L'utilisation du véhicule hors du territoire marocain est soumise à une autorisation écrite préalable.
              </p>

              <h3 className="text-2xl font-serif font-bold text-primary-900 mb-4">4. Assurances</h3>
              <p className="mb-6">
                Nos véhicules sont couverts par une assurance "Tous Risques" avec franchise.
                En cas d'accident responsable, la franchise reste à la charge du locataire.
                Le vol et l'incendie sont couverts, sous réserve de la restitution des clés et des documents du véhicule.
              </p>

              <h3 className="text-2xl font-serif font-bold text-primary-900 mb-4">5. Annulation</h3>
              <p className="mb-6">
                Toute annulation doit être effectuée au moins 48 heures avant la date de début de location pour bénéficier d'un remboursement intégral.
                En cas d'annulation tardive, des frais peuvent s'appliquer.
              </p>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
