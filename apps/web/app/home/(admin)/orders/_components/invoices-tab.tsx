'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Loader2, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useOrderInvoices, useUpdateInvoiceStatus } from '../_lib/order-queries';
import { INVOICE_STATUS_LABELS } from '../_lib/schemas';
import { InvoiceRegisterDialog } from './invoice-register-dialog';
import type { Invoice } from '../_lib/types';

interface InvoicesTabProps {
  orderId: string;
  currency: string;
}

export function InvoicesTab({ orderId, currency }: InvoicesTabProps) {
  const { data: invoices = [], isLoading } = useOrderInvoices(orderId);
  const [showRegister, setShowRegister] = useState(false);
  const updateStatus = useUpdateInvoiceStatus();

  const fmt = (n: number, cur?: string) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: cur || currency, minimumFractionDigits: 0 }).format(n);

  const handleMarkPaid = async (invoice: Invoice) => {
    try {
      await updateStatus.mutateAsync({
        invoiceId: invoice.id,
        orderId,
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0],
      });
      toast.success('Factura marcada como pagada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error');
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Facturas</h4>
        <Button size="sm" onClick={() => setShowRegister(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Registrar Factura
        </Button>
      </div>

      {(invoices as Invoice[]).length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay facturas registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(invoices as Invoice[]).map((inv) => (
            <div key={inv.id} className="border rounded-lg p-3 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-sm">{inv.invoice_number}</span>
                  <Badge variant={statusColor(inv.status)}>
                    {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  Fecha: {new Date(inv.invoice_date).toLocaleDateString('es-CO')}
                  {inv.due_date && ` — Vence: ${new Date(inv.due_date).toLocaleDateString('es-CO')}`}
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold">{fmt(inv.total, inv.currency)}</p>
                {inv.status === 'pending' && (
                  <Button size="sm" variant="outline" className="mt-1" onClick={() => handleMarkPaid(inv)} disabled={updateStatus.isPending}>
                    Marcar Pagada
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showRegister && (
        <InvoiceRegisterDialog
          orderId={orderId}
          currency={currency}
          open={showRegister}
          onOpenChange={setShowRegister}
        />
      )}
    </div>
  );
}
