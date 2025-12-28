'use client';

import { useEffect, useState } from 'react';
import { User, Bell, Globe, Calendar, Lock, Save } from 'lucide-react';
import api from '@/lib/api';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: ''
  });
  const [preferences, setPreferences] = useState({
    language: 'fr',
    timezone: 'Africa/Casablanca',
    notification_email: true,
    notification_sms: false,
    dashboard_default_range: '7d'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/me/settings');
      setProfile(res.data.data.profile);
      setPreferences(res.data.data.preferences);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des paramètres' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/admin/me/settings', { profile, preferences });
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/admin/me/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Erreur lors du changement de mot de passe' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-xl text-black">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8">Mes Paramètres</h1>

        {message.text && (
          <div className={`mb-6 p-4 border-2 rounded ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-500 text-black' 
              : 'bg-red-50 border-red-500 text-black'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Section */}
        <div className="mb-8 bg-white border-2 border-black rounded p-6">
          <div className="flex items-center mb-4">
            <User className="mr-2 text-black" size={24} />
            <h2 className="text-2xl font-bold text-black">Profil</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Nom</label>
              <input
                type="text"
                value={profile.nom || ''}
                onChange={(e) => setProfile({ ...profile, nom: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Prénom</label>
              <input
                type="text"
                value={profile.prenom || ''}
                onChange={(e) => setProfile({ ...profile, prenom: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Email</label>
              <input
                type="email"
                value={profile.email || ''}
                disabled
                className="w-full px-4 py-2 border-2 border-black rounded text-black bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-black mt-1">L'email ne peut pas être modifié</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Téléphone</label>
              <input
                type="tel"
                value={profile.telephone || ''}
                onChange={(e) => setProfile({ ...profile, telephone: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded text-black"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-black mb-2">Adresse</label>
              <input
                type="text"
                value={profile.adresse || ''}
                onChange={(e) => setProfile({ ...profile, adresse: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded text-black"
              />
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="mb-8 bg-white border-2 border-black rounded p-6">
          <div className="flex items-center mb-4">
            <Globe className="mr-2 text-black" size={24} />
            <h2 className="text-2xl font-bold text-black">Préférences</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Langue</label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded text-black"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">Fuseau horaire</label>
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded text-black"
              >
                <option value="Africa/Casablanca">Africa/Casablanca (GMT+1)</option>
                <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                <option value="UTC">UTC (GMT+0)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">
                <Calendar className="inline mr-2" size={16} />
                Plage par défaut du tableau de bord
              </label>
              <select
                value={preferences.dashboard_default_range}
                onChange={(e) => setPreferences({ ...preferences, dashboard_default_range: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded text-black"
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">90 derniers jours</option>
              </select>
            </div>

            <div className="pt-4 border-t-2 border-black">
              <div className="flex items-center mb-2">
                <Bell className="mr-2 text-black" size={20} />
                <label className="text-sm font-bold text-black">Notifications</label>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={preferences.notification_email}
                    onChange={(e) => setPreferences({ ...preferences, notification_email: e.target.checked })}
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-black">Recevoir des notifications par email</span>
                </label>
                
                <label className="flex items-center text-black">
                  <input
                    type="checkbox"
                    checked={preferences.notification_sms}
                    onChange={(e) => setPreferences({ ...preferences, notification_sms: e.target.checked })}
                    className="mr-2 w-4 h-4"
                  />
                  <span className="text-black">Recevoir des notifications par SMS</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="w-full mb-8 px-6 py-3 bg-black text-white rounded hover:bg-white hover:text-black border-2 border-black transition-colors font-bold flex items-center justify-center disabled:opacity-50"
        >
          <Save className="mr-2" size={20} />
          {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>

        {/* Security Section */}
        <div className="bg-white border-2 border-black rounded p-6">
          <div className="flex items-center mb-4">
            <Lock className="mr-2 text-black" size={24} />
            <h2 className="text-2xl font-bold text-black">Sécurité</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Mot de passe actuel</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Nouveau mot de passe</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded text-black"
              />
              <p className="text-xs text-black mt-1">Minimum 8 caractères</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border-2 border-black rounded text-black"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={saving || !passwordData.currentPassword || !passwordData.newPassword}
              className="w-full px-6 py-3 bg-black text-white rounded hover:bg-white hover:text-black border-2 border-black transition-colors font-bold disabled:opacity-50"
            >
              {saving ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
