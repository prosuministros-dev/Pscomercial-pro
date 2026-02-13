'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2 } from 'lucide-react';
import { leadFormSchema, type LeadFormSchema } from '../_lib/schema';
import type { Lead } from '../_lib/types';

interface LeadFormDialogProps {
  lead?: Lead;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function LeadFormDialog({
  lead,
  onSuccess,
  trigger,
}: LeadFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<LeadFormSchema>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: lead
      ? {
          business_name: lead.business_name,
          nit: lead.nit || '',
          contact_name: lead.contact_name,
          phone: lead.phone,
          email: lead.email,
          requirement: lead.requirement,
          channel: lead.channel,
        }
      : {
          channel: 'manual',
        },
  });

  const channelValue = watch('channel');

  const onSubmit = async (data: LeadFormSchema) => {
    setIsSubmitting(true);

    try {
      const url = '/api/leads';
      const method = lead ? 'PUT' : 'POST';
      const body = lead ? { ...data, id: lead.id } : data;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();

        if (response.status === 409) {
          toast.error('Lead duplicado', {
            description: error.error || 'Ya existe un lead con estos datos',
          });
          return;
        }

        throw new Error(error.error || 'Error al guardar el lead');
      }

      toast.success(
        lead ? 'Lead actualizado' : 'Lead creado',
        {
          description: lead
            ? 'El lead se ha actualizado correctamente'
            : 'El lead se ha creado y asignado automáticamente',
        }
      );

      reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error('Error', {
        description:
          error instanceof Error ? error.message : 'No se pudo guardar el lead',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lead ? 'Editar Lead' : 'Crear Nuevo Lead'}
          </DialogTitle>
          <DialogDescription>
            {lead
              ? 'Modifica la información del lead'
              : 'Completa la información del nuevo lead. Se asignará automáticamente a un asesor disponible.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información de la Empresa */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-navy-600 dark:text-cyan-400">
              Información de la Empresa
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="business_name">
                  Razón Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="business_name"
                  {...register('business_name')}
                  placeholder="Nombre de la empresa"
                  disabled={isSubmitting}
                />
                {errors.business_name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.business_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="nit">NIT</Label>
                <Input
                  id="nit"
                  {...register('nit')}
                  placeholder="123456789-0"
                  disabled={isSubmitting}
                />
                {errors.nit && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.nit.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="channel">
                  Canal <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={channelValue}
                  onValueChange={(value) =>
                    setValue('channel', value as 'whatsapp' | 'web' | 'manual')
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                  </SelectContent>
                </Select>
                {errors.channel && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.channel.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-navy-600 dark:text-cyan-400">
              Información de Contacto
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="contact_name">
                  Nombre del Contacto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact_name"
                  {...register('contact_name')}
                  placeholder="Nombre completo"
                  disabled={isSubmitting}
                />
                {errors.contact_name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.contact_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+57 300 123 4567"
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="contacto@empresa.com"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Requerimiento */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-navy-600 dark:text-cyan-400">
              Requerimiento
            </h3>

            <div>
              <Label htmlFor="requirement">
                Descripción del Requerimiento{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="requirement"
                {...register('requirement')}
                placeholder="Describe el requerimiento o necesidad del cliente..."
                rows={4}
                disabled={isSubmitting}
              />
              {errors.requirement && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.requirement.message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
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
              ) : lead ? (
                'Actualizar Lead'
              ) : (
                'Crear Lead'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
