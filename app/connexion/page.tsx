'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { authAPI } from '@/lib/api';
import { LogIn, Lock } from 'lucide-react';

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [formData, setFormData] = useState({
    email: '',
    motDePasse: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setSuccessMsg('Votre email a été vérifié avec succès. Vous pouvez maintenant vous connecter.');
    }

    const cid = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!cid) return;
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => {
      const w: any = window;
      if (w.google && googleBtnRef.current) {
        w.google.accounts.id.initialize({ client_id: cid, callback: (resp: any) => handleGoogleCredential(resp?.credential) });
        w.google.accounts.id.renderButton(googleBtnRef.current, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'rectangular' });
      }
    };
    document.body.appendChild(s);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      setLoading(true);
      console.log('Tentative de connexion avec:', formData.email);
      
      // Convert camelCase to snake_case for backend
      const loginData = {
        email: formData.email,
        mot_de_passe: formData.motDePasse
      };
      const response = await authAPI.connexion(loginData);
      console.log('Réponse de connexion:', response.data);
      
      localStorage.setItem('token', response.data.data.tokens.access);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      // Redirect based on user role
      const userRole = response.data.data.user.role;
      let redirectUrl = redirect;
      
      if (userRole === 'ADMIN') {
        redirectUrl = '/admin';
        console.log('Admin user detected, redirecting to admin dashboard');
      } else {
        console.log('Regular user, redirecting to:', redirect);
      }

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 100);
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      setError(error.response?.data?.message || 'Erreur lors de la connexion');
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential?: string) => {
    if (!credential) return;
    try {
      setGoogleLoading(true);
      const response = await authAPI.oauthGoogle({ id_token: credential });
      localStorage.setItem('token', response.data.data.tokens.access);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      setTimeout(() => { window.location.href = redirect; }, 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur Google');
      setGoogleLoading(false);
    }
  };

  const handlePhoneStart = async () => {
    try {
      if (!phone) { setError('Téléphone requis'); return; }
      setError('');
      const response = await authAPI.startPhone({ phone });
      if (response.status === 200) setSmsSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur envoi code');
    }
  };

  const handlePhoneVerify = async () => {
    try {
      if (!phone || !code) { setError('Données requises'); return; }
      setError('');
      const response = await authAPI.verifyPhone({ phone, code });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      setTimeout(() => { window.location.href = redirect; }, 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur vérification');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-primary-950">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grain-pattern opacity-10 pointer-events-none"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-800/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full relative z-10">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 ring-1 ring-white/10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-50 rounded-full mb-6 shadow-inner">
                <Lock className="h-10 w-10 text-gold-500" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-primary-900">Bienvenue</h2>
              <p className="mt-3 text-primary-600">
                Connectez-vous pour gérer vos réservations
              </p>
            </div>

            {successMsg && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm flex items-center">
                <span className="mr-2">✅</span> {successMsg}
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="flex items-center justify-between mb-2">
                    <label htmlFor="motDePasse" className="block text-xs font-bold text-primary-700 uppercase tracking-wider">
                    Mot de passe
                    </label>
                    <a href="#" className="text-xs text-gold-600 hover:text-gold-700">Mot de passe oublié?</a>
                </div>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold hover:bg-gold-600 transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-primary-900/20 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-primary-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-primary-400">Ou continuer avec</span>
                </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-center">
                <div ref={googleBtnRef} className="w-full flex justify-center" />
              </div>
              {googleLoading && (
                <div className="mt-2 text-center text-gray-600 text-xs">Connexion Google...</div>
              )}
              
               <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
                 <p className="text-xs text-center text-primary-500 mb-3 font-medium">Connexion par téléphone</p>
                  <div className="grid grid-cols-1 gap-3">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-gold-500 text-sm"
                      placeholder="Numéro de téléphone"
                    />
                    {!smsSent ? (
                      <button onClick={handlePhoneStart} className="w-full bg-primary-200 text-primary-800 py-2 rounded-lg hover:bg-primary-300 transition-colors text-sm font-medium">Envoyer le code</button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="w-1/2 px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-gold-500 text-sm text-center tracking-widest"
                          placeholder="Code"
                        />
                        <button onClick={handlePhoneVerify} className="w-1/2 bg-primary-800 text-white py-2 rounded-lg hover:bg-primary-900 transition-colors text-sm">Vérifier</button>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ConnexionForm />
    </Suspense>
  );
}