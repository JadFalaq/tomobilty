'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/Footer';
import { User, Mail, Phone, MapPin, CreditCard, Edit, Save, Gift } from 'lucide-react';
import { authAPI } from '@/lib/api';

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    adresse: {
      rue: '',
      ville: '',
      codePostal: '',
      pays: 'Maroc'
    },
    permisConduire: {
      numero: '',
      dateExpiration: ''
    }
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/connexion?redirect=/profil');
          return;
        }

        // Charger les données fraîches depuis l'API
        const response = await authAPI.obtenirProfil();
        const userData = response.data.data.user;
        
        setUser(userData);
        // Mettre à jour le localStorage
        localStorage.setItem('user', JSON.stringify(userData));

        setFormData({
          nom: userData.nom || '',
          prenom: userData.prenom || '',
          telephone: userData.telephone || '',
          adresse: userData.adresse || {
            rue: '',
            ville: '',
            codePostal: '',
            pays: 'Maroc'
          },
          permisConduire: userData.permisConduire || {
            numero: '',
            dateExpiration: ''
          }
        });
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        // Fallback sur localStorage si l'API échoue
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setFormData({
            nom: parsedUser.nom || '',
            prenom: parsedUser.prenom || '',
            telephone: parsedUser.telephone || '',
            adresse: parsedUser.adresse || {
              rue: '',
              ville: '',
              codePostal: '',
              pays: 'Maroc'
            },
            permisConduire: parsedUser.permisConduire || {
              numero: '',
              dateExpiration: ''
            }
          });
        } else {
          router.push('/connexion');
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await authAPI.mettreAJourProfil(formData);
      
      // Mettre à jour les données locales
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      setUser(response.data);
      setEditing(false);
      alert('Profil mis à jour avec succès !');
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* En-tête du profil */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white rounded-full p-4">
                    <User className="h-12 w-12 text-primary-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{user?.prenom} {user?.nom}</h1>
                    <p className="text-primary-100">{user?.email}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      user?.role === 'admin' ? 'bg-yellow-400 text-yellow-900' : 'bg-green-400 text-green-900'
                    }`}>
                      {user?.role === 'admin' ? 'Administrateur' : 'Client'}
                    </span>
                    {user?.pointsFidelite !== undefined && (
                      <span className="inline-block mt-2 ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-gold-500 text-white shadow-sm">
                        <span className="flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          {user.pointsFidelite} points
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors flex items-center space-x-2"
                >
                  {editing ? (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Annuler</span>
                    </>
                  ) : (
                    <>
                      <Edit className="h-5 w-5" />
                      <span>Modifier</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Contenu du profil */}
            <div className="p-6">
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 !text-black" style={{ color: '#000000' }}>
                        Nom
                      </label>
                      <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-black bg-white !text-black !bg-white"
                        style={{ color: '#000000', backgroundColor: '#ffffff', opacity: 1 }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2 !text-black" style={{ color: '#000000' }}>
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={formData.prenom}
                        onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-black bg-white !text-black !bg-white"
                        style={{ color: '#000000', backgroundColor: '#ffffff', opacity: 1 }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2 !text-black" style={{ color: '#000000' }}>
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-black bg-white !text-black !bg-white"
                        style={{ color: '#000000', backgroundColor: '#ffffff', opacity: 1 }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2 !text-black" style={{ color: '#000000' }}>
                        Ville
                      </label>
                      <input
                        type="text"
                        value={formData.adresse.ville}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          adresse: { ...formData.adresse, ville: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-black bg-white !text-black !bg-white"
                        style={{ color: '#000000', backgroundColor: '#ffffff', opacity: 1 }}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black mb-2 !text-black" style={{ color: '#000000' }}>
                        Adresse
                      </label>
                      <input
                        type="text"
                        value={formData.adresse.rue}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          adresse: { ...formData.adresse, rue: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-black bg-white !text-black !bg-white"
                        style={{ color: '#000000', backgroundColor: '#ffffff', opacity: 1 }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2 !text-black" style={{ color: '#000000' }}>
                        Numéro de permis
                      </label>
                      <input
                        type="text"
                        value={formData.permisConduire.numero}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          permisConduire: { ...formData.permisConduire, numero: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-black bg-white !text-black !bg-white"
                        style={{ color: '#000000', backgroundColor: '#ffffff', opacity: 1 }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2 !text-black" style={{ color: '#000000' }}>
                        Date d'expiration du permis
                      </label>
                      <input
                        type="date"
                        value={formData.permisConduire.dateExpiration}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          permisConduire: { ...formData.permisConduire, dateExpiration: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-black bg-white !text-black !bg-white"
                        style={{ color: '#000000', backgroundColor: '#ffffff', opacity: 1 }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-black"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                    >
                      {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Nom complet</p>
                        <p className="font-medium text-black">{user?.prenom} {user?.nom}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-black">{user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="font-medium text-black">{user?.telephone || 'Non renseigné'}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Ville</p>
                        <p className="font-medium text-black">{user?.adresse?.ville || 'Non renseigné'}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 md:col-span-2">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Adresse</p>
                        <p className="font-medium text-black">{user?.adresse?.rue || 'Non renseigné'}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Numéro de permis</p>
                        <p className="font-medium text-black">{user?.permisConduire?.numero || 'Non renseigné'}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Expiration du permis</p>
                        <p className="font-medium text-black">
                          {user?.permisConduire?.dateExpiration 
                            ? new Date(user.permisConduire.dateExpiration).toLocaleDateString('fr-FR')
                            : 'Non renseigné'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
