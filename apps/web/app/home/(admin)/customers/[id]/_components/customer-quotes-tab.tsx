'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { FileText, Loader2 } from 'lucide-react';
import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

import { useCustomerHistory } from '../../_lib/customer-queries';

interface CustomerQuotesTabProps {
  customerId: string;
}

const QUOTE_STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Borrador', className: 'bg-muted text-muted-foreground' },
  creacion_oferta: { label: 'Creación Oferta', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  negociacion: { label: 'Negociación', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  riesgo: { label: 'Riesgo', className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  pendiente_oc: { label: 'Pendiente OC', className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
  ganada: { label: 'Ganada', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  perdida: { label: 'Perdida', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
};

export function CustomerQuotesTab({ customerId }: CustomerQuotesTabProps) {
  const { data, isLoading, error } = useCustomerHistory(customerId, 'quotes');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  const quotes = data?.quotes?.data || [];

  if (quotes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium">Sin cotizaciones</p>
        <p className="text-xs text-muted-foreground">Este cliente aún no tiene cotizaciones registradas</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {data?.quotes?.total || 0} cotizaciones
        </h3>
      </div>

      <div className="space-y-2">
        {quotes.map((quote, index) => {
          const statusInfo = QUOTE_STATUS_MAP[quote.status] || { label: quote.status, className: '' };

          return (
            <motion.div
              key={quote.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <Link
                        href={`/home/quotes`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {quote.consecutive || 'Sin consecutivo'}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {new Date(quote.created_at).toLocaleDateString('es-CO')}
                        {quote.advisor?.full_name && ` · ${quote.advisor.full_name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {quote.total_cop > 0 && (
                        <p className="text-sm font-medium">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(quote.total_cop)}
                        </p>
                      )}
                    </div>
                    <Badge className={statusInfo.className}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
