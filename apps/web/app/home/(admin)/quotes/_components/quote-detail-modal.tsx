'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { PermissionGate } from '@kit/rbac/permission-gate';
import {
  FileText,
  Send,
  ShoppingCart,
  Pencil,
  AlertTriangle,
  CreditCard,
  Calendar,
  Loader2,
  Package,
} from 'lucide-react';
import { useQuoteItems } from '../_lib/quote-queries';
import { STATUS_LABELS, MARGIN_HEALTH } from '../_lib/schema';
import { QuoteTotalsPanel } from './quote-totals-panel';
import type { Quote, QuoteItem } from '../_lib/types';
import type { QuoteAction } from './quotes-table-columns';

interface QuoteDetailModalProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (quote: Quote) => void;
  onAction: (action: QuoteAction) => void;
}

const formatCurrency = (amount: number, currency: 'COP' | 'USD') => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

function getMarginColor(marginPct: number | null): string {
  if (marginPct === null) return 'text-gray-500';
  if (marginPct < MARGIN_HEALTH.critical.max)
    return 'text-red-600 dark:text-red-400';
  if (marginPct < MARGIN_HEALTH.warning.max)
    return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
}

function getMarginBadgeVariant(
  marginPct: number | null,
): 'destructive' | 'outline' | 'default' {
  if (marginPct === null) return 'outline';
  if (marginPct < MARGIN_HEALTH.critical.max) return 'destructive';
  if (marginPct < MARGIN_HEALTH.warning.max) return 'outline';
  return 'default';
}

/* -------------------------------------------------------------------------- */
/*  Info Row helper                                                           */
/* -------------------------------------------------------------------------- */

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">
        {label}
      </span>
      <span
        className={`text-sm font-medium text-right ${className ?? 'text-gray-900 dark:text-white'}`}
      >
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab 1 - General                                                           */
/* -------------------------------------------------------------------------- */

