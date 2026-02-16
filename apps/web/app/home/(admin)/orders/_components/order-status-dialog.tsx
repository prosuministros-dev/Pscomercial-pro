'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { Order } from '../_lib/types';
import { STATUS_TRANSITIONS, STATUS_LABELS } from '../_lib/schemas';

interface OrderStatusDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function OrderStatusDialog({ order, open, onOpenChange, onSuccess }: OrderStatusDialogProps) {
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validTransitions = order ? STATUS_TRANSITIONS[order.status] || [] : [];
  const isCancelling = newStatus === 'cancelled';

  const handleSubmit = async () => {
    if (!order || !newStatus) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar el estado');
      }

      toast.success('Estado actualizado', {
        description: `Pedido #${order.order_number} → ${STATUS_LABELS[newStatus] || newStatus}`,
      });
      handleClose();
      onSuccess?.();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al actualizar el estado',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewStatus('');
    setNotes('');
    onOpenChange(false);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Estado — Pedido #{order.order_number}</DialogTitle>
          <DialogDescription>
            Selecciona el nuevo estado para este pedido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Estado actual:</span>
            <Badge>{STATUS_LABELS[order.status] || order.status}</Badge>
          </div>

          {/* New status selector */}
          <div>
            <Label>Nuevo Estado</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {validTransitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status] || status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cancellation warning */}
          {isCancelling && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Cancelar pedido
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  Esta acción no se puede revertir. Ingresa el motivo de la cancelación.
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="status-notes">
              {isCancelling ? 'Motivo de cancelación *' : 'Notas (opcional)'}
            </Label>
            <Textarea
              id="status-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={
                isCancelling
                  ? 'Ingresa el motivo de la cancelación...'
                  : 'Notas adicionales sobre el cambio de estado...'
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !newStatus || (isCancelling && !notes.trim())}
            className={
              isCancelling
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-cyan-500 hover:bg-cyan-600 text-white'
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : isCancelling ? (
              'Cancelar Pedido'
            ) : (
              'Cambiar Estado'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
