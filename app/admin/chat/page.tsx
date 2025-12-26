'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/admin/Table';
import api from '@/lib/api';

export default function AdminChat() {
  const [conversations, setConversations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, [pagination.page]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/chat/conversations', { params: { page: pagination.page, pageSize: pagination.pageSize } });
      setConversations(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'Utilisateur', render: (value: any) => value ? `${value.nom} ${value.prenom}` : 'Anonyme' },
    { key: 'session_id', label: 'Session' },
    { key: 'status', label: 'Statut' },
    { key: 'created_at', label: 'Créé le', render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'updated_at', label: 'Mis à jour', render: (value: string) => new Date(value).toLocaleDateString() }
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">Gestion du Chat</h1>
        <Table
          columns={columns}
          data={conversations}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          loading={loading}
        />
      </div>
    </div>
  );
}
