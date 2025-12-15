'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Plus, Edit, Trash2, Car, Upload, X, FileText, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

interface Voiture {
  id: number;
  marque: string;
  modele: string;
  annee: number;
  immatriculation: string;
  couleur: string;
  type_carburant: string;
  transmission: string;
  nombre_places: number;
  nombre_portes: number;
  climatisation: boolean;
  gps: boolean;
  images: string[];
  prix_par_jour: number;
  caution: number;
  statut: string;
  ville: string;
  agence_nom?: string;
  agence_ville?: string;
  agence_adresse?: string;
  agence_telephone?: string;
  caracteristiques: string[];
  description?: string;
}

interface Reservation {
  id: number;
  dateDebut: string;
  dateFin: string;
  prixTotal: number;
  statut: string;
  user: {
    nom: string;
    prenom: string;
    email: string;
  };
  voiture: {
    marque: string;
    modele: string;
    immatriculation: string;
  };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'voitures' | 'reservations'>('voitures');
  const [voitures, setVoitures] = useState<Voiture[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVoiture, setEditingVoiture] = useState<Voiture | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const user = localStorage.getItem('user');
      if (!user) {
        router.push('/connexion');
        return;
      }
      const userData = JSON.parse(user);
      if (userData.role !== 'admin') {
        router.push('/');
        return;
      }
      
