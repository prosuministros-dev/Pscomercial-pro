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
import { Checkbox } from '@kit/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Copy } from 'lucide-react';
import { quoteFormSchema, type QuoteFormSchema } from '../_lib/schema';
import type { Quote } from '../_lib/types';
import { QuoteItemsTable } from './quote-items-table';
import { QuoteTotalsPanel } from './quote-totals-panel';
import { FileUploader } from './file-uploader';

interface QuoteFormDialogProps {
  quote?: Quote;
  leadId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (quoteId: string) => void;
}

export function QuoteFormDialog({
  quote,
  leadId,
  open,
  onOpenChange,
  onSuccess,
}: QuoteFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(quote || null);
  const [trm, setTrm] = useState<number>(4000);
  const [customers, setCustomers] = useState<Array<{ id: string; business_name: string }>>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; full_name: string; email: string | null; is_primary: boolean }>>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<QuoteFormSchema>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: quote
      ? {
          customer_id: quote.customer_id,
          contact_id: quote.contact_id || undefined,
          advisor_id: quote.advisor_id,
          quote_date: quote.quote_date.split('T')[0],
          validity_days: quote.validity_days,
          status: quote.status,
          currency: quote.currency,
          payment_terms: quote.payment_terms,
          transport_cost: quote.transport_cost,
          transport_included: quote.transport_included,
          notes: quote.notes || undefined,
          credit_blocked: quote.credit_blocked || false,
          credit_block_reason: quote.credit_block_reason || undefined,
          estimated_close_month: quote.estimated_close_month || undefined,
          estimated_close_week: quote.estimated_close_week || undefined,
          estimated_billing_date: quote.estimated_billing_date || undefined,
        }
      : {
          lead_id: leadId,
          validity_days: 30,
          status: 'draft',
          currency: 'COP',
          payment_terms: 'ANTICIPADO',
          transport_cost: 0,
          transport_included: false,
          credit_blocked: false,
        },
  });

  const currencyValue = watch('currency');
  const transportIncluded = watch('transport_included');

  // Fetch TRM
  useEffect(() => {
    const fetchTRM = async () => {
      try {
        const response = await fetch('/api/trm');
        if (response.ok) {
          const data = await response.json();
          setTrm(data.rate || 4000);
        }
      } catch (error) {
        console.error('Error fetching TRM:', error);
      }
    };
    fetchTRM();
  }, []);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers?limit=1000');
        if (response.ok) {
          const data = await response.json();
          setCustomers(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch contacts when customer changes
  const selectedCustomerId = watch('customer_id');
  useEffect(() => {
    if (!selectedCustomerId) {
      setContacts([]);
      return;
    }
    setLoadingContacts(true);
    fetch(`/api/customers/${selectedCustomerId}/contacts`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setContacts(data.data || []))
      .catch(() => setContacts([]))
      .finally(() => setLoadingContacts(false));
  }, [selectedCustomerId]);

  const onSubmit = async (data: QuoteFormSchema) => {
    setIsSubmitting(true);

    try {
      const url = '/api/quotes';
      const method = quote ? 'PUT' : 'POST';
      const body = quote ? { ...data, id: quote.id } : data;

      // Add TRM if currency is USD
      if (data.currency === 'USD') {
        (body as typeof body & { trm_applied: number }).trm_applied = trm;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar la cotización');
      }

      const savedQuote = await response.json();

      toast.success(
        quote ? 'Cotización actualizada' : 'Cotización creada',
        {
          description: quote
            ? 'La cotización se ha actualizado correctamente'
            : `Cotización #${savedQuote.quote_number} creada exitosamente`,
        }
      );

      setCurrentQuote(savedQuote);
      onSuccess?.(savedQuote.id);

      if (!quote) {
        // If new quote, keep dialog open to add items
        // reset(); -- don't reset, let them add items
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error('Error', {
        description:
          error instanceof Error ? error.message : 'No se pudo guardar la cotización',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleItemsChange = async () => {
    if (!currentQuote) return;

    // Refresh quote to get updated totals
    try {
      const response = await fetch(`/api/quotes?limit=1&search=${currentQuote.quote_number}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          setCurrentQuote(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error refreshing quote:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {quote ? `Editar Cotización #${quote.quote_number}` : 'Nueva Cotización'}
          </DialogTitle>
          <DialogDescription>
            {quote
              ? 'Modifica la información de la cotización y sus items'
              : 'Completa la información de la cotización y agrega los items'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Cliente y Fechas */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy-600 dark:text-cyan-400">
                  Información General
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_id">
                      Cliente <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch('customer_id')}
                      onValueChange={(value) => {
                        setValue('customer_id', value);
                        setValue('contact_id', undefined);
                      }}
                      disabled={!!quote || isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.business_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.customer_id && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.customer_id.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contact_id">Contacto</Label>
                    <Select
                      value={watch('contact_id') || ''}
                      onValueChange={(v) => setValue('contact_id', v === '_none' ? undefined : v)}
                      disabled={!selectedCustomerId || isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingContacts ? 'Cargando...' : 'Contacto (opcional)'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Sin contacto</SelectItem>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.full_name}{c.is_primary ? ' (Principal)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quote_date">Fecha</Label>
                    <Input
                      id="quote_date"
                      type="date"
                      {...register('quote_date')}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label htmlFor="validity_days">Validez (días)</Label>
                    <Input
                      id="validity_days"
                      type="number"
                      {...register('validity_days', { valueAsNumber: true })}
                      disabled={isSubmitting}
                      min="1"
                      max="365"
                    />
                  </div>

                  <div>
                    <Label htmlFor="payment_terms">Forma de Pago</Label>
                    <Select
                      value={watch('payment_terms')}
                      onValueChange={(value) => setValue('payment_terms', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ANTICIPADO">Anticipado</SelectItem>
                        <SelectItem value="CONTRA ENTREGA">Contra Entrega</SelectItem>
                        <SelectItem value="CRÉDITO 8 DÍAS">Crédito 8 Días</SelectItem>
                        <SelectItem value="CRÉDITO 15 DÍAS">Crédito 15 Días</SelectItem>
                        <SelectItem value="CRÉDITO 30 DÍAS">Crédito 30 Días</SelectItem>
                        <SelectItem value="CRÉDITO 45 DÍAS">Crédito 45 Días</SelectItem>
                        <SelectItem value="CRÉDITO 60 DÍAS">Crédito 60 Días</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currency">Moneda</Label>
                    <Select
                      value={currencyValue}
                      onValueChange={(value) => setValue('currency', value as 'COP' | 'USD')}
                      disabled={isSubmitting || !!currentQuote}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COP">COP (Pesos)</SelectItem>
                        <SelectItem value="USD">USD (Dólares)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={watch('status')}
                      onValueChange={(value) => setValue('status', value as QuoteFormSchema['status'])}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="offer_created">Oferta Creada</SelectItem>
                        <SelectItem value="negotiation">En Negociación</SelectItem>
                        <SelectItem value="risk">Riesgo</SelectItem>
                        <SelectItem value="pending_oc">Pendiente OC</SelectItem>
                        <SelectItem value="approved">Aprobada</SelectItem>
                        <SelectItem value="rejected">Rechazada</SelectItem>
                        <SelectItem value="lost">Perdida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Transporte */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy-600 dark:text-cyan-400">
                  Transporte
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="transport_included"
                      checked={transportIncluded}
                      onCheckedChange={(checked) =>
                        setValue('transport_included', checked as boolean)
                      }
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="transport_included" className="cursor-pointer">
                      Transporte incluido en items
                    </Label>
                  </div>

                  {!transportIncluded && (
                    <div>
                      <Label htmlFor="transport_cost">Costo de Transporte</Label>
                      <Input
                        id="transport_cost"
                        type="number"
                        {...register('transport_cost', { valueAsNumber: true })}
                        disabled={isSubmitting}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Fechas de Cierre - TAREA 1.4.16 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy-600 dark:text-cyan-400">
                  Fechas Estimadas de Cierre
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="estimated_close_month">Mes de Cierre</Label>
                    <Input
                      id="estimated_close_month"
                      type="month"
                      {...register('estimated_close_month')}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_close_week">Semana</Label>
                    <Input
                      id="estimated_close_week"
                      type="week"
                      {...register('estimated_close_week')}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_billing_date">Fecha Facturación</Label>
                    <Input
                      id="estimated_billing_date"
                      type="date"
                      {...register('estimated_billing_date')}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Bloqueo de Cartera - TAREA 1.4.13 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-navy-600 dark:text-cyan-400">
                  Estado de Cartera
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="credit_blocked"
                      checked={watch('credit_blocked') || false}
                      onCheckedChange={(checked) =>
                        setValue('credit_blocked', checked as boolean)
                      }
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="credit_blocked" className="cursor-pointer">
                      Cliente con bloqueo de cartera
                    </Label>
                  </div>
                  {watch('credit_blocked') && (
                    <div>
                      <Label htmlFor="credit_block_reason">Motivo del Bloqueo</Label>
                      <Input
                        id="credit_block_reason"
                        {...register('credit_block_reason')}
                        disabled={isSubmitting}
                        placeholder="Razón del bloqueo..."
                      />
                    </div>
                  )}
                </div>
                {watch('credit_blocked') && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <p className="text-sm text-destructive font-medium">
                        Este cliente tiene bloqueo de cartera. No se podrá crear un pedido desde esta cotización.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas */}
              <div>
                <Label htmlFor="notes">Notas / Observaciones</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  disabled={isSubmitting}
                  rows={3}
                  placeholder="Notas adicionales sobre la cotización..."
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  {currentQuote ? 'Cerrar' : 'Cancelar'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : quote ? (
                    'Actualizar'
                  ) : currentQuote ? (
                    'Guardar Cambios'
                  ) : (
                    'Crear Cotización'
                  )}
                </Button>
              </div>
            </form>

            {/* Items Table (only show if quote exists) */}
            {currentQuote && (
              <div className="mt-6">
                <QuoteItemsTable
                  quoteId={currentQuote.id}
                  currency={currentQuote.currency}
                  trm={trm}
                  items={[]} // Will be loaded by the component
                  onItemsChange={handleItemsChange}
                />
              </div>
            )}

            {/* Adjuntos - TAREA 1.4.17 */}
            {currentQuote && (
              <div className="mt-6">
                <FileUploader
                  entityType="quote"
                  entityId={currentQuote.id}
                  bucket="documents"
                />
              </div>
            )}
          </div>

          {/* Totals Panel - 1 column */}
          <div className="lg:col-span-1">
            {currentQuote && <QuoteTotalsPanel quote={currentQuote} />}
            {!currentQuote && (
              <div className="p-6 text-center text-gray-500 border-2 border-dashed rounded-lg">
                <p className="mb-2">💡 Panel de Liquidación</p>
                <p className="text-sm">
                  Los totales aparecerán aquí después de crear la cotización y agregar items.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
