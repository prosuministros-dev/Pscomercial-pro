'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
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
import { Loader2 } from 'lucide-react';
import { createOrderSchema, type CreateOrderFormData } from '../_lib/schemas';

interface AvailableQuote {
  id: string;
  quote_number: number;
  customer?: { business_name: string };
  total: number;
  currency: string;
}

interface OrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function OrderFormDialog({ open, onOpenChange, onSuccess }: OrderFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableQuotes, setAvailableQuotes] = useState<AvailableQuote[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
  });

  const selectedQuoteId = watch('quote_id');
  const selectedQuote = availableQuotes.find((q) => q.id === selectedQuoteId);

  useEffect(() => {
    if (!open) return;
    setIsLoadingQuotes(true);
    // Fetch quotes that can have orders created (approved, offer_created, negotiation, pending_oc)
    const fetchQuotes = async () => {
      try {
        const statuses = ['approved', 'offer_created', 'negotiation', 'pending_oc'];
        const allQuotes: AvailableQuote[] = [];

        for (const status of statuses) {
          const response = await fetch(`/api/quotes?status=${status}&limit=100`);
          if (response.ok) {
            const data = await response.json();
            allQuotes.push(...(data.data || []));
          }
        }
        setAvailableQuotes(allQuotes);
      } catch (error) {
        console.error('Error fetching available quotes:', error);
      } finally {
        setIsLoadingQuotes(false);
      }
    };
    fetchQuotes();
  }, [open]);

  const onSubmit = async (data: CreateOrderFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al crear el pedido');
      }

      const order = await response.json();
      toast.success('Pedido creado', {
        description: `Pedido #${order.order_number} creado exitosamente`,
      });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al crear el pedido',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Pedido</DialogTitle>
          <DialogDescription>
            Crea un pedido a partir de una cotización aprobada
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Quote selector */}
          <div>
            <Label>Cotización <span className="text-red-500">*</span></Label>
            {isLoadingQuotes ? (
              <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando cotizaciones...
              </div>
            ) : (
              <Select
                value={selectedQuoteId || ''}
                onValueChange={(value) => setValue('quote_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una cotización" />
                </SelectTrigger>
                <SelectContent>
                  {availableQuotes.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      #{q.quote_number} — {q.customer?.business_name || 'Sin cliente'} — {new Intl.NumberFormat('es-CO', { style: 'currency', currency: q.currency, minimumFractionDigits: 0 }).format(q.total)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.quote_id && (
              <p className="text-xs text-red-500 mt-1">{errors.quote_id.message}</p>
            )}
          </div>

          {/* Selected quote summary */}
          {selectedQuote && (
            <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg text-sm">
              <p className="font-medium">Cotización #{selectedQuote.quote_number}</p>
              <p className="text-gray-600 dark:text-gray-300">
                {selectedQuote.customer?.business_name} — {new Intl.NumberFormat('es-CO', { style: 'currency', currency: selectedQuote.currency, minimumFractionDigits: 0 }).format(selectedQuote.total)}
              </p>
            </div>
          )}

          {/* Billing type */}
          <div className="space-y-2 pt-2 border-t">
            <Label>Tipo de Facturación</Label>
            <Select
              value={watch('billing_type') || 'total'}
              onValueChange={(value) => setValue('billing_type', value as 'total' | 'parcial')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo de facturación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Facturación Total</SelectItem>
                <SelectItem value="parcial">Facturación Parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Delivery info */}
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Información de Entrega (opcional)
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="delivery_address">Dirección</Label>
                <Input
                  id="delivery_address"
                  {...register('delivery_address')}
                  placeholder="Dirección de entrega"
                />
              </div>
              <div>
                <Label htmlFor="delivery_city">Ciudad</Label>
                <Input
                  id="delivery_city"
                  {...register('delivery_city')}
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <Label htmlFor="delivery_contact">Contacto</Label>
                <Input
                  id="delivery_contact"
                  {...register('delivery_contact')}
                  placeholder="Persona de contacto"
                />
              </div>
              <div>
                <Label htmlFor="delivery_phone">Teléfono</Label>
                <Input
                  id="delivery_phone"
                  {...register('delivery_phone')}
                  placeholder="Teléfono"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expected_delivery_date">Fecha esperada de entrega</Label>
              <Input
                id="expected_delivery_date"
                type="date"
                {...register('expected_delivery_date')}
              />
            </div>

            <div>
              <Label htmlFor="delivery_notes">Notas de entrega</Label>
              <Textarea
                id="delivery_notes"
                {...register('delivery_notes')}
                rows={2}
                placeholder="Instrucciones especiales de entrega..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedQuoteId}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Pedido'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
