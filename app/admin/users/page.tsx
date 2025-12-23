'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import Table from '@/components/admin/Table';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', telephone: '', role: 'CLIENT', mot_de_passe: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`http://localhost:5000/api/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.items);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ nom: '', prenom: '', email: '', telephone: '', role: 'CLIENT', mot_de_passe: '' });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDelete = async (user: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${user.nom} ${user.prenom}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'email', label: 'Email' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'role', label: 'Rôle' },
    { 
      key: 'email_verified', 
      label: 'Email Vérifié',
      render: (value: boolean) => value ? '✓' : '✗'
    },
    { 
      key: 'date_creation', 
      label: 'Date Création',
      render: (value: string) => new Date(value).toLocaleDateString()
    }
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">Gestion des Utilisateurs</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-black text-white rounded hover:bg-white hover:text-black border-2 border-black transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Créer un utilisateur
          </button>
        </div>

        <Table
          columns={columns}
          data={users}
          onEdit={(user) => {
            setSelectedUser(user);
            setFormData({ nom: user.nom, prenom: user.prenom, email: user.email, telephone: user.telephone, role: user.role, mot_de_passe: '' });
            setShowEditModal(true);
          }}
          onDelete={handleDelete}
          pagination={pagination}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          onSearch={(query) => setSearchQuery(query)}
          searchPlaceholder="Rechercher par nom, prénom ou email..."
          loading={loading}
        />

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border-4 border-black rounded p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-black">Créer un utilisateur</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-black hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="text"
                  placeholder="Prénom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={formData.mot_de_passe}
                  onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black"
                />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="CLIENT">CLIENT</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="AGENT">AGENT</option>
                </select>
                <button
                  onClick={handleCreate}
                  className="w-full px-4 py-2 bg-black text-white rounded hover:bg-white hover:text-black border-2 border-black transition-colors font-medium"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border-4 border-black rounded p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-black">Modifier l'utilisateur</h2>
                <button onClick={() => setShowEditModal(false)} className="text-black hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="text"
                  placeholder="Prénom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-black"
                />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-black rounded text-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="CLIENT">CLIENT</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="AGENT">AGENT</option>
                </select>
                <button
                  onClick={handleUpdate}
                  className="w-full px-4 py-2 bg-black text-white rounded hover:bg-white hover:text-black border-2 border-black transition-colors font-medium"
                >
                  Mettre à jour
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
