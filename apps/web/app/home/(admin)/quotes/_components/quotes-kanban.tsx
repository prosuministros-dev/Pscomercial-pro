'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@kit/ui/badge';
import { KANBAN_COLUMNS, MARGIN_HEALTH } from '../_lib/schema';
import type { Quote } from '../_lib/types';

interface QuotesKanbanProps {
  quotes: Quote[];
  searchTerm: string;
  onQuoteClick: (quote: Quote) => void;
}

function getMarginHealth(marginPct: number | null) {
  if (marginPct === null) {
    return MARGIN_HEALTH.healthy;
  }

  if (marginPct < MARGIN_HEALTH.critical.max) {
    return MARGIN_HEALTH.critical;
  }

  if (marginPct < MARGIN_HEALTH.warning.max) {
    return MARGIN_HEALTH.warning;
  }

  return MARGIN_HEALTH.healthy;
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

function getAdvisorInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }

  return fullName.slice(0, 2).toUpperCase();
}

export function QuotesKanban({
  quotes,
  searchTerm,
  onQuoteClick,
}: QuotesKanbanProps) {
  const filteredQuotes = useMemo(() => {
    // Filter out lost quotes
    const active = quotes.filter((q) => q.status !== 'lost');

    if (!searchTerm.trim()) {
      return active;
    }

    const term = searchTerm.toLowerCase().trim();

    return active.filter((q) => {
      const matchesNumber = String(q.quote_number)
        .toLowerCase()
        .includes(term);
      const matchesCustomer = q.customer?.business_name
        ?.toLowerCase()
        .includes(term);

      return matchesNumber || matchesCustomer;
    });
  }, [quotes, searchTerm]);

  const columnData = useMemo(() => {
    return KANBAN_COLUMNS.map((col) => {
      const columnQuotes = filteredQuotes.filter((q) =>
        (col.statuses as readonly string[]).includes(q.status),
      );

      return { ...col, quotes: columnQuotes };
    });
  }, [filteredQuotes]);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max px-1">
        {columnData.map((column, colIndex) => (
          <motion.div
            key={column.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: colIndex * 0.05 }}
            className="w-[260px] flex-shrink-0 flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Column Header */}
            <div
              className={`${column.headerColor} px-3 py-2.5 flex items-center justify-between`}
            >
              <span className="text-sm font-semibold text-white truncate">
                {column.label}
              </span>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white text-xs font-bold min-w-[24px] justify-center"
              >
                {column.quotes.length}
              </Badge>
            </div>

            {/* Column Body */}
            <div
              className={`${column.bgColor} flex-1 overflow-y-auto max-h-[65vh] p-2 space-y-2`}
            >
              {column.quotes.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs text-gray-400 dark:text-gray-500">
                  Sin cotizaciones
                </div>
              ) : (
                column.quotes.map((quote, cardIndex) => {
                  const health = getMarginHealth(quote.margin_pct);

                  return (
                    <motion.div
                      key={quote.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: cardIndex * 0.03 }}
                      onClick={() => onQuoteClick(quote)}
                      className={`
                        p-2.5 rounded-md border border-gray-200 dark:border-gray-600
                        bg-white dark:bg-gray-800 cursor-pointer
                        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500
                        transition-all duration-150
                        border-l-4 ${health.borderColor}
                      `}
                    >
                      {/* Row 1: Quote number + Amount */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                          #{quote.quote_number}
                        </span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {formatAmount(quote.total)}
                        </span>
                      </div>

                      {/* Row 2: Customer name */}
                      <div className="mt-1">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate block">
                          {quote.customer?.business_name || 'Sin cliente'}
                        </span>
                      </div>

                      {/* Row 3: Margin + Date + Advisor avatar */}
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-medium ${health.textColor}`}
                          >
                            {quote.margin_pct !== null
                              ? `${quote.margin_pct.toFixed(1)}%`
                              : '—'}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
                            {format(new Date(quote.quote_date), 'd MMM', {
                              locale: es,
                            })}
                          </span>
                        </div>

                        {quote.advisor && (
                          <div
                            className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0"
                            title={quote.advisor.full_name}
                          >
                            <span className="text-[9px] font-bold text-white leading-none">
                              {getAdvisorInitials(quote.advisor.full_name)}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
