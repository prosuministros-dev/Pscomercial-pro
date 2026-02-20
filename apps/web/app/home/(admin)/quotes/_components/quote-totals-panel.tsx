'use client';

import { Card } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import type { Quote } from '../_lib/types';

interface QuoteTotalsPanelProps {
  quote: Quote;
}

export function QuoteTotalsPanel({ quote }: QuoteTotalsPanelProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: quote.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate total cost from margin formula: margin_pct = (total - cost) / total * 100
  // Solving for cost: cost = total * (1 - margin_pct / 100)
  const totalCost = quote.margin_pct
    ? quote.total * (1 - quote.margin_pct / 100)
    : 0;
  const profit = quote.total - totalCost;

  const marginColor = () => {
    if (!quote.margin_pct) return 'text-gray-500';
    if (quote.margin_pct < 7) return 'text-red-600 dark:text-red-400';
    if (quote.margin_pct < 9) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const marginStatus = () => {
    if (!quote.margin_pct) return 'N/A';
    if (quote.margin_pct < 7) return 'Bajo Mínimo';
    if (quote.margin_pct < 9) return 'Aceptable';
    return 'Óptimo';
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Liquidación de Cotización
          </h3>
          <Badge variant={quote.margin_pct && quote.margin_pct >= 7 ? 'default' : 'destructive'}>
            {marginStatus()}
          </Badge>
        </div>

        {/* Subtotals */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal (antes de IVA):</span>
            <span className="font-mono font-medium text-gray-900 dark:text-white">
              {formatCurrency(quote.subtotal)}
            </span>
          </div>

          {quote.discount_amount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
              <span className="font-mono font-medium text-red-600 dark:text-red-400">
                -{formatCurrency(quote.discount_amount)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">IVA:</span>
            <span className="font-mono font-medium text-gray-900 dark:text-white">
              {formatCurrency(quote.tax_amount)}
            </span>
          </div>

          {!quote.transport_included && quote.transport_cost > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Transporte (adicional):
              </span>
              <span className="font-mono font-medium text-gray-900 dark:text-white">
                {formatCurrency(quote.transport_cost)}
              </span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-gray-300 dark:border-gray-600">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Total Venta:
          </span>
          <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 font-mono">
            {formatCurrency(quote.total)}
          </span>
        </div>

        {/* Cost & Profit Analysis */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Costo Total:</span>
            <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
              {formatCurrency(totalCost)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Utilidad:</span>
            <span className="font-mono font-medium text-green-600 dark:text-green-400">
              {formatCurrency(profit)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-gray-900 dark:text-white">
              Margen General:
            </span>
            <span className={`text-xl font-bold font-mono ${marginColor()}`}>
              {quote.margin_pct?.toFixed(2) || '0.00'}%
            </span>
          </div>
        </div>

        {/* Margin Warning */}
        {quote.margin_pct && quote.margin_pct < 7 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
              ⚠️ Margen por debajo del mínimo requerido (7%). Requiere aprobación de Gerencia.
            </p>
          </div>
        )}

        {/* Transport Note */}
        {quote.transport_included && quote.transport_cost > 0 && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
            ℹ️ Transporte ({formatCurrency(quote.transport_cost)}) incluido en los items
          </div>
        )}

        {/* Payment Terms */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Forma de Pago:</span>
            <Badge variant="outline" className="font-medium">
              {quote.payment_terms}
            </Badge>
          </div>
          {quote.currency === 'USD' && quote.trm_applied && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600 dark:text-gray-400">TRM Aplicada:</span>
              <span className="font-mono font-medium text-gray-900 dark:text-white">
                ${quote.trm_applied.toFixed(2)} COP/USD
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
