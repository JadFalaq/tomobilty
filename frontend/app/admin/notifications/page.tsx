'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/admin/Table';
import api from '@/lib/api';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [pagination.page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/notifications', { params: { page: pagination.page, pageSize: pagination.pageSize } });
      setNotifications(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'Utilisateur', render: (value: any) => `${value?.nom} ${value?.prenom}` },
    { key: 'title', label: 'Titre' },
    { key: 'type', label: 'Type' },
    { key: 'is_read', label: 'Lu', render: (value: boolean) => value ? '✓' : '✗' },
    { key: 'created_at', label: 'Date', render: (value: string) => new Date(value).toLocaleDateString() }
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">Gestion des Notifications</h1>
        <Table
          columns={columns}
          data={notifications}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          loading={loading}
        />
      </div>
    </div>
  );
}
