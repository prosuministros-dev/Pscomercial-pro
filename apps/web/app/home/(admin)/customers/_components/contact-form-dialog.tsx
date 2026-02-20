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
import { Checkbox } from '@kit/ui/checkbox';
import { contactFormSchema, type ContactFormData } from '../_lib/schemas';
import { useCreateContact, useUpdateContact } from '../_lib/customer-queries';
import type { CustomerContact } from '../_lib/types';

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  contact?: CustomerContact | null;
  mode: 'create' | 'edit';
}

export function ContactFormDialog({
  open,
  onOpenChange,
  customerId,
  contact,
  mode,
}: ContactFormDialogProps) {
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema) as any,
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      position: '',
      is_primary: false,
    },
  });

  const isPrimary = watch('is_primary');

  // Reset form when dialog opens/closes or contact changes
  useEffect(() => {
    if (open && contact && mode === 'edit') {
      reset({
        full_name: contact.full_name,
        phone: contact.phone,
        email: contact.email,
        position: contact.position || '',
        is_primary: contact.is_primary,
      });
    } else if (open && mode === 'create') {
      reset({
        full_name: '',
        phone: '',
        email: '',
        position: '',
        is_primary: false,
      });
    }
  }, [open, contact, mode, reset]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({ customerId, data });
      } else if (contact) {
        await updateMutation.mutateAsync({
          customerId,
          contactId: contact.id,
          data,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Agregar contacto' : 'Editar contacto'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Complete la información del nuevo contacto. Todos los campos son obligatorios.'
              : 'Modifique la información del contacto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo *</Label>
            <Input
              id="full_name"
              {...register('full_name')}
              placeholder="Ej: Juan Pérez"
              aria-invalid={errors.full_name ? 'true' : 'false'}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              {...register('position')}
              placeholder="Ej: Gerente de Compras"
              aria-invalid={errors.position ? 'true' : 'false'}
            />
            {errors.position && (
              <p className="text-sm text-destructive">
                {errors.position.message}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono *</Label>
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
            <Label htmlFor="email">Correo Electrónico *</Label>
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

          {/* Contacto Principal */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary"
              checked={isPrimary}
              onCheckedChange={(checked) =>
                setValue('is_primary', checked === true)
              }
            />
            <Label
              htmlFor="is_primary"
              className="text-sm font-normal cursor-pointer"
            >
              Marcar como contacto principal
            </Label>
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
              {mode === 'create' ? 'Agregar' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