function GeneralTab({ quote }: { quote: Quote }) {
  const statusInfo = STATUS_LABELS[quote.status] ?? {
    label: quote.status,
    variant: 'outline' as const,
  };
  const isExpired =
    quote.status === 'expired' || new Date(quote.expires_at) < new Date();

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <div className="space-y-2">
        {quote.credit_blocked && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <CreditCard className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <span className="font-semibold">Crédito bloqueado</span>
              {quote.credit_block_reason && (
                <span> &mdash; {quote.credit_block_reason}</span>
              )}
            </div>
          </div>
        )}

        {quote.margin_pct !== null && quote.margin_pct < 7 && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              Margen por debajo del mínimo (7%). Requiere aprobación de
              Gerencia.
            </span>
          </div>
        )}

        {isExpired && quote.status !== 'approved' && (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
            <Calendar className="h-4 w-4 shrink-0 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Cotización vencida el{' '}
              {format(new Date(quote.expires_at), "d 'de' MMMM yyyy", {
                locale: es,
              })}
            </span>
          </div>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left column - Customer & Advisor */}
        <div className="space-y-1 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Cliente
          </h4>
          <InfoRow
            label="Razón Social"
            value={quote.customer?.business_name ?? 'N/A'}
          />
          <InfoRow label="NIT" value={quote.customer?.nit ?? 'N/A'} />
          <InfoRow label="Ciudad" value={quote.customer?.city ?? 'N/A'} />
          <div className="my-2 border-t border-gray-100 dark:border-gray-700" />
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Asesor
          </h4>
          <InfoRow
            label="Nombre"
            value={quote.advisor?.full_name ?? 'N/A'}
          />
        </div>

        {/* Right column - Quote details */}
        <div className="space-y-1 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Datos de Cotización
          </h4>
          <InfoRow
            label="Fecha"
            value={format(new Date(quote.quote_date), "d 'de' MMMM yyyy", {
              locale: es,
            })}
          />
          <InfoRow
            label="Vigencia"
            value={`${quote.validity_days} días`}
          />
          <InfoRow
            label="Vencimiento"
            value={format(new Date(quote.expires_at), "d MMM yyyy", {
              locale: es,
            })}
          />
          <InfoRow label="Forma de Pago" value={quote.payment_terms} />
          <InfoRow
            label="Moneda"
            value={
              <span>
                {quote.currency}
                {quote.currency === 'USD' && quote.trm_applied && (
                  <span className="ml-1 text-xs text-gray-400">
                    (TRM: {formatCurrency(quote.trm_applied, 'COP')})
                  </span>
                )}
              </span>
            }
          />
          <InfoRow
            label="Total"
            value={formatCurrency(quote.total, quote.currency)}
            className="text-cyan-600 dark:text-cyan-400 font-mono font-bold"
          />
        </div>
      </div>

      {/* Margin & Approval */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Margen y Aprobación
        </h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Margen
            </div>
            <div
              className={`text-2xl font-bold font-mono ${getMarginColor(quote.margin_pct)}`}
            >
              {quote.margin_pct?.toFixed(2) ?? '—'}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Estado Aprobación
            </div>
            <div className="mt-1">
              {quote.margin_approved ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Aprobado
                </Badge>
              ) : quote.margin_pct !== null && quote.margin_pct < 7 ? (
                <Badge variant="destructive">Requiere Aprobación</Badge>
              ) : (
                <Badge variant="outline">N/A</Badge>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Semáforo
            </div>
            <div className="mt-1">
              <Badge variant={getMarginBadgeVariant(quote.margin_pct)}>
                {quote.margin_pct === null
                  ? 'Sin datos'
                  : quote.margin_pct < MARGIN_HEALTH.critical.max
                    ? 'Crítico'
                    : quote.margin_pct < MARGIN_HEALTH.warning.max
                      ? 'Aceptable'
                      : 'Óptimo'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Notas
          </h4>
          <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {quote.notes}
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab 2 - Productos                                                         */
/* -------------------------------------------------------------------------- */

function ProductItemCard({
  item,
  currency,
}: {
  item: QuoteItem;
  currency: 'COP' | 'USD';
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {item.sku}
            </span>
            {item.discount_pct > 0 && (
              <Badge variant="outline" className="text-xs">
                -{item.discount_pct}% dto.
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {item.description}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(item.total, currency)}
          </div>
          <div className="text-xs text-gray-500">
            {item.quantity} x {formatCurrency(item.unit_price, currency)}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-2 dark:border-gray-700/50">
        <span className="text-xs text-gray-500">
          Subtotal:{' '}
          <span className="font-mono font-medium">
            {formatCurrency(item.subtotal, currency)}
          </span>
        </span>
        <span className="text-xs text-gray-500">
          IVA: <span className="font-mono font-medium">{item.tax_pct}%</span>
        </span>
        <span className="text-xs text-gray-500">
          Costo:{' '}
          <span className="font-mono font-medium">
            {formatCurrency(item.cost_price, currency)}
          </span>
        </span>
        {item.margin_pct !== null && (
          <span
            className={`text-xs font-mono font-semibold ${getMarginColor(item.margin_pct)}`}
          >
            Margen: {item.margin_pct.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
}

function ProductosTab({ quote }: { quote: Quote }) {
  const { data: items, isLoading, error } = useQuoteItems(quote.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Cargando items...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
        Error al cargar los productos: {error.message}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Package className="mb-2 h-10 w-10" />
        <p className="text-sm">No hay productos en esta cotización</p>
      </div>
    );
  }

  const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-800/60">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-white">
            {items.length}
          </span>{' '}
          {items.length === 1 ? 'producto' : 'productos'}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Subtotal:{' '}
          <span className="font-mono font-semibold text-gray-900 dark:text-white">
            {formatCurrency(itemsSubtotal, quote.currency)}
          </span>
        </span>
      </div>

      {/* Product cards */}
      <div className="space-y-2">
        {items
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => (
            <ProductItemCard
              key={item.id}
              item={item}
              currency={quote.currency}
            />
          ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab 3 - Liquidación                                                       */
/* -------------------------------------------------------------------------- */

function LiquidacionTab({ quote }: { quote: Quote }) {
  return (
    <div className="space-y-6">
      <QuoteTotalsPanel quote={quote} />

      {/* Additional scheduling info */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Proyección de Cierre
        </h4>
        <div className="space-y-1">
          <InfoRow
            label="Mes estimado de cierre"
            value={quote.estimated_close_month ?? '—'}
          />
          <InfoRow
            label="Semana estimada de cierre"
            value={quote.estimated_close_week ?? '—'}
          />
          <InfoRow
            label="Fecha estimada de facturación"
            value={
              quote.estimated_billing_date
                ? format(
                    new Date(quote.estimated_billing_date),
                    "d 'de' MMMM yyyy",
                    { locale: es },
                  )
                : '—'
            }
          />
        </div>
      </div>

      {/* Credit status */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Estado de Crédito
        </h4>
        <div className="space-y-1">
          <InfoRow
            label="Crédito validado"
            value={
              <Badge variant={quote.credit_validated ? 'default' : 'outline'}>
                {quote.credit_validated ? 'Sí' : 'No'}
              </Badge>
            }
          />
          <InfoRow
            label="Crédito bloqueado"
            value={
              quote.credit_blocked ? (
                <Badge variant="destructive">Bloqueado</Badge>
              ) : (
                <Badge variant="outline">No bloqueado</Badge>
              )
            }
          />
          {quote.credit_block_reason && (
            <InfoRow
              label="Razón de bloqueo"
              value={quote.credit_block_reason}
              className="text-red-600 dark:text-red-400"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

export function QuoteDetailModal({
  quote,
  open,
  onOpenChange,
  onEdit,
  onAction,
}: QuoteDetailModalProps) {
  if (!quote) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl" />
      </Dialog>
    );
  }

  const statusInfo = STATUS_LABELS[quote.status] ?? {
    label: quote.status,
    variant: 'outline' as const,
  };

  const canCreateOrder = [
    'approved',
    'offer_created',
    'negotiation',
    'pending_oc',
  ].includes(quote.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-lg font-bold">
                Cotización #{quote.quote_number}
              </DialogTitle>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <PermissionGate permission="quotes:update">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(quote)}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Editar
                </Button>
              </PermissionGate>

              <PermissionGate permission="quotes:read">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onAction({ type: 'generate-pdf', quote })
                  }
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Generar PDF
                </Button>
              </PermissionGate>

              <PermissionGate permission="quotes:update">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onAction({ type: 'send-to-client', quote })
                  }
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Enviar
                </Button>
              </PermissionGate>

              {canCreateOrder && (
                <PermissionGate permission="orders:create">
                  <Button
                    size="sm"
                    onClick={() =>
                      onAction({ type: 'create-order', quote })
                    }
                  >
                    <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                    Crear Pedido
                  </Button>
                </PermissionGate>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="liquidacion">Liquidación</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <GeneralTab quote={quote} />
          </TabsContent>

          <TabsContent value="productos" className="mt-4">
            <ProductosTab quote={quote} />
          </TabsContent>

          <TabsContent value="liquidacion" className="mt-4">
            <LiquidacionTab quote={quote} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
