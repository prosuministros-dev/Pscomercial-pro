'use client';

import { motion } from 'motion/react';
import { Users, DollarSign, ShieldAlert, CreditCard } from 'lucide-react';
import { useCarteraSummary } from '../_lib/finance-queries';

export function FinanceSummaryCards() {
  const { data: summary } = useCarteraSummary();

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      notation: 'compact',
    }).format(n);

  const cards = [
    {
      label: 'Clientes Activos',
      value: summary?.total_customers || 0,
      icon: Users,
      color: 'bg-cyan-50 dark:bg-cyan-900/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      valueColor: 'text-cyan-700 dark:text-cyan-300',
    },
    {
      label: 'Cupo Total',
      value: fmt(summary?.total_credit_limit || 0),
      icon: CreditCard,
      color: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      valueColor: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Cartera en Uso',
      value: fmt(summary?.total_credit_used || 0),
      icon: DollarSign,
      color: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      valueColor: 'text-amber-700 dark:text-amber-300',
    },
    {
      label: 'Clientes Bloqueados',
      value: summary?.blocked_customers || 0,
      icon: ShieldAlert,
      color: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      valueColor: 'text-red-700 dark:text-red-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={`${card.color} rounded-xl p-4 flex items-center gap-3 border border-gray-200/50 dark:border-gray-700/50`}
        >
          <div className={card.iconColor}>
            <card.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className={`text-2xl font-bold font-mono ${card.valueColor}`}>
              {card.value}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