      if (activeTab === 'voitures') {
        await chargerVoitures();
      } else {
        await chargerReservations();
      }
    };
    checkAdmin();
  }, [router, activeTab]);

  const chargerReservations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await axios.get(`${apiUrl}/reservations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReservations(response.data);
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const chargerVoitures = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      console.log('🔍 Admin - Chargement des voitures depuis:', apiUrl);
      const response = await axios.get(`${apiUrl}/voitures`);
      console.log('✅ Admin - Voitures chargées:', response.data.length);
      setVoitures(response.data);
    } catch (error) {
      console.error('❌ Admin - Erreur lors du chargement des voitures:', error);
    } finally {
      setLoading(false);
    }
  };

  const supprimerVoiture = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette voiture ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      await axios.delete(`${apiUrl}/voitures/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Voiture supprimée avec succès !');
      chargerVoitures();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la voiture');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      await axios.put(`${apiUrl}/reservations/${id}/statut`, 
        { statut: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      chargerReservations();
    } catch (error) {
      console.error('Erreur status:', error);
      alert('Erreur mise à jour statut');
    }
  };

  const handleEdit = (voiture: Voiture) => {
    setEditingVoiture(voiture);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingVoiture(null);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Administration</h1>
            <div className="flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('voitures')}
                className={`pb-4 px-4 font-medium flex items-center gap-2 ${activeTab === 'voitures' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Car className="h-5 w-5" />
                Gestion des Voitures
              </button>
              <button
                onClick={() => setActiveTab('reservations')}
                className={`pb-4 px-4 font-medium flex items-center gap-2 ${activeTab === 'reservations' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileText className="h-5 w-5" />
                Gestion des Contrats
              </button>
            </div>
          </div>
          
          {activeTab === 'voitures' && (
            <div className="flex justify-end mb-6">
              <button
                onClick={handleAdd}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Ajouter une voiture</span>
              </button>
            </div>
          )}

          {showForm && (
            <FormVoiture
              voiture={editingVoiture}
              onClose={() => {
                setShowForm(false);
                setEditingVoiture(null);
              }}
              onSuccess={() => {
                setShowForm(false);
                setEditingVoiture(null);
                chargerVoitures();
              }}
            />
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {activeTab === 'voitures' ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Voiture
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Immatriculation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix/Jour
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {voitures.map((voiture) => (
                      <tr key={voiture.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {voiture.images && voiture.images.length > 0 ? (
                              <img
                                src={voiture.images[0]}
                                alt={`${voiture.marque} ${voiture.modele}`}
                                className="h-12 w-16 object-cover rounded"
                              />
                            ) : (
                              <div className="h-12 w-16 bg-gray-200 rounded flex items-center justify-center">
                                <Car className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {voiture.marque} {voiture.modele}
                              </div>
                              <div className="text-sm text-gray-500">{voiture.annee}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {voiture.immatriculation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {voiture.prix_par_jour} MAD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            voiture.statut === 'disponible' ? 'bg-green-100 text-green-800' :
                            voiture.statut === 'louée' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {voiture.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(voiture)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => supprimerVoiture(voiture.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voiture</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reservations.map((reservation) => (
                      <tr key={reservation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{reservation.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reservation.voiture ? (
                            <div>
                              <div className="font-medium">{reservation.voiture.marque} {reservation.voiture.modele}</div>
                              <div className="text-xs text-gray-500">{reservation.voiture.immatriculation}</div>
                            </div>
                          ) : (
                            <span className="text-red-500">Voiture supprimée</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reservation.user ? (
                            <div>
                              <div className="font-medium">{reservation.user.prenom} {reservation.user.nom}</div>
                              <div className="text-xs text-gray-500">{reservation.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-red-500">Utilisateur supprimé</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{new Date(reservation.dateDebut).toLocaleDateString('fr-FR')}</div>
                          <div className="text-xs text-gray-500">au</div>
                          <div>{new Date(reservation.dateFin).toLocaleDateString('fr-FR')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{reservation.prixTotal} MAD</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            reservation.statut === 'validée' ? 'bg-green-100 text-green-800' :
                            reservation.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                            reservation.statut === 'terminée' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {reservation.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {reservation.statut === 'en_attente' && (
                            <>
                              <button onClick={() => handleStatusChange(reservation.id, 'validée')} className="text-green-600 hover:text-green-900 p-1 bg-green-50 rounded" title="Valider">
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              <button onClick={() => handleStatusChange(reservation.id, 'annulée')} className="text-red-600 hover:text-red-900 p-1 bg-red-50 rounded" title="Refuser">
                                <XCircle className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          {reservation.statut === 'validée' && (
                            <button onClick={() => handleStatusChange(reservation.id, 'terminée')} className="text-blue-600 hover:text-blue-900 p-1 bg-blue-50 rounded" title="Marquer comme terminée">
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          {reservation.statut === 'annulée' && (
                             <span className="text-gray-400">Annulée</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {reservations.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          Aucune réservation trouvée
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Composant de formulaire pour ajouter/modifier une voiture
function FormVoiture({ voiture, onClose, onSuccess }: {
  voiture: Voiture | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    marque: voiture?.marque || '',
    modele: voiture?.modele || '',
    annee: voiture?.annee || new Date().getFullYear(),
    immatriculation: voiture?.immatriculation || '',
    couleur: voiture?.couleur || '',
    type_carburant: voiture?.type_carburant || 'Essence',
    transmission: voiture?.transmission || 'Manuelle',
    nombre_places: voiture?.nombre_places || 5,
    nombre_portes: voiture?.nombre_portes || 4,
    climatisation: voiture?.climatisation ?? true,
    gps: voiture?.gps ?? false,
    images: voiture?.images?.join(', ') || '',
    prix_par_jour: voiture?.prix_par_jour || 0,
    caution: voiture?.caution || 0,
    statut: voiture?.statut || 'disponible',
    agence_nom: voiture?.agence_nom || '',
    agence_ville: voiture?.agence_ville || '',
    agence_adresse: voiture?.agence_adresse || '',
    agence_telephone: voiture?.agence_telephone || '',
    caracteristiques: voiture?.caracteristiques?.join(', ') || '',
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>(voiture?.images || []);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const response = await axios.post(`${apiUrl}/upload/single`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        // The backend returns a relative path like /uploads/filename.jpg
        // We need to prepend the API base URL (or static server URL)
        // Since we are proxying /uploads via API Gateway (port 8000), we can use localhost:8000
        return `http://localhost:8000${response.data.url}`;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedImages([...uploadedImages, ...urls]);
      setFormData({ ...formData, images: [...uploadedImages, ...urls].join(', ') });
      alert('Images uploadées avec succès !');
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload des images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setFormData({ ...formData, images: newImages.join(', ') });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      images: formData.images.split(',').map(img => img.trim()).filter(img => img),
      caracteristiques: formData.caracteristiques.split(',').map(c => c.trim()).filter(c => c),
    };

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      if (voiture) {
        // Modification
        await axios.put(`${apiUrl}/voitures/${voiture.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Voiture modifiée avec succès !');
      } else {
        // Ajout
        await axios.post(`${apiUrl}/voitures`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Voiture ajoutée avec succès !');
      }
      onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement de la voiture');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 my-8">
        <h2 className="text-2xl font-bold mb-6">
          {voiture ? 'Modifier la voiture' : 'Ajouter une voiture'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marque *</label>
              <input
                type="text"
                required
                value={formData.marque}
                onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modèle *</label>
              <input
                type="text"
                required
                value={formData.modele}
                onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Année *</label>
              <input
                type="number"
                required
                value={formData.annee}
                onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Immatriculation *</label>
              <input
                type="text"
                required
                value={formData.immatriculation}
                onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Couleur *</label>
              <input
                type="text"
                required
                value={formData.couleur}
                onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de carburant *</label>
              <select
                required
                value={formData.type_carburant}
                onChange={(e) => setFormData({ ...formData, type_carburant: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="Essence">Essence</option>
                <option value="Diesel">Diesel</option>
                <option value="Électrique">Électrique</option>
                <option value="Hybride">Hybride</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transmission *</label>
              <select
                required
                value={formData.transmission}
                onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="Manuelle">Manuelle</option>
                <option value="Automatique">Automatique</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de places *</label>
              <input
                type="number"
                required
                min="2"
                max="9"
                value={formData.nombre_places}
                onChange={(e) => setFormData({ ...formData, nombre_places: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de portes *</label>
              <input
                type="number"
                required
                min="2"
                max="5"
                value={formData.nombre_portes}
                onChange={(e) => setFormData({ ...formData, nombre_portes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix par jour (MAD) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.prix_par_jour}
                onChange={(e) => setFormData({ ...formData, prix_par_jour: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caution (MAD) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.caution}
                onChange={(e) => setFormData({ ...formData, caution: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut *</label>
              <select
                required
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="disponible">Disponible</option>
                <option value="louée">Louée</option>
                <option value="maintenance">Maintenance</option>
                <option value="indisponible">Indisponible</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.climatisation}
                  onChange={(e) => setFormData({ ...formData, climatisation: e.target.checked })}
                  className="mr-2"
                />
                Climatisation
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.gps}
                  onChange={(e) => setFormData({ ...formData, gps: e.target.checked })}
                  className="mr-2"
                />
                GPS
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images de la voiture
            </label>
            
            {/* Bouton d'upload */}
            <div className="mb-4">
              <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                <Upload className="h-5 w-5 mr-2 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {uploading ? 'Upload en cours...' : 'Cliquez pour uploader des images depuis votre PC'}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Aperçu des images */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Option pour ajouter des URLs manuellement */}
            <details className="mt-2">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-primary-600">
                Ou ajouter des URLs d'images manuellement
              </summary>
              <textarea
                value={formData.images}
                onChange={(e) => {
                  setFormData({ ...formData, images: e.target.value });
                  setUploadedImages(e.target.value.split(',').map(img => img.trim()).filter(img => img));
                }}
                rows={2}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              />
            </details>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caractéristiques (séparées par des virgules)
            </label>
            <textarea
              value={formData.caracteristiques}
              onChange={(e) => setFormData({ ...formData, caracteristiques: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Climatisation, GPS, Radio, Bluetooth"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Agence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'agence</label>
                <input
                  type="text"
                  value={formData.agence_nom}
                  onChange={(e) => setFormData({ ...formData, agence_nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                <input
                  type="text"
                  value={formData.agence_ville}
                  onChange={(e) => setFormData({ ...formData, agence_ville: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                <input
                  type="text"
                  value={formData.agence_adresse}
                  onChange={(e) => setFormData({ ...formData, agence_adresse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input
                  type="text"
                  value={formData.agence_telephone}
                  onChange={(e) => setFormData({ ...formData, agence_telephone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {voiture ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
