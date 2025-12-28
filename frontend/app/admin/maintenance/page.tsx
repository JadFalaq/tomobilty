'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import Table from '@/components/admin/Table';
import api from '@/lib/api';

export default function AdminMaintenance() {
  const [maintenance, setMaintenance] = useState([]);
  const [cars, setCars] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    car_id: '',
    maintenance_type: 'ROUTINE',
    description: '',
    cost: '',
    scheduled_date: '',
    status: 'SCHEDULED'
  });

  useEffect(() => {
    fetchMaintenance();
    fetchCars();
  }, [pagination.page]);

  const fetchMaintenance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/maintenance', { params: { page: pagination.page, pageSize: pagination.pageSize } });
      setMaintenance(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error('Error fetching maintenance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCars = async () => {
    try {
      const res = await api.get('/admin/cars', { params: { pageSize: 100 } });
      setCars(res.data.data.items);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/admin/maintenance', formData);
      setShowCreateModal(false);
      fetchMaintenance();
    } catch (error) {
      console.error('Error creating maintenance:', error);
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Supprimer cette maintenance?')) return;
    try {
      await api.delete(`/admin/maintenance/${item.id}`);
      fetchMaintenance();
    } catch (error) {
      console.error('Error deleting maintenance:', error);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'car', label: 'Voiture', render: (value: any) => `${value?.brand?.name} ${value?.modele}` },
    { key: 'maintenance_type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'cost', label: 'Coût', render: (value: any) => value ? `${Number(value).toFixed(2)} MAD` : '-' },
    { key: 'scheduled_date', label: 'Date Prévue', render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'status', label: 'Statut' }
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">Gestion de la Maintenance</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-black text-white rounded hover:bg-white hover:text-black border-2 border-black transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Planifier une maintenance
          </button>
        </div>

        <Table
          columns={columns}
          data={maintenance}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          loading={loading}
        />

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border-4 border-black rounded p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-black">Planifier une maintenance</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-black">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <select
                  value={formData.car_id}
                  onChange={(e) => setFormData({ ...formData, car_id: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black"
                >
                  <option value="">Sélectionner une voiture</option>
                  {cars.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.brand?.name} {c.modele} - {c.immatriculation}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.maintenance_type}
                  onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black"
                >
                  <option value="ROUTINE">ROUTINE</option>
                  <option value="REPAIR">REPAIR</option>
                  <option value="INSPECTION">INSPECTION</option>
                  <option value="CLEANING">CLEANING</option>
                </select>
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black placeholder-black"
                  rows={3}
                />
                <input
                  type="number"
                  placeholder="Coût (optionnel)"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black placeholder-black"
                />
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black"
                />
                <button
                  onClick={handleCreate}
                  className="w-full px-4 py-2 bg-black text-white rounded hover:bg-white hover:text-black border-2 border-black transition-colors"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
