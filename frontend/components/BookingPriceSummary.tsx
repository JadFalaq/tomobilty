'use client';

import { useMemo, useState } from 'react';

type PaymentType = 'ONLINE' | 'AGENCE';

interface LineItem {
  label: string;
  amount: number;
}

interface BookingPriceSummaryProps {
  basePricePerDay: number;
  durationDays: number;
  paymentType: PaymentType;
  protectionFeePerDay?: number;
  mileageFeePerDay?: number;
  chauffeurFeePerDay?: number;
  assuranceFeePerDay?: number;
  extrasOneTime?: number;
  loyaltyDiscountMad?: number;
  cautionAmount?: number;
  breakdown?: LineItem[];
  className?: string;
}

export default function BookingPriceSummary({
  basePricePerDay,
  durationDays,
  paymentType,
  protectionFeePerDay = 0,
  mileageFeePerDay = 0,
  chauffeurFeePerDay = 0,
  assuranceFeePerDay = 0,
  extrasOneTime = 0,
  loyaltyDiscountMad = 0,
  cautionAmount = 0,
  breakdown,
  className = ''
}: BookingPriceSummaryProps) {
  const [open, setOpen] = useState(false);

  const totals = useMemo(() => {
    const baseRentalTotal = Math.round(basePricePerDay * durationDays * 100) / 100;
    const optionsPerDay = protectionFeePerDay + mileageFeePerDay + chauffeurFeePerDay + assuranceFeePerDay;
    const optionsTotal = Math.round(optionsPerDay * durationDays * 100) / 100;
    const subtotal = Math.round((baseRentalTotal + optionsTotal + extrasOneTime - loyaltyDiscountMad) * 100) / 100;
    const agencyFee = paymentType === 'AGENCE' ? Math.round(subtotal * 0.025 * 100) / 100 : 0;
    const grandTotal = Math.round((subtotal + agencyFee) * 100) / 100;
    const totalPerDay = Math.round((basePricePerDay + optionsPerDay) * 100) / 100;
    return { baseRentalTotal, optionsPerDay, optionsTotal, subtotal, agencyFee, grandTotal, totalPerDay };
  }, [basePricePerDay, durationDays, protectionFeePerDay, mileageFeePerDay, chauffeurFeePerDay, assuranceFeePerDay, extrasOneTime, paymentType]);

  const lineItems = useMemo<LineItem[]>(() => {
    if (breakdown && breakdown.length > 0) return breakdown;
    const items: LineItem[] = [];
    items.push({ label: `${durationDays} jours x ${formatAmount(basePricePerDay)} / jour`, amount: totals.baseRentalTotal });
    if (protectionFeePerDay > 0) items.push({ label: `Protection: +${formatAmount(protectionFeePerDay)} / jour`, amount: Math.round(protectionFeePerDay * durationDays * 100) / 100 });
    if (mileageFeePerDay > 0) items.push({ label: `Kilométrage illimité: +${formatAmount(mileageFeePerDay)} / jour`, amount: Math.round(mileageFeePerDay * durationDays * 100) / 100 });
    if (assuranceFeePerDay > 0) items.push({ label: `Assurance: +${formatAmount(assuranceFeePerDay)} / jour`, amount: Math.round(assuranceFeePerDay * durationDays * 100) / 100 });
    if (chauffeurFeePerDay > 0) items.push({ label: `Chauffeur privé: +${formatAmount(chauffeurFeePerDay)} / jour`, amount: Math.round(chauffeurFeePerDay * durationDays * 100) / 100 });
    if (extrasOneTime > 0) items.push({ label: `Suppléments`, amount: extrasOneTime });
    if (loyaltyDiscountMad > 0) items.push({ label: `Réduction fidélité`, amount: -loyaltyDiscountMad });
    if (totals.agencyFee > 0) items.push({ label: `Frais paiement en agence (2,5%)`, amount: totals.agencyFee });
    return items;
  }, [breakdown, durationDays, basePricePerDay, totals.baseRentalTotal, protectionFeePerDay, mileageFeePerDay, assuranceFeePerDay, chauffeurFeePerDay, extrasOneTime, loyaltyDiscountMad, totals.agencyFee]);

  return (
    <div className={`w-full lg:w-auto lg:ml-auto ${className}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-gray-800 w-full min-w-[280px]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm">Prix par jour</div>
          <div className="text-sm font-semibold">{formatAmount(totals.totalPerDay)}</div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm">Durée</div>
          <div className="text-sm font-semibold">{durationDays} jours</div>
        </div>
        <div className="border-t border-gray-200 my-2" />
        <div className="flex items-center justify-between">
          <div className="text-sm">Total (TTC)</div>
          <div className="text-xl font-bold">{formatAmount(totals.grandTotal)}</div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="mt-2 text-sm text-gray-700 hover:text-gray-900 underline"
        >
          Détails du prix
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow-xl w-full max-w-lg border border-primary-100">
            <div className="p-4 border-b border-primary-100 flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Détails du prix</div>
              <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">Fermer</button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">Frais de location</div>
                <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>{`${durationDays} jours x ${formatAmount(basePricePerDay)} / jour`}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{formatAmount(totals.baseRentalTotal)}</span>
                </div>
              </div>
              {lineItems.filter(li => li.label.startsWith('Protection') || li.label.startsWith('Kilométrage') || li.label.startsWith('Assurance') || li.label.startsWith('Chauffeur') || li.label === 'Suppléments').length > 0 && (
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">Options / Suppléments</div>
                  <div className="space-y-1">
                    {lineItems.filter(li => li.label.startsWith('Protection') || li.label.startsWith('Kilométrage') || li.label.startsWith('Assurance') || li.label.startsWith('Chauffeur') || li.label === 'Suppléments').map((li, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                        <span>{li.label}</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatAmount(li.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">Caution remboursable</div>
                <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>Caution</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{formatAmount(cautionAmount || 0)}</span>
                </div>
              </div>
              {totals.agencyFee > 0 && (
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">Taxes et frais</div>
                  <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>Frais paiement en agence (2,5%)</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{formatAmount(totals.agencyFee)}</span>
                  </div>
                </div>
              )}
              <div className="border-t border-primary-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Total (TTC)</span>
                  <span className="text-xl font-serif font-bold text-gray-900 dark:text-gray-100">{formatAmount(totals.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
