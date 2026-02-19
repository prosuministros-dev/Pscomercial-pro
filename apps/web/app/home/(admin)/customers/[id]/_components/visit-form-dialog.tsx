'use client';

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
import { Textarea } from '@kit/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { visitFormSchema, type VisitFormData } from '../../_lib/schemas';
import { useCreateVisit } from '../../_lib/customer-queries';

interface VisitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
}

export function VisitFormDialog({
  open,
  onOpenChange,
  customerId,
}: VisitFormDialogProps) {
  const createMutation = useCreateVisit();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<VisitFormData>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      visit_date: new Date().toISOString().split('T')[0] + 'T' + new Date().toTimeString().slice(0, 5),
      visit_type: 'presencial',
      status: 'realizada',
      observations: '',
    },
  });

  const selectedType = watch('visit_type');
  const selectedStatus = watch('status');

  const onSubmit = async (data: VisitFormData) => {
    try {
      // Ensure the date is in ISO format
      const visitDate = new Date(data.visit_date).toISOString();
      await createMutation.mutateAsync({
        customerId,
        data: { ...data, visit_date: visitDate },
      });
      reset();
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Visita Comercial</DialogTitle>
          <DialogDescription>
            Registre una visita presencial, virtual o telefónica al cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Fecha */}
          <div className="space-y-2">
            <Label htmlFor="visit_date">Fecha de Visita *</Label>
            <Input
              id="visit_date"
              type="datetime-local"
              {...register('visit_date')}
              aria-invalid={errors.visit_date ? 'true' : 'false'}
            />
            {errors.visit_date && (
              <p className="text-sm text-destructive">{errors.visit_date.message}</p>
            )}
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo de Visita *</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setValue('visit_type', value as VisitFormData['visit_type'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="telefonica">Telefónica</SelectItem>
              </SelectContent>
            </Select>
            {errors.visit_type && (
              <p className="text-sm text-destructive">{errors.visit_type.message}</p>
            )}
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label>Estado *</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setValue('status', value as VisitFormData['status'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realizada">Realizada</SelectItem>
                <SelectItem value="programada">Programada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observations">Observaciones</Label>
            <Textarea
              id="observations"
              {...register('observations')}
              placeholder="Detalle de la visita, temas tratados, acuerdos..."
              rows={4}
            />
            {errors.observations && (
              <p className="text-sm text-destructive">{errors.observations.message}</p>
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
              Registrar Visita
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
