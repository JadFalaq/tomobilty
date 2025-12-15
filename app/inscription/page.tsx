'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { authAPI } from '@/lib/api';
import { UserPlus, Check } from 'lucide-react';

export default function InscriptionPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    confirmMotDePasse: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.motDePasse !== formData.confirmMotDePasse) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setLoading(true);
      const { confirmMotDePasse, ...dataToSend } = formData;
      const response = await authAPI.inscription(dataToSend);
      
      setSuccess(true);
      if (response.data.previewUrl) {
        setPreviewUrl(response.data.previewUrl);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-primary-950">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-md w-full relative z-10">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 ring-1 ring-white/10 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-6 shadow-inner">
                <Check className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-primary-900 mb-4">Inscription Réussie</h2>
              <p className="text-primary-600 mb-8">
                Votre compte a été créé avec succès. Veuillez vérifier votre boîte de réception pour activer votre compte.
              </p>
              
              {previewUrl && (
                <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                  <p className="text-xs font-bold text-yellow-800 uppercase mb-2">Mode Développement</p>
                  <p className="text-sm text-yellow-700 break-all">
                    Lien de vérification (Ethereal): <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-900">Ouvrir l'email</a>
                  </p>
                </div>
              )}

              <Link 
                href="/connexion"
                className="inline-flex items-center justify-center w-full px-6 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Aller à la connexion
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-primary-950">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute inset-0 bg-grain-pattern opacity-10 pointer-events-none"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-800/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full relative z-10">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 ring-1 ring-white/10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-50 rounded-full mb-6 shadow-inner">
                <UserPlus className="h-10 w-10 text-gold-500" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-primary-900">Rejoignez l'Excellence</h2>
              <p className="mt-3 text-primary-600">
                Créez votre compte Tomobilty et accédez à une expérience exclusive.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label htmlFor="nom" className="block text-xs font-bold text-primary-700 uppercase tracking-wider mb-2">
                    Nom
                  </label>
                  <input
                    id="nom"
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-primary-900 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="prenom" className="block text-xs font-bold text-primary-700 uppercase tracking-wider mb-2">
                    Prénom
                  </label>
                  <input
                    id="prenom"
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-primary-900 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-primary-700 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-primary-50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-primary-900 transition-all"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label htmlFor="telephone" className="block text-xs font-bold text-primary-700 uppercase tracking-wider mb-2">
                  Téléphone
                </label>
                <input
                  id="telephone"
                  type="tel"
                  required
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-3 bg-primary-50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-primary-900 transition-all"
                  placeholder="+212 6XX-XXXXXX"
                />
              </div>

              <div>
                <label htmlFor="motDePasse" className="block text-xs font-bold text-primary-700 uppercase tracking-wider mb-2">
                  Mot de passe
                </label>
                <input
                  id="motDePasse"
                  type="password"
                  required
                  value={formData.motDePasse}
                  onChange={(e) => setFormData({ ...formData, motDePasse: e.target.value })}
                  className="w-full px-4 py-3 bg-primary-50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-primary-900 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirmMotDePasse" className="block text-xs font-bold text-primary-700 uppercase tracking-wider mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmMotDePasse"
                  type="password"
                  required
                  value={formData.confirmMotDePasse}
                  onChange={(e) => setFormData({ ...formData, confirmMotDePasse: e.target.value })}
                  className="w-full px-4 py-3 bg-primary-50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-primary-900 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold hover:bg-gold-600 transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-primary-900/20 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Inscription en cours...' : 'Créer mon compte'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-primary-600">
                Vous avez déjà un compte ?{' '}
                <Link href="/connexion" className="text-gold-600 hover:text-gold-700 font-bold hover:underline">
                  Connectez-vous
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}