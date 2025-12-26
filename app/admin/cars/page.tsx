'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import Table from '@/components/admin/Table';
import api from '@/lib/api';

export default function AdminCars() {
  const [cars, setCars] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [formData, setFormData] = useState({
    brand_id: '',
    category_id: '',
    modele: '',
    annee: new Date().getFullYear(),
    immatriculation: '',
    prix_par_jour: '',
    ville: '',
    type_carburant: 'ESSENCE',
    statut: 'DISPONIBLE',
    disponible: true
  });

  useEffect(() => {
    fetchCars();
    fetchBrands();
    fetchCategories();
  }, [pagination.page]);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/cars', { params: { page: pagination.page, pageSize: pagination.pageSize } });
      setCars(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get('/admin/car-brands', { params: { pageSize: 100 } });
      setBrands(res.data.data.items);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/car-categories', { params: { pageSize: 100 } });
      setCategories(res.data.data.items);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/admin/cars', formData);
      setShowCreateModal(false);
      fetchCars();
    } catch (error) {
      console.error('Error creating car:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/admin/cars/${selectedCar.id}`, formData);
      setShowEditModal(false);
      fetchCars();
    } catch (error) {
      console.error('Error updating car:', error);
    }
  };

  const handleDelete = async (car: any) => {
    if (!confirm(`Supprimer ${car.brand?.name} ${car.modele}?`)) return;
    try {
      await api.delete(`/admin/cars/${car.id}`);
      fetchCars();
    } catch (error) {
      console.error('Error deleting car:', error);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'brand', label: 'Marque', render: (value: any) => value?.name },
    { key: 'modele', label: 'Modèle' },
    { key: 'annee', label: 'Année' },
    { key: 'immatriculation', label: 'Immatriculation' },
    { key: 'prix_par_jour', label: 'Prix/Jour', render: (value: any) => `${value} MAD` },
    { key: 'ville', label: 'Ville' },
    { key: 'statut', label: 'Statut' },
    { key: 'disponible', label: 'Disponible', render: (value: boolean) => value ? '✓' : '✗' }
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">Gestion des Voitures</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-black text-white rounded hover:bg-white hover:text-black border-2 border-black transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Créer une voiture
          </button>
        </div>

        <Table
          columns={columns}
          data={cars}
          onEdit={(car) => {
            setSelectedCar(car);
            setFormData({
              brand_id: car.brand_id,
              category_id: car.category_id,
              modele: car.modele,
              annee: car.annee,
              immatriculation: car.immatriculation,
              prix_par_jour: car.prix_par_jour,
              ville: car.ville,
              type_carburant: car.type_carburant,
              statut: car.statut,
              disponible: car.disponible
            });
            setShowEditModal(true);
          }}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          loading={loading}
        />

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border-4 border-black rounded p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-black">{showCreateModal ? 'Créer' : 'Modifier'} une voiture</h2>
                <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); }} className="text-black">
                  <X size={24} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.brand_id}
                  onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                  className="px-4 py-2 border-2 border-black rounded text-black"
                >
                  <option value="">Sélectionner une marque</option>
                  {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="px-4 py-2 border-2 border-black rounded text-black"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Modèle"
                  value={formData.modele}
                  onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                  className="px-4 py-2 border-2 border-black rounded text-black placeholder-black"
                />
                <input
                  type="number"
                  placeholder="Année"
                  value={formData.annee}
                  onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) })}
                  className="px-4 py-2 border-2 border-black rounded text-black placeholder-black"
                />
                <input
                  type="text"
                  placeholder="Immatriculation"
                  value={formData.immatriculation}
                  onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value })}
                  className="px-4 py-2 border-2 border-black rounded text-black placeholder-black"
                />
                <input
                  type="number"
                  placeholder="Prix par jour"
                  value={formData.prix_par_jour}
                  onChange={(e) => setFormData({ ...formData, prix_par_jour: e.target.value })}
                  className="px-4 py-2 border-2 border-black rounded text-black placeholder-black"
                />
                <input
                  type="text"
                  placeholder="Ville"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  className="px-4 py-2 border-2 border-black rounded text-black placeholder-black"
                />
                <select
                  value={formData.type_carburant}
                  onChange={(e) => setFormData({ ...formData, type_carburant: e.target.value })}
                  className="px-4 py-2 border-2 border-black rounded text-black"
                >
                  <option value="ESSENCE">ESSENCE</option>
                  <option value="DIESEL">DIESEL</option>
                  <option value="ELECTRIQUE">ELECTRIQUE</option>
                  <option value="HYBRIDE">HYBRIDE</option>
                </select>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                  className="px-4 py-2 border-2 border-black rounded text-black"
                >
                  <option value="DISPONIBLE">DISPONIBLE</option>
                  <option value="LOUE">LOUE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="INDISPONIBLE">INDISPONIBLE</option>
                </select>
                <label className="flex items-center px-4 py-2 border-2 border-black rounded text-black">
                  <input
                    type="checkbox"
                    checked={formData.disponible}
                    onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
                    className="mr-2"
                  />
                  Disponible
                </label>
              </div>
              <button
                onClick={showCreateModal ? handleCreate : handleUpdate}
                className="w-full mt-4 px-4 py-2 bg-black text-white rounded hover:bg-white hover:text-black border-2 border-black transition-colors"
              >
                {showCreateModal ? 'Créer' : 'Mettre à jour'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
