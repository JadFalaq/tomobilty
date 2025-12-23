'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/admin/Table';

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, [pagination.page]);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/promotions?page=${pagination.page}&pageSize=${pagination.pageSize}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPromotions(data.data.items);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nom' },
    { key: 'discount', label: 'Réduction', render: (value: any) => `${value}%` },
    { key: 'start_date', label: 'Début', render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'end_date', label: 'Fin', render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'is_active', label: 'Active', render: (value: boolean) => value ? '✓' : '✗' }
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">Gestion des Promotions</h1>
        <Table
          columns={columns}
          data={promotions}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          loading={loading}
        />
      </div>
    </div>
  );
}
