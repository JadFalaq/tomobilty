'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/admin/Table';
import api from '@/lib/api';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [pagination.page]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/bookings', { params: { page: pagination.page, pageSize: pagination.pageSize } });
      setBookings(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (booking: any) => {
    if (!confirm(`Supprimer la réservation #${booking.id}?`)) return;
    try {
      await api.delete(`/admin/bookings/${booking.id}`);
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'Client', render: (value: any) => `${value?.nom} ${value?.prenom}` },
    { key: 'car', label: 'Voiture', render: (value: any) => `${value?.brand?.name} ${value?.modele}` },
    { key: 'date_debut', label: 'Début', render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'date_fin', label: 'Fin', render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'prix_total', label: 'Prix Total', render: (value: any) => `${value} MAD` },
    { key: 'status', label: 'Statut', render: (value: any) => value?.name },
    { key: 'paiement_effectue', label: 'Payé', render: (value: boolean) => value ? '✓' : '✗' }
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">Gestion des Réservations</h1>
        <Table
          columns={columns}
          data={bookings}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          loading={loading}
        />
      </div>
    </div>
  );
}
