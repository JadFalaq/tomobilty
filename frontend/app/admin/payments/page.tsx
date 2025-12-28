'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/admin/Table';
import api from '@/lib/api';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [pagination.page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/payments', { params: { page: pagination.page, pageSize: pagination.pageSize } });
      setPayments(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'Client', render: (value: any) => `${value?.nom} ${value?.prenom}` },
    { key: 'amount', label: 'Montant', render: (value: any) => `${Number(value).toFixed(2)} MAD` },
    { key: 'status', label: 'Statut' },
    { key: 'provider', label: 'Fournisseur' },
    { key: 'created_at', label: 'Date', render: (value: string) => new Date(value).toLocaleDateString() }
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">Gestion des Paiements</h1>
        <Table
          columns={columns}
          data={payments}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          loading={loading}
        />
      </div>
    </div>
  );
}
