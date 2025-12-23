'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/admin/Table';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [pagination.page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/reviews?page=${pagination.page}&pageSize=${pagination.pageSize}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReviews(data.data.items);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (review: any) => {
    if (!confirm('Supprimer cet avis?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/reviews/${review.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'Client', render: (value: any) => `${value?.nom} ${value?.prenom}` },
    { key: 'rating', label: 'Note', render: (value: number) => `${value}/5` },
    { key: 'comment', label: 'Commentaire' },
    { key: 'is_verified', label: 'Vérifié', render: (value: boolean) => value ? '✓' : '✗' },
    { key: 'created_at', label: 'Date', render: (value: string) => new Date(value).toLocaleDateString() }
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">Gestion des Avis</h1>
        <Table
          columns={columns}
          data={reviews}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          loading={loading}
        />
      </div>
    </div>
  );
}
