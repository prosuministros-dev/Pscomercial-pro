'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'motion/react';
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
import { Badge } from '@kit/ui/badge';
import { Card } from '@kit/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@kit/ui/popover';
import { toast } from 'sonner';
import {
  Loader2,
  AlertTriangle,
  Trash2,
  Search,
  Package,
  DollarSign,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { quoteFormSchema, type QuoteFormSchema } from '../_lib/schema';
import type { Quote } from '../_lib/types';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit_cost_usd: number;
  unit_cost_cop: number;
  suggested_price_cop: number | null;
  currency: string;
}

interface QuoteItemLocal {
  /** DB id – undefined for items not yet persisted */
  id?: string;
  product_id?: string;
  sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  discount_pct: number;
  tax_pct: number;
  sort_order: number;
}

interface QuoteFormDialogProps {
  quote?: Quote;
  leadId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (quoteId: string) => void;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function calcItemTotals(item: QuoteItemLocal) {
  const gross = item.unit_price * item.quantity;
  const discountAmount = gross * (item.discount_pct / 100);
  const subtotal = gross - discountAmount;
  const taxAmount = subtotal * (item.tax_pct / 100);
  const total = subtotal + taxAmount;
  const marginPct =
    item.unit_price > 0
      ? ((item.unit_price - item.cost_price) / item.unit_price) * 100
      : 0;
  return { subtotal, discountAmount, taxAmount, total, marginPct };
}

function calcQuoteTotals(items: QuoteItemLocal[], transportCost = 0) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  let totalCost = 0;

  items.forEach((item) => {
    const t = calcItemTotals(item);
    subtotal += t.subtotal;
    totalDiscount += t.discountAmount;
    totalTax += t.taxAmount;
    totalCost += item.cost_price * item.quantity;
  });

  const total = subtotal + totalTax + transportCost;
  const marginPct = total > 0 ? ((total - totalCost) / total) * 100 : 0;
  const profit = total - totalCost;

  return { subtotal, totalDiscount, totalTax, total, totalCost, marginPct, profit };
}

