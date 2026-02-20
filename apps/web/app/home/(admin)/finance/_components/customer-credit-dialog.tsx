'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { Label } from '@kit/ui/label';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useBlockCustomer, useUnblockCustomer } from '../_lib/finance-queries';
import type { CustomerCartera } from '../_lib/types';

interface CustomerCreditDialogProps {
  customer: CustomerCartera | null;
  mode: 'block' | 'unblock';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerCreditDialog({
  customer,
  mode,
  open,
  onOpenChange,
}: CustomerCreditDialogProps) {
  const blockMutation = useBlockCustomer();
  const unblockMutation = useUnblockCustomer();
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!customer) return;

    if (mode === 'block') {
      if (!reason.trim()) return;
      await blockMutation.mutateAsync({ customerId: customer.id, block_reason: reason });
    } else {
      await unblockMutation.mutateAsync(customer.id);
    }

    setReason('');
    onOpenChange(false);
  };

  const isPending = blockMutation.isPending || unblockMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'block' ? (
              <>
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Bloquear Cliente
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-green-500" />
                Desbloquear Cliente
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'block'
              ? `¿Estás seguro de bloquear a "${customer?.business_name}"? No podrá generar pedidos nuevos.`
              : `¿Deseas desbloquear a "${customer?.business_name}"? Podrá generar pedidos nuevamente.`}
          </DialogDescription>
        </DialogHeader>

        {mode === 'block' && (
          <div className="space-y-2">
            <Label>Motivo del bloqueo *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Cartera vencida mayor a 60 días..."
              rows={3}
            />
          </div>
        )}

        {mode === 'unblock' && customer?.block_reason && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Motivo del bloqueo actual:</p>
            <p className="text-sm">{customer.block_reason}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || (mode === 'block' && !reason.trim())}
            variant={mode === 'block' ? 'destructive' : 'default'}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {mode === 'block' ? 'Bloquear' : 'Desbloquear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
