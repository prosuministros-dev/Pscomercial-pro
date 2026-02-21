'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Loader2, CheckCircle2, XCircle, Search, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { financeKeys } from '../_lib/finance-queries';

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string;
  invoice_date: string;
  due_date: string | null;
  currency: string;
  total: number;
  status: string;
  payment_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
  customer?: {
    id: string;
    business_name: string;
    nit: string;
  };
  order?: {
    id: string;
    order_number: number;
  };
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'outline' | 'secondary' | 'destructive' }> = {
  pending: { label: 'Pendiente', variant: 'outline' },
  partial: { label: 'Pago Parcial', variant: 'secondary' },
  paid: { label: 'Pagada', variant: 'default' },
  overdue: { label: 'Vencida', variant: 'destructive' },
  cancelled: { label: 'Anulada', variant: 'destructive' },
};

export function PaymentVerificationTab() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [verifyDialog, setVerifyDialog] = useState<Invoice | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transferencia');

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: [...financeKeys.all, 'pending-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(id, business_name, nit),
          order:orders(id, order_number)
        `)
        .in('status', ['pending', 'partial', 'overdue'])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as Invoice[];
    },
    staleTime: 30000,
  });

  const verifyPayment = useMutation({
    mutationFn: async ({
      invoiceId,
      payment_reference,
      payment_method,
    }: {
      invoiceId: string;
      payment_reference: string;
      payment_method: string;
    }) => {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          payment_reference,
          payment_method,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      toast.success('Pago verificado correctamente');
      setVerifyDialog(null);
      setPaymentRef('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al verificar pago');
    },
  });

  const fmt = (n: number, currency = 'COP') =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(n);

  const filtered = invoices.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.customer?.business_name.toLowerCase().includes(q) ||
      inv.customer?.nit.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por factura, cliente o NIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay facturas pendientes de verificación</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => {
                const isOverdue =
                  inv.due_date && new Date(inv.due_date) < new Date() && inv.status !== 'paid';
                return (
                  <TableRow
                    key={inv.id}
                    className={isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                  >
                    <TableCell className="font-mono font-medium">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {inv.customer?.business_name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {inv.customer?.nit}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      #{inv.order?.order_number || '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {fmt(inv.total, inv.currency)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString('es-CO')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_LABELS[inv.status]?.variant || 'outline'}>
                        {STATUS_LABELS[inv.status]?.label || inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setVerifyDialog(inv);
                          setPaymentRef('');
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Verificar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Verify Payment Dialog */}
      <Dialog
        open={!!verifyDialog}
        onOpenChange={(open) => {
          if (!open) setVerifyDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificar Pago</DialogTitle>
          </DialogHeader>

          {verifyDialog && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm font-medium">
                  Factura: {verifyDialog.invoice_number}
                </p>
                <p className="text-sm text-gray-500">
                  {verifyDialog.customer?.business_name} — NIT:{' '}
                  {verifyDialog.customer?.nit}
                </p>
                <p className="text-lg font-bold font-mono mt-1">
                  {fmt(verifyDialog.total, verifyDialog.currency)}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Método de Pago</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="transferencia">Transferencia</option>
                    <option value="consignacion">Consignación</option>
                    <option value="cheque">Cheque</option>
                    <option value="efectivo">Efectivo</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Referencia de Pago
                  </label>
                  <Input
                    placeholder="Ej: TRF-12345678"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!verifyDialog) return;
                if (!paymentRef.trim()) {
                  toast.error('La referencia de pago es obligatoria');
                  return;
                }
                verifyPayment.mutate({
                  invoiceId: verifyDialog.id,
                  payment_reference: paymentRef.trim(),
                  payment_method: paymentMethod,
                });
              }}
              disabled={verifyPayment.isPending}
            >
              {verifyPayment.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1" />
              )}
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
