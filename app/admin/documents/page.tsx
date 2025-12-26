'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/admin/Table';
import api from '@/lib/api';

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [pagination.page]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/documents', { params: { page: pagination.page, pageSize: pagination.pageSize } });
      setDocuments(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user', label: 'Utilisateur', render: (value: any) => value ? `${value.nom} ${value.prenom}` : '-' },
    { key: 'filename', label: 'Fichier' },
    { key: 'document_type', label: 'Type' },
    { key: 'status', label: 'Statut' },
    { key: 'ocr_confidence', label: 'OCR Confiance', render: (value: any) => value ? `${Number(value).toFixed(1)}%` : '-' },
    { key: 'created_at', label: 'Date', render: (value: string) => new Date(value).toLocaleDateString() }
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">Gestion des Documents</h1>
        <Table
          columns={columns}
          data={documents}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          loading={loading}
        />
      </div>
    </div>
  );
}
