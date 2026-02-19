'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'motion/react';
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
import { customerFormSchema, type CustomerFormData } from '../_lib/schemas';
import { useCreateCustomer, useUpdateCustomer } from '../_lib/customer-queries';
import type { Customer } from '../_lib/types';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  mode: 'create' | 'edit';
}

const COLOMBIAN_DEPARTMENTS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.',
  'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare',
  'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca',
  'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
  'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre',
  'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada',
];

const PAYMENT_TERMS = [
  { value: 'contado', label: 'Contado' },
  { value: '15_dias', label: '15 días' },
  { value: '30_dias', label: '30 días' },
  { value: '45_dias', label: '45 días' },
  { value: '60_dias', label: '60 días' },
  { value: '90_dias', label: '90 días' },
];

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  mode,
}: CustomerFormDialogProps) {
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      business_name: '',
      nit: '',
      address: '',
      city: '',
      department: '',
      phone: '',
      email: '',
      payment_terms: '',
      status: 'active',
      notes: '',
    },
  });

  const selectedDepartment = watch('department');
  const selectedPaymentTerms = watch('payment_terms');
  const selectedStatus = watch('status');

  // Reset form when dialog opens/closes or customer changes
  useEffect(() => {
    if (open && customer && mode === 'edit') {
      reset({
        business_name: customer.business_name,
        nit: customer.nit,
        address: customer.address || '',
        city: customer.city || '',
        department: customer.department || '',
        phone: customer.phone || '',
        email: customer.email || '',
        payment_terms: customer.payment_terms || '',
        assigned_sales_rep_id: customer.assigned_sales_rep_id || '',
        status: (customer.status as 'active' | 'inactive') || 'active',
        notes: customer.notes || '',
      });
    } else if (open && mode === 'create') {
      reset({
        business_name: '',
        nit: '',
        address: '',
        city: '',
        department: '',
        phone: '',
        email: '',
        payment_terms: '',
        status: 'active',
        notes: '',
      });
    }
  }, [open, customer, mode, reset]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(data);
      } else if (customer) {
        await updateMutation.mutateAsync({ id: customer.id, data });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Crear nuevo cliente' : 'Editar cliente'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Complete la información del nuevo cliente. Los campos marcados con * son obligatorios.'
              : 'Modifique la información del cliente. Los campos marcados con * son obligatorios.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NIT */}
            <div className="space-y-2">
              <Label htmlFor="nit">
                NIT con dígito de verificación *
              </Label>
              <Input
                id="nit"
                {...register('nit')}
                placeholder="123456789-0"
                aria-invalid={errors.nit ? 'true' : 'false'}
                aria-describedby={errors.nit ? 'nit-error' : undefined}
              />
              {errors.nit && (
                <p id="nit-error" className="text-sm text-destructive">
                  {errors.nit.message}
                </p>
              )}
            </div>

            {/* Razón Social */}
            <div className="space-y-2">
              <Label htmlFor="business_name">Razón Social *</Label>
              <Input
                id="business_name"
                {...register('business_name')}
                placeholder="Ej: Empresa S.A.S."
                aria-invalid={errors.business_name ? 'true' : 'false'}
              />
              {errors.business_name && (
                <p className="text-sm text-destructive">
                  {errors.business_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="address">Dirección *</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Calle 123 # 45-67"
              aria-invalid={errors.address ? 'true' : 'false'}
            />
            {errors.address && (
              <p className="text-sm text-destructive">
                {errors.address.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Departamento */}
            <div className="space-y-2">
              <Label htmlFor="department">Departamento *</Label>
              <Select
                value={selectedDepartment}
                onValueChange={(value) => setValue('department', value)}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Seleccione departamento" />
                </SelectTrigger>
                <SelectContent>
                  {COLOMBIAN_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-sm text-destructive">
                  {errors.department.message}
                </p>
              )}
            </div>

            {/* Ciudad */}
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Ej: Bogotá"
                aria-invalid={errors.city ? 'true' : 'false'}
              />
              {errors.city && (
                <p className="text-sm text-destructive">
                  {errors.city.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono Principal *</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Ej: +57 300 123 4567"
                aria-invalid={errors.phone ? 'true' : 'false'}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="ejemplo@empresa.com"
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
              {errors.payment_terms && (
                <p className="text-sm text-destructive">
                  {errors.payment_terms.message}
                </p>
              )}
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleccione estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Observaciones</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Información adicional sobre el cliente..."
              rows={3}
              aria-invalid={errors.notes ? 'true' : 'false'}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">
                {errors.notes.message}
              </p>
            )}
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
              {mode === 'create' ? 'Crear cliente' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
