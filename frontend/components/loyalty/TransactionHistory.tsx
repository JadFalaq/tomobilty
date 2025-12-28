'use client';

import { useState, useEffect } from 'react';
import { loyaltyAPI } from '@/lib/loyaltyAPI';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Car,
  RefreshCw,
  Award,
  Loader2,
  Filter,
  ChevronDown
} from 'lucide-react';

type TransactionType = 'EARNED' | 'REDEEMED' | 'BONUS' | 'REFUNDED' | 'EXPIRED';

type TransactionBookingCar = {
  brand?: { name?: string | null } | null;
  modele?: string | null;
};

type TransactionBooking = {
  id: number;
  car?: TransactionBookingCar | null;
};

type LoyaltyTransaction = {
  id: number;
  points: number;
  transaction_type: TransactionType | string;
  is_positive: boolean;
  formatted_points: string;
  description?: string | null;
  created_at: string;
  booking?: TransactionBooking | null;
};

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await loyaltyAPI.getTransactionHistory(50);
      setTransactions(response.data.data.transactions);
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique');
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'EARNED': return TrendingUp;
      case 'REDEEMED': return TrendingDown;
      case 'BONUS': return Award;
      case 'REFUNDED': return RefreshCw;
      case 'EXPIRED': return Calendar;
      default: return History;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'EARNED': return 'text-green-600 bg-green-100';
      case 'REDEEMED': return 'text-red-600 bg-red-100';
      case 'BONUS': return 'text-purple-600 bg-purple-100';
      case 'REFUNDED': return 'text-blue-600 bg-blue-100';
      case 'EXPIRED': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'EARNED': return 'Points gagnés';
      case 'REDEEMED': return 'Points échangés';
      case 'BONUS': return 'Points bonus';
      case 'REFUNDED': return 'Points remboursés';
      case 'EXPIRED': return 'Points expirés';
      default: return 'Transaction';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === 'all') return true;
    return transaction.transaction_type === filter;
  });

  const transactionTypes = [
    { value: 'all', label: 'Toutes les transactions' },
    { value: 'EARNED', label: 'Points gagnés' },
    { value: 'REDEEMED', label: 'Points échangés' },
    { value: 'BONUS', label: 'Points bonus' },
    { value: 'REFUNDED', label: 'Points remboursés' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center">
            <History className="w-6 h-6 text-blue-500 mr-2" />
            Historique des Transactions
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Suivez tous vos gains et échanges de points
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">
              {transactionTypes.find(t => t.value === filter)?.label}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showFilters && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
              {transactionTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setFilter(type.value);
                    setShowFilters(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                    filter === type.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadTransactions}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => {
              const Icon = getTransactionIcon(transaction.transaction_type);
              const isPositive = transaction.is_positive;

              return (
                <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Transaction Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(transaction.transaction_type)}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Transaction Details */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">
                            {getTransactionLabel(transaction.transaction_type)}
                          </h4>
                          {transaction.booking && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Réservation #{transaction.booking.id}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {transaction.description}
                        </p>
                        
                        {/* Booking Details */}
                        {transaction.booking?.car && (
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                            <Car className="w-3 h-3" />
                            <span>
                              {transaction.booking.car.brand?.name} {transaction.booking.car.modele}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Points Amount */}
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? '+' : ''}{transaction.formatted_points}
                      </div>
                      <div className="text-xs text-gray-500">
                        points
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'Aucune transaction' : 'Aucune transaction de ce type'}
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Vos transactions de points apparaîtront ici après votre première réservation.'
                : 'Aucune transaction de ce type trouvée.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredTransactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">Points gagnés</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredTransactions
                    .filter(t => t.is_positive)
                    .reduce((sum, t) => sum + Math.abs(t.points), 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">Points utilisés</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredTransactions
                    .filter(t => !t.is_positive)
                    .reduce((sum, t) => sum + Math.abs(t.points), 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <History className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">Total transactions</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredTransactions.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
