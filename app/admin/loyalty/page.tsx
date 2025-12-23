'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/admin/Table';

export default function AdminLoyalty() {
  const [accounts, setAccounts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, [pagination.page]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/loyalty/accounts?page=${pagination.page}&pageSize=${pagination.pageSize}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.data.items);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching loyalty accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'Utilisateur', render: (value: any) => `${value?.nom} ${value?.prenom}` },
    { key: 'points_balance', label: 'Points' },
    { key: 'tier', label: 'Niveau', render: (value: any) => value?.name },
    { key: 'total_spent', label: 'Total Dépensé', render: (value: any) => `${Number(value).toFixed(2)} MAD` }
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">Gestion de la Fidélité</h1>
        <Table
          columns={columns}
          data={accounts}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          loading={loading}
        />
      </div>
    </div>
  );
}