const fmtCurrency = (amount: number, currency: string = 'COP') =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function QuoteFormDialog({
  quote,
  leadId,
  open,
  onOpenChange,
  onSuccess,
}: QuoteFormDialogProps) {
  const isEditMode = !!quote;

  /* ── State ────────────────────────────────────────────────────────────── */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trm, setTrm] = useState<number>(4000);
  const [items, setItems] = useState<QuoteItemLocal[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [formCollapsed, setFormCollapsed] = useState(false);

  // Product search
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<ProductOption[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [productSearchError, setProductSearchError] = useState<string | null>(null);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const productSearchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Customers & contacts
  const [customers, setCustomers] = useState<Array<{ id: string; business_name: string }>>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; full_name: string; email: string | null; is_primary: boolean }>>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  /* ── Form ─────────────────────────────────────────────────────────────── */
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
          validity_days: 5,
          status: 'draft',
          currency: 'COP',
          payment_terms: 'ANTICIPADO',
          transport_cost: 0,
          transport_included: false,
          credit_blocked: false,
        },
  });

  const currencyValue = watch('currency') || 'COP';
  const transportIncluded = watch('transport_included');
  const transportCost = watch('transport_cost') || 0;

  /* ── Computed totals ──────────────────────────────────────────────────── */
  const totals = useMemo(
    () => calcQuoteTotals(items, transportIncluded ? 0 : transportCost),
    [items, transportIncluded, transportCost],
  );

  /* ── Effects ──────────────────────────────────────────────────────────── */

  // Sync form when dialog opens
  useEffect(() => {
    if (!open) return;
    setItems([]);
    setFormCollapsed(false);
    setProductSearchTerm('');
    setProductSearchResults([]);

    if (quote) {
      reset({
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
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quote]);

  // Load existing items for edit mode
  useEffect(() => {
    if (!open || !quote) return;
    setIsLoadingItems(true);
    fetch(`/api/quotes/${quote.id}/items`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : data.data || [];
        setItems(
          list.map((it: Record<string, unknown>, i: number) => ({
            id: it.id as string,
            product_id: (it.product_id as string) || undefined,
            sku: (it.sku as string) || '',
            description: (it.description as string) || '',
            quantity: (it.quantity as number) || 1,
            unit_price: (it.unit_price as number) || 0,
            cost_price: (it.cost_price as number) || 0,
            discount_pct: (it.discount_pct as number) || 0,
            tax_pct: (it.tax_pct as number) ?? 19,
            sort_order: (it.sort_order as number) || i,
          })),
        );
      })
      .catch(() => setItems([]))
      .finally(() => setIsLoadingItems(false));
  }, [open, quote]);

  // Fetch TRM
  useEffect(() => {
    fetch('/api/trm')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (json?.data?.rate) setTrm(json.data.rate); })
      .catch(() => {});
  }, []);

  // Fetch customers
  useEffect(() => {
    fetch('/api/customers?limit=1000')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setCustomers(d.data || []))
      .catch(() => {});
  }, []);

  // Fetch contacts when customer changes
  const selectedCustomerId = watch('customer_id');
  useEffect(() => {
    if (!selectedCustomerId) { setContacts([]); return; }
    setLoadingContacts(true);
    fetch(`/api/customers/${selectedCustomerId}/contacts`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setContacts(d.data || []))
      .catch(() => setContacts([]))
      .finally(() => setLoadingContacts(false));
  }, [selectedCustomerId]);

  /* ── Product search ───────────────────────────────────────────────────── */
  const searchProducts = useCallback(async (term: string) => {
    setIsSearchingProducts(true);
    setProductSearchError(null);
    try {
      const url =
        term.length >= 2
          ? `/api/products?minimal=true&search=${encodeURIComponent(term)}&limit=20`
          : `/api/products?minimal=true&limit=20`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al buscar productos' }));
        setProductSearchError(err.error || `Error ${res.status}`);
        setProductSearchResults([]);
        return;
      }
      const data = await res.json();
      setProductSearchResults(data.data || []);
    } catch {
      setProductSearchError('Error de conexión al buscar productos');
      setProductSearchResults([]);
    } finally {
      setIsSearchingProducts(false);
    }
  }, []);

  /* ── Item operations ──────────────────────────────────────────────────── */

  const handleAddProduct = (product: ProductOption) => {
    const costPrice = currencyValue === 'USD' ? product.unit_cost_usd : product.unit_cost_cop;
    const unitPrice = product.suggested_price_cop
      ? currencyValue === 'USD'
        ? Math.round(product.suggested_price_cop / trm)
        : product.suggested_price_cop
      : Math.round(costPrice * 1.3);

    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        sku: product.sku,
        description: product.name,
        quantity: 1,
        unit_price: unitPrice,
        cost_price: costPrice,
        discount_pct: 0,
        tax_pct: 19,
        sort_order: prev.length,
      },
    ]);
    setProductSearchTerm('');
    setProductSearchResults([]);
    setAddProductOpen(false);
  };

  const updateItem = (index: number, field: keyof QuoteItemLocal, value: number | string) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index]!, [field]: value };
      return copy;
    });
  };

  const removeItem = async (index: number) => {
    const item = items[index];
    // If editing and item has DB id, delete from API
    if (item?.id && quote) {
      try {
        await fetch(`/api/quotes/${quote.id}/items?item_id=${item.id}`, { method: 'DELETE' });
      } catch {
        toast.error('Error al eliminar el item');
        return;
      }
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddManualItem = () => {
    setItems((prev) => [
      ...prev,
      {
        sku: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        cost_price: 0,
        discount_pct: 0,
        tax_pct: 19,
        sort_order: prev.length,
      },
    ]);
  };

  /* ── Save item to API (edit mode) ─────────────────────────────────────── */
  const saveItemToApi = useCallback(
    async (index: number) => {
      if (!quote) return; // only for edit mode
      const item = items[index];
      if (!item) return;
      const t = calcItemTotals(item);
      const payload = {
        ...item,
        subtotal: t.subtotal,
        discount_amount: t.discountAmount,
        tax_amount: t.taxAmount,
        total: t.total,
        margin_pct: t.marginPct,
      };

      try {
        if (item.id) {
          await fetch(`/api/quotes/${quote.id}/items`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, item_id: item.id }),
          });
        } else if (item.sku || item.description) {
          const res = await fetch(`/api/quotes/${quote.id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const saved = await res.json();
            if (saved?.id) {
              setItems((prev) => {
                const copy = [...prev];
                copy[index] = { ...copy[index]!, id: saved.id };
                return copy;
              });
            }
          }
        }
      } catch {
        // Silent – prevent blocking the UI
      }
    },
    [quote, items],
  );

  /* ── Submit ───────────────────────────────────────────────────────────── */
  const onSubmit = async (data: QuoteFormSchema) => {
    setIsSubmitting(true);
    try {
      const url = '/api/quotes';
      const method = isEditMode ? 'PUT' : 'POST';
      const body: Record<string, unknown> = isEditMode ? { ...data, id: quote!.id } : { ...data };

      if (data.currency === 'USD') body.trm_applied = trm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar la cotización');
      }

      const savedQuote = await res.json();

      // For CREATE mode, save all items
      if (!isEditMode && items.length > 0) {
        const results = await Promise.allSettled(
          items.map((item, idx) => {
            const t = calcItemTotals(item);
            return fetch(`/api/quotes/${savedQuote.id}/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...item,
                sort_order: idx,
                subtotal: t.subtotal,
                discount_amount: t.discountAmount,
                tax_amount: t.taxAmount,
                total: t.total,
                margin_pct: t.marginPct,
              }),
            });
          }),
        );

        const failedCount = results.filter((r) => r.status === 'rejected').length;
        if (failedCount > 0) {
          toast.warning(`${failedCount} item(s) no se pudieron guardar`);
        }
      }

      toast.success(isEditMode ? 'Cotización actualizada' : 'Cotización creada', {
        description: isEditMode
          ? 'La cotización se ha actualizado correctamente'
          : `Cotización #${savedQuote.quote_number} creada con ${items.length} item(s)`,
      });

      onSuccess?.(savedQuote.id);
      onOpenChange(false);
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'No se pudo guardar la cotización',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-medium">
                {isEditMode
                  ? `Editar Cotización #${quote!.quote_number}`
                  : 'Nueva Cotización'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isEditMode
                  ? 'Modifica la información y los productos de la cotización'
                  : 'Completa los datos y agrega los productos a cotizar'}
              </DialogDescription>
            </div>
            {trm > 0 && (
              <Badge variant="outline" className="shrink-0 gap-1">
                <DollarSign className="h-3 w-3" />
                TRM: {fmtCurrency(trm, 'COP')}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row">
          {/* ── Left: Form + Products ──────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* ── Collapsible form section ───────────────────────────── */}
              <div className="px-6 pt-4">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-semibold text-accent dark:text-primary mb-3 hover:opacity-80 transition-opacity"
                  onClick={() => setFormCollapsed(!formCollapsed)}
                >
                  {formCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                  Información General
                  {formCollapsed && watch('customer_id') && (
                    <span className="text-xs font-normal text-muted-foreground ml-2">
                      {customers.find((c) => c.id === watch('customer_id'))?.business_name || ''}
                      {' · '}{currencyValue}{' · '}{watch('payment_terms')}
                    </span>
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {!formCollapsed && (
                    <motion.div
                      key="form-fields"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {/* Row 1: Cliente, Contacto, Fecha, Validez */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        <div>
                          <Label className="text-xs">
                            Cliente <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={watch('customer_id')}
                            onValueChange={(v) => {
                              setValue('customer_id', v);
                              setValue('contact_id', undefined);
                            }}
                            disabled={isEditMode || isSubmitting}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecciona cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.business_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.customer_id && (
                            <p className="text-xs text-destructive mt-0.5">{errors.customer_id.message}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-xs">Contacto</Label>
                          <Select
                            value={watch('contact_id') || '_none'}
                            onValueChange={(v) => setValue('contact_id', v === '_none' ? undefined : v)}
                            disabled={!selectedCustomerId || isSubmitting}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={loadingContacts ? 'Cargando...' : 'Contacto'} />
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
                          <Label className="text-xs">Fecha</Label>
                          <Input
                            type="date"
                            className="h-9"
                            {...register('quote_date')}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Validez (días)</Label>
                          <Input
                            type="number"
                            className="h-9"
                            {...register('validity_days', { valueAsNumber: true })}
                            disabled={isSubmitting}
                            min="1"
                            max="365"
                          />
                        </div>
                      </div>

                      {/* Row 2: Forma pago, Moneda, Estado, Transporte */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        <div>
                          <Label className="text-xs">Forma de Pago</Label>
                          <Select
                            value={watch('payment_terms')}
                            onValueChange={(v) => setValue('payment_terms', v)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="h-9">
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
                          <Label className="text-xs">Moneda</Label>
                          <Select
                            value={currencyValue}
                            onValueChange={(v) => setValue('currency', v as 'COP' | 'USD')}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="COP">COP (Pesos)</SelectItem>
                              <SelectItem value="USD">USD (Dólares)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Estado</Label>
                          <Select
                            value={watch('status')}
                            onValueChange={(v) => setValue('status', v as QuoteFormSchema['status'])}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Borrador</SelectItem>
                              <SelectItem value="offer_created">Oferta Creada</SelectItem>
                              <SelectItem value="negotiation">En Negociación</SelectItem>
                              <SelectItem value="risk">Riesgo</SelectItem>
                              <SelectItem value="pending_oc">Pendiente OC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-end gap-2">
                          <div className="flex items-center gap-2 h-9">
                            <Checkbox
                              id="transport_included"
                              checked={transportIncluded}
                              onCheckedChange={(c) => setValue('transport_included', c as boolean)}
                              disabled={isSubmitting}
                            />
                            <Label htmlFor="transport_included" className="text-xs cursor-pointer whitespace-nowrap">
                              Transporte incluido
                            </Label>
                          </div>
                          {!transportIncluded && (
                            <Input
                              type="number"
                              className="h-9 w-28"
                              placeholder="$ Transp."
                              {...register('transport_cost', { valueAsNumber: true })}
                              disabled={isSubmitting}
                              min="0"
                            />
                          )}
                        </div>
                      </div>

                      {/* Row 3: Fechas cierre, Cartera, Notas */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        <div>
                          <Label className="text-xs">Mes Cierre</Label>
                          <Input type="month" className="h-9" {...register('estimated_close_month')} disabled={isSubmitting} />
                        </div>
                        <div>
                          <Label className="text-xs">Semana Cierre</Label>
                          <Input type="week" className="h-9" {...register('estimated_close_week')} disabled={isSubmitting} />
                        </div>
                        <div>
                          <Label className="text-xs">Fecha Facturación</Label>
                          <Input type="date" className="h-9" {...register('estimated_billing_date')} disabled={isSubmitting} />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex items-center gap-2 h-9">
                            <Checkbox
                              id="credit_blocked"
                              checked={watch('credit_blocked') || false}
                              onCheckedChange={(c) => setValue('credit_blocked', c as boolean)}
                              disabled={isSubmitting}
                            />
                            <Label htmlFor="credit_blocked" className="text-xs cursor-pointer text-destructive">
                              Bloqueo cartera
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Credit block warning */}
                      {watch('credit_blocked') && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-3"
                        >
                          <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-destructive font-medium">
                                Cliente con bloqueo de cartera
                              </p>
                              <Input
                                className="h-7 mt-1 text-xs"
                                placeholder="Motivo del bloqueo..."
                                {...register('credit_block_reason')}
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Notes */}
                      <div className="mb-4">
                        <Label className="text-xs">Notas / Observaciones</Label>
                        <Textarea
                          {...register('notes')}
                          disabled={isSubmitting}
                          rows={2}
                          placeholder="Notas adicionales..."
                          className="resize-none"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Products Section ───────────────────────────────────── */}
              <div className="px-6 pb-4">
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-accent dark:text-primary flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Productos de la Cotización
                      {items.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {items.length} item{items.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddManualItem}
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Item manual
                    </Button>
                  </div>

                  {/* Product search */}
                  <Popover open={addProductOpen} onOpenChange={setAddProductOpen}>
                    <PopoverTrigger asChild>
                      <div className="relative mb-3">
                        {isSearchingProducts ? (
                          <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 text-primary animate-spin pointer-events-none" />
                        ) : (
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        )}
                        <Input
                          placeholder="Buscar producto por nombre o SKU..."
                          value={productSearchTerm}
                          className="pl-9 h-9"
                          onChange={(e) => {
                            setProductSearchTerm(e.target.value);
                            clearTimeout(productSearchTimer.current);
                            productSearchTimer.current = setTimeout(
                              () => searchProducts(e.target.value),
                              300,
                            );
                            setAddProductOpen(true);
                          }}
                          onFocus={() => {
                            setAddProductOpen(true);
                            if (productSearchResults.length === 0 && !isSearchingProducts) {
                              searchProducts(productSearchTerm);
                            }
                          }}
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      {productSearchError ? (
                        <div className="p-3 flex items-center gap-2 text-sm text-destructive">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>{productSearchError}</span>
                        </div>
                      ) : isSearchingProducts ? (
                        <div className="p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Buscando productos...
                        </div>
                      ) : productSearchResults.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p>
                            {productSearchTerm.length === 0
                              ? 'Escribe para buscar productos'
                              : `Sin resultados para "${productSearchTerm}"`}
                          </p>
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto">
                          {productSearchResults.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-secondary cursor-pointer border-b border-border last:border-0 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleAddProduct(p);
                              }}
                            >
                              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                                {p.sku}
                              </span>
                              <span className="text-sm flex-1 truncate">{p.name}</span>
                              <span className="text-xs text-muted-foreground font-mono shrink-0">
                                {fmtCurrency(
                                  currencyValue === 'USD' ? p.unit_cost_usd : p.unit_cost_cop,
                                  currencyValue,
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>

                  {/* Items table */}
                  {isLoadingItems ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Cargando items...
                    </div>
                  ) : items.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-2 border-dashed border-border rounded-lg py-8 text-center"
                    >
                      <Package className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        No hay productos aún. Usa el buscador de arriba para agregar productos.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-lg border border-border overflow-hidden"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left px-2 py-2 text-xs font-medium text-muted-foreground w-8">#</th>
                              <th className="text-left px-2 py-2 text-xs font-medium text-muted-foreground w-24">SKU</th>
                              <th className="text-left px-2 py-2 text-xs font-medium text-muted-foreground min-w-[160px]">Producto</th>
                              <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground w-16">Cant.</th>
                              <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground w-28">P. Unitario</th>
                              <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground w-16">Desc%</th>
                              <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground w-14">IVA</th>
                              <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground w-28">Subtotal</th>
                              <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground w-28">Total</th>
                              <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground w-28">Costo</th>
                              <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground w-16">Margen</th>
                              <th className="w-8"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            <AnimatePresence initial={false}>
                              {items.map((item, i) => {
                                const t = calcItemTotals(item);
                                return (
                                  <motion.tr
                                    key={item.id || `new-${i}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="hover:bg-muted/30 group"
                                  >
                                    <td className="px-2 py-1.5 text-xs text-muted-foreground">{i + 1}</td>
                                    <td className="px-2 py-1.5">
                                      <Input
                                        value={item.sku}
                                        onChange={(e) => updateItem(i, 'sku', e.target.value)}
                                        onBlur={() => saveItemToApi(i)}
                                        className="h-7 text-xs font-mono w-24"
                                        placeholder="SKU"
                                      />
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <Input
                                        value={item.description}
                                        onChange={(e) => updateItem(i, 'description', e.target.value)}
                                        onBlur={() => saveItemToApi(i)}
                                        className="h-7 text-xs min-w-[160px]"
                                        placeholder="Descripción del producto"
                                      />
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <Input
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(i, 'quantity', Number(e.target.value) || 0)}
                                        onBlur={() => saveItemToApi(i)}
                                        className="h-7 text-xs text-right w-16"
                                      />
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(i, 'unit_price', Number(e.target.value) || 0)}
                                        onBlur={() => saveItemToApi(i)}
                                        className="h-7 text-xs text-right w-28"
                                      />
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={item.discount_pct}
                                        onChange={(e) => updateItem(i, 'discount_pct', Number(e.target.value) || 0)}
                                        onBlur={() => saveItemToApi(i)}
                                        className="h-7 text-xs text-right w-16"
                                      />
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <Select
                                        value={String(item.tax_pct)}
                                        onValueChange={(v) => {
                                          updateItem(i, 'tax_pct', Number(v));
                                          // For edit mode, save after a tick
                                          if (quote) setTimeout(() => saveItemToApi(i), 50);
                                        }}
                                      >
                                        <SelectTrigger className="h-7 text-xs w-14 px-1">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="0">0%</SelectItem>
                                          <SelectItem value="5">5%</SelectItem>
                                          <SelectItem value="19">19%</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="px-2 py-1.5 text-right font-mono text-xs">
                                      {fmtCurrency(t.subtotal, currencyValue)}
                                    </td>
                                    <td className="px-2 py-1.5 text-right font-mono text-xs font-semibold">
                                      {fmtCurrency(t.total, currencyValue)}
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={item.cost_price}
                                        onChange={(e) => updateItem(i, 'cost_price', Number(e.target.value) || 0)}
                                        onBlur={() => saveItemToApi(i)}
                                        className="h-7 text-xs text-right w-28"
                                      />
                                    </td>
                                    <td className="px-2 py-1.5 text-right">
                                      <span
                                        className={`font-mono text-xs font-semibold ${
                                          t.marginPct < 7
                                            ? 'text-destructive'
                                            : t.marginPct < 9
                                              ? 'text-yellow-600 dark:text-yellow-400'
                                              : 'text-green-600 dark:text-green-400'
                                        }`}
                                      >
                                        {t.marginPct.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="px-1 py-1.5">
                                      <button
                                        type="button"
                                        onClick={() => removeItem(i)}
                                        className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                        title="Eliminar item"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </AnimatePresence>
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* ── Action Buttons ─────────────────────────────────────── */}
              <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {items.length > 0
                    ? `${items.length} producto${items.length > 1 ? 's' : ''} · Total: ${fmtCurrency(totals.total, currencyValue)}`
                    : 'Sin productos agregados'}
                </p>
                <div className="flex gap-3">
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
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : isEditMode ? (
                      'Guardar Cambios'
                    ) : (
                      'Crear Cotización'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* ── Right: Totals Panel ────────────────────────────────────── */}
          <div className="w-full lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-border p-4 bg-muted/20">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="sticky top-4"
            >
              <Card className="p-4 bg-gradient-to-br from-background to-muted/50">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-accent dark:text-primary">
                  <DollarSign className="h-4 w-4" />
                  Liquidación
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-mono font-medium">{fmtCurrency(totals.subtotal, currencyValue)}</span>
                  </div>

                  {totals.totalDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Descuento:</span>
                      <span className="font-mono font-medium text-destructive">
                        -{fmtCurrency(totals.totalDiscount, currencyValue)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA:</span>
                    <span className="font-mono font-medium">{fmtCurrency(totals.totalTax, currencyValue)}</span>
                  </div>

                  {!transportIncluded && transportCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transporte:</span>
                      <span className="font-mono font-medium">{fmtCurrency(transportCost, currencyValue)}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-semibold">Total Venta:</span>
                    <span className="font-mono font-bold text-lg text-primary">
                      {fmtCurrency(totals.total, currencyValue)}
                    </span>
                  </div>
                </div>

                {/* Cost & Margin Analysis */}
                <div className="mt-4 pt-3 border-t border-border space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Costo Total:</span>
                    <span className="font-mono font-medium">{fmtCurrency(totals.totalCost, currencyValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Utilidad:</span>
                    <span className="font-mono font-medium text-green-600 dark:text-green-400">
                      {fmtCurrency(totals.profit, currencyValue)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-semibold">Margen:</span>
                    <span
                      className={`font-mono font-bold text-lg ${
                        items.length === 0
                          ? 'text-muted-foreground'
                          : totals.marginPct < 7
                            ? 'text-destructive'
                            : totals.marginPct < 9
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {items.length === 0 ? '—' : `${totals.marginPct.toFixed(2)}%`}
                    </span>
                  </div>

                  {/* Margin warning */}
                  {items.length > 0 && totals.marginPct < 7 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 p-2 rounded-md bg-destructive/10 border border-destructive/20"
                    >
                      <p className="text-xs text-destructive font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Margen bajo mínimo (7%). Requiere aprobación.
                      </p>
                    </motion.div>
                  )}

                  {/* Margin health badge */}
                  {items.length > 0 && (
                    <div className="flex justify-center pt-2">
                      <Badge
                        variant={
                          totals.marginPct < 7 ? 'destructive' : totals.marginPct < 9 ? 'outline' : 'default'
                        }
                      >
                        {totals.marginPct < 7 ? 'Bajo Mínimo' : totals.marginPct < 9 ? 'Aceptable' : 'Óptimo'}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Payment & Currency */}
                <div className="mt-4 pt-3 border-t border-border space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Moneda:</span>
                    <span className="font-medium">{currencyValue}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Forma de pago:</span>
                    <span className="font-medium">{watch('payment_terms') || '—'}</span>
                  </div>
                  {currencyValue === 'USD' && trm > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>TRM:</span>
                      <span className="font-medium font-mono">{fmtCurrency(trm, 'COP')}</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
