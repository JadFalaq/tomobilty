'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Users, Car, Calendar, DollarSign, TrendingUp, Award, MessageSquare, FileText, Settings, Shield, Bell, Star, Wrench, Package } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.push('/connexion?redirect=/admin');
        return;
      }

      try {
        const userData = JSON.parse(userStr);
        if (userData.role !== 'ADMIN') {
          router.push('/403');
          return;
        }

        fetchDashboardStats();
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/connexion?redirect=/admin');
      }
    };

    checkAuth();
  }, [router]);

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-xl text-black">Chargement...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-xl text-black mb-4">Erreur de chargement des statistiques</div>
          <div className="text-sm text-black">Vérifiez la console pour plus de détails</div>
          <button 
            onClick={fetchDashboardStats}
            className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-white hover:text-black border-2 border-black transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const { globalKPIs, recentActivity } = stats;

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-black">Tableau de bord Admin</h1>
        
        {/* Global KPIs */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-black">Statistiques Globales</h2>
          
          {/* Users Stats */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-black flex items-center">
              <Users className="mr-2" /> Utilisateurs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border-2 border-black p-4 rounded">
                <p className="text-sm font-medium text-black">Total</p>
                <p className="text-2xl font-bold text-black">{globalKPIs.users.total}</p>
              </div>
              <div className="bg-white border-2 border-black p-4 rounded">
                <p className="text-sm font-medium text-black">Nouveaux (7j)</p>
                <p className="text-2xl font-bold text-black">{globalKPIs.users.newLast7Days}</p>
              </div>
              <div className="bg-white border-2 border-black p-4 rounded">
                <p className="text-sm font-medium text-black">Nouveaux (30j)</p>
                <p className="text-2xl font-bold text-black">{globalKPIs.users.newLast30Days}</p>
              </div>
              <div className="bg-white border-2 border-black p-4 rounded">
                <p className="text-sm font-medium text-black">Par Rôle</p>
                <div className="text-sm text-black">
                  {globalKPIs.users.byRole.map((r: any) => (
                    <div key={r.role}>{r.role}: {r._count}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cars Stats */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-black flex items-center">
              <Car className="mr-2" /> Voitures
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border-2 border-black p-4 rounded">
                <p className="text-sm font-medium text-black">Total</p>
                <p className="text-2xl font-bold text-black">{globalKPIs.cars.total}</p>
              </div>
              {globalKPIs.cars.byStatus.map((s: any) => (
                <div key={s.statut} className="bg-white border-2 border-black p-4 rounded">
                  <p className="text-sm font-medium text-black">{s.statut}</p>
                  <p className="text-2xl font-bold text-black">{s._count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bookings Stats */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-black flex items-center">
              <Calendar className="mr-2" /> Réservations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border-2 border-black p-4 rounded">
                <p className="text-sm font-medium text-black">Total</p>
                <p className="text-2xl font-bold text-black">{globalKPIs.bookings.total}</p>
              </div>
              <div className="bg-white border-2 border-black p-4 rounded">
                <p className="text-sm font-medium text-black">7 derniers jours</p>
                <p className="text-2xl font-bold text-black">{globalKPIs.bookings.last7Days}</p>
              </div>
              <div className="bg-white border-2 border-black p-4 rounded">
                <p className="text-sm font-medium text-black">30 derniers jours</p>
                <p className="text-2xl font-bold text-black">{globalKPIs.bookings.last30Days}</p>
              </div>
            </div>
          </div>

          {/* Payments Stats */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-black flex items-center">
              <DollarSign className="mr-2" /> Paiements & Revenus
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border-2 border-black p-4 rounded">
                <p className="text-sm font-medium text-black">Montant Total</p>
                <p className="text-2xl font-bold text-black">{Number(globalKPIs.payments.totalAmount).toFixed(2)} MAD</p>
              </div>
              <div className="bg-white border-2 border-black p-4 rounded">
                <p className="text-sm font-medium text-black">Complétés</p>
                <p className="text-2xl font-bold text-black">{Number(globalKPIs.payments.completed.amount).toFixed(2)} MAD</p>
                <p className="text-xs text-black">({globalKPIs.payments.completed.count} paiements)</p>
              </div>
              <div className="bg-white border-2 border-black p-4 rounded">
                <p className="text-sm font-medium text-black">Échoués</p>
                <p className="text-2xl font-bold text-black">{globalKPIs.payments.failed}</p>
              </div>
              <div className="bg-white border-2 border-black p-4 rounded">
                <p className="text-sm font-medium text-black">Remboursés</p>
                <p className="text-2xl font-bold text-black">{Number(globalKPIs.payments.refunded.amount).toFixed(2)} MAD</p>
                <p className="text-xs text-black">({globalKPIs.payments.refunded.count} paiements)</p>
              </div>
            </div>
          </div>

          {/* Other Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border-2 border-black p-4 rounded">
              <div className="flex items-center mb-2">
                <Star className="mr-2 text-black" />
                <p className="text-sm font-medium text-black">Avis</p>
              </div>
              <p className="text-2xl font-bold text-black">{globalKPIs.reviews.total}</p>
              <p className="text-sm text-black">Note moyenne: {Number(globalKPIs.reviews.averageRating).toFixed(1)}/5</p>
              <p className="text-xs text-black">Vérifiés: {globalKPIs.reviews.verified}</p>
            </div>

            <div className="bg-white border-2 border-black p-4 rounded">
              <div className="flex items-center mb-2">
                <Award className="mr-2 text-black" />
                <p className="text-sm font-medium text-black">Fidélité</p>
              </div>
              <p className="text-2xl font-bold text-black">{globalKPIs.loyalty.totalAccounts}</p>
              <p className="text-sm text-black">Points gagnés: {globalKPIs.loyalty.pointsEarned}</p>
              <p className="text-sm text-black">Points utilisés: {globalKPIs.loyalty.pointsRedeemed}</p>
            </div>

            <div className="bg-white border-2 border-black p-4 rounded">
              <div className="flex items-center mb-2">
                <Wrench className="mr-2 text-black" />
                <p className="text-sm font-medium text-black">Maintenance</p>
              </div>
              <p className="text-2xl font-bold text-black">{globalKPIs.maintenance.total}</p>
              <p className="text-sm text-black">À venir: {globalKPIs.maintenance.upcoming}</p>
              <p className="text-sm text-black">En retard: {globalKPIs.maintenance.overdue}</p>
            </div>

            <div className="bg-white border-2 border-black p-4 rounded">
              <div className="flex items-center mb-2">
                <Bell className="mr-2 text-black" />
                <p className="text-sm font-medium text-black">Notifications</p>
              </div>
              <p className="text-2xl font-bold text-black">{globalKPIs.notifications.total}</p>
              <p className="text-sm text-black">Non lues: {globalKPIs.notifications.unread}</p>
            </div>

            <div className="bg-white border-2 border-black p-4 rounded">
              <div className="flex items-center mb-2">
                <MessageSquare className="mr-2 text-black" />
                <p className="text-sm font-medium text-black">Chat</p>
              </div>
              <p className="text-2xl font-bold text-black">{globalKPIs.chat.totalConversations}</p>
              <p className="text-sm text-black">Actives: {globalKPIs.chat.activeConversations}</p>
              <p className="text-sm text-black">Messages: {globalKPIs.chat.totalMessages}</p>
            </div>

            <div className="bg-white border-2 border-black p-4 rounded">
              <div className="flex items-center mb-2">
                <FileText className="mr-2 text-black" />
                <p className="text-sm font-medium text-black">Documents</p>
              </div>
              <p className="text-2xl font-bold text-black">{globalKPIs.documents.total}</p>
              <p className="text-sm text-black">OCR Confiance: {Number(globalKPIs.documents.avgOcrConfidence).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-black">Activité Récente</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Bookings */}
            <div className="bg-white border-2 border-black p-4 rounded">
              <h3 className="text-lg font-semibold mb-3 text-black">Réservations Récentes</h3>
              <div className="space-y-2">
                {recentActivity.bookings.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="border-b border-black pb-2">
                    <p className="text-sm font-medium text-black">{booking.user.nom} {booking.user.prenom}</p>
                    <p className="text-xs text-black">{booking.car.brand.name} {booking.car.modele} - {booking.status.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white border-2 border-black p-4 rounded">
              <h3 className="text-lg font-semibold mb-3 text-black">Paiements Récents</h3>
              <div className="space-y-2">
                {recentActivity.payments.slice(0, 5).map((payment: any) => (
                  <div key={payment.id} className="border-b border-black pb-2">
                    <p className="text-sm font-medium text-black">{payment.user.nom} {payment.user.prenom}</p>
                    <p className="text-xs text-black">{Number(payment.amount).toFixed(2)} MAD - {payment.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-black">Gestion Rapide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Utilisateurs', href: '/admin/users', icon: Users },
              { name: 'Voitures', href: '/admin/cars', icon: Car },
              { name: 'Réservations', href: '/admin/bookings', icon: Calendar },
              { name: 'Paiements', href: '/admin/payments', icon: DollarSign },
              { name: 'Avis', href: '/admin/reviews', icon: Star },
              { name: 'Maintenance', href: '/admin/maintenance', icon: Wrench },
              { name: 'Documents', href: '/admin/documents', icon: FileText },
              { name: 'Notifications', href: '/admin/notifications', icon: Bell },
              { name: 'Promotions', href: '/admin/promotions', icon: TrendingUp },
              { name: 'Fidélité', href: '/admin/loyalty', icon: Award },
              { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
              { name: 'Paramètres', href: '/admin/settings', icon: Settings }
            ].map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="bg-white border-2 border-black p-4 rounded hover:bg-black hover:text-white transition-colors text-center"
              >
                <link.icon className="mx-auto mb-2" size={24} />
                <p className="text-sm font-medium">{link.name}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
