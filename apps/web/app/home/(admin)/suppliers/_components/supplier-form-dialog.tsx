'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Textarea } from '@kit/ui/textarea';
import { createSupplierSchema } from '../_lib/schemas';
import { useCreateSupplier, useUpdateSupplier } from '../_lib/supplier-queries';
import type { Supplier } from '../_lib/types';

type SupplierFormInput = {
  name: string;
  nit?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  payment_terms?: string;
  lead_time_days?: number;
  notes?: string;
};

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  mode: 'create' | 'edit';
}

const PAYMENT_TERMS = [
  { value: 'contado', label: 'Contado' },
  { value: '15_dias', label: '15 días' },
  { value: '30_dias', label: '30 días' },
  { value: '45_dias', label: '45 días' },
  { value: '60_dias', label: '60 días' },
  { value: '90_dias', label: '90 días' },
];

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  mode,
}: SupplierFormDialogProps) {
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<SupplierFormInput>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: '',
      nit: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Colombia',
      payment_terms: '',
      notes: '',
    },
  });

  const selectedPaymentTerms = watch('payment_terms');

  useEffect(() => {
    if (open && supplier && mode === 'edit') {
      reset({
        name: supplier.name,
        nit: supplier.nit || '',
        contact_name: supplier.contact_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        country: supplier.country || 'Colombia',
        payment_terms: supplier.payment_terms || '',
        lead_time_days: supplier.lead_time_days || undefined,
        notes: supplier.notes || '',
      });
    } else if (open && mode === 'create') {
      reset({
        name: '',
        nit: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Colombia',
        payment_terms: '',
        notes: '',
      });
    }
  }, [open, supplier, mode, reset]);

  const onSubmit = async (data: SupplierFormInput) => {
    try {
      const payload = { ...data, country: data.country || 'Colombia' };
      if (mode === 'create') {
        await createMutation.mutateAsync(payload as Parameters<typeof createMutation.mutateAsync>[0]);
      } else if (supplier) {
        await updateMutation.mutateAsync({ id: supplier.id, data: payload });
      }
      onOpenChange(false);
    } catch {
      // Error handling is done in the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Crear nuevo proveedor' : 'Editar proveedor'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Complete la información del nuevo proveedor. Los campos marcados con * son obligatorios.'
              : 'Modifique la información del proveedor. Los campos marcados con * son obligatorios.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ej: Proveedor S.A.S."
                aria-invalid={errors.name ? 'true' : 'false'}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* NIT */}
            <div className="space-y-2">
              <Label htmlFor="nit">NIT</Label>
              <Input
                id="nit"
                {...register('nit')}
                placeholder="123456789-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contacto */}
            <div className="space-y-2">
              <Label htmlFor="contact_name">Persona de Contacto</Label>
              <Input
                id="contact_name"
                {...register('contact_name')}
                placeholder="Nombre del contacto"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="ejemplo@proveedor.com"
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+57 300 123 4567"
              />
            </div>

            {/* Ciudad */}
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Ej: Bogotá"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Calle 123 # 45-67"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* País */}
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="Colombia"
              />
            </div>

            {/* Forma de Pago */}
            <div className="space-y-2">
              <Label htmlFor="payment_terms">Forma de Pago</Label>
              <Select
                value={selectedPaymentTerms}
                onValueChange={(value) => setValue('payment_terms', value)}
              >
                <SelectTrigger id="payment_terms">
                  <SelectValue placeholder="Seleccione forma de pago" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map((term) => (
                    <SelectItem key={term.value} value={term.value}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lead Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead_time_days">Tiempo de Entrega (días)</Label>
              <Input
                id="lead_time_days"
                type="number"
                {...register('lead_time_days', { valueAsNumber: true })}
                placeholder="Ej: 15"
                min="1"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Observaciones</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Información adicional sobre el proveedor..."
              rows={3}
            />
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Crear proveedor' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
