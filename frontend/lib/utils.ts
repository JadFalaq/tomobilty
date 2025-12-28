import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD'
  }).format(price);
}

export function calculerNombreJours(dateDebut: Date | string, dateFin: Date | string): number {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  const diffTime = Math.abs(fin.getTime() - debut.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getStatutBadgeColor(statut: string): string {
  const colors: { [key: string]: string } = {
    'disponible': 'bg-green-100 text-green-800',
    'louée': 'bg-yellow-100 text-yellow-800',
    'maintenance': 'bg-red-100 text-red-800',
    'indisponible': 'bg-gray-100 text-gray-800',
    'en_attente': 'bg-yellow-100 text-yellow-800',
    'confirmée': 'bg-blue-100 text-blue-800',
    'en_cours': 'bg-purple-100 text-purple-800',
    'terminée': 'bg-green-100 text-green-800',
    'annulée': 'bg-red-100 text-red-800',
  };
  return colors[statut] || 'bg-gray-100 text-gray-800';
}

export function getStatutLabel(statut: string): string {
  const labels: { [key: string]: string } = {
    'disponible': 'Disponible',
    'louée': 'Louée',
    'maintenance': 'En maintenance',
    'indisponible': 'Indisponible',
    'en_attente': 'En attente',
    'confirmée': 'Confirmée',
    'en_cours': 'En cours',
    'terminée': 'Terminée',
    'annulée': 'Annulée',
  };
  return labels[statut] || statut;
}
