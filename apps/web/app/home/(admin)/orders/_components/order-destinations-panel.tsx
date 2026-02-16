'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, MapPin, Loader2 } from 'lucide-react';
import { useOrderDestinations, useAddDestination, useRemoveDestination } from '../_lib/order-queries';
import type { OrderDestination } from '../_lib/types';

interface OrderDestinationsPanelProps {
  orderId: string;
  readonly?: boolean;
}

export function OrderDestinationsPanel({ orderId, readonly }: OrderDestinationsPanelProps) {
  const { data: destinations, isLoading } = useOrderDestinations(orderId);
  const addDestination = useAddDestination();
  const removeDestination = useRemoveDestination();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    delivery_address: '',
    delivery_city: '',
    delivery_contact: '',
    delivery_phone: '',
    delivery_schedule: '',
    dispatch_type: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      delivery_address: '',
      delivery_city: '',
      delivery_contact: '',
      delivery_phone: '',
      delivery_schedule: '',
      dispatch_type: '',
      notes: '',
    });
    setShowForm(false);
  };

  const handleAdd = async () => {
    if (!formData.delivery_address.trim()) {
      toast.error('La dirección de entrega es requerida');
      return;
    }

    try {
      await addDestination.mutateAsync({
        orderId,
        ...formData,
      });
      toast.success('Destino agregado');
      resetForm();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al agregar destino',
      });
    }
  };

  const handleRemove = async (destinationId: string) => {
    try {
      await removeDestination.mutateAsync({ orderId, destinationId });
      toast.success('Destino eliminado');
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al eliminar destino',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando destinos...
      </div>
    );
  }

  const destList = (destinations as OrderDestination[]) || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Destinos de Entrega ({destList.length})</h4>
        {!readonly && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="w-3 h-3 mr-1" />
            Agregar
          </Button>
        )}
      </div>

      {/* Destination list */}
      {destList.length === 0 && !showForm && (
        <p className="text-sm text-gray-500 py-2">No hay destinos registrados</p>
      )}

      {destList.map((dest) => (
        <div key={dest.id} className="p-3 border rounded-lg space-y-1">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  Destino {dest.sort_order}: {dest.delivery_address}
                </p>
                <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                  {dest.delivery_city && <p>Ciudad: {dest.delivery_city}</p>}
                  {dest.delivery_contact && <p>Contacto: {dest.delivery_contact}</p>}
                  {dest.delivery_phone && <p>Tel: {dest.delivery_phone}</p>}
                  {dest.delivery_schedule && <p>Horario: {dest.delivery_schedule}</p>}
                  {dest.dispatch_type && <p>Despacho: {dest.dispatch_type}</p>}
                  {dest.notes && <p className="italic">{dest.notes}</p>}
                </div>
              </div>
            </div>
            {!readonly && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                onClick={() => handleRemove(dest.id)}
                disabled={removeDestination.isPending}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* Add destination form */}
      {showForm && (
        <div className="p-3 border-2 border-dashed border-cyan-300 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-xs">Dirección *</Label>
              <Input
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                placeholder="Dirección de entrega"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Ciudad</Label>
              <Input
                value={formData.delivery_city}
                onChange={(e) => setFormData({ ...formData, delivery_city: e.target.value })}
                placeholder="Ciudad"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Contacto</Label>
              <Input
                value={formData.delivery_contact}
                onChange={(e) => setFormData({ ...formData, delivery_contact: e.target.value })}
                placeholder="Persona de contacto"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Teléfono</Label>
              <Input
                value={formData.delivery_phone}
                onChange={(e) => setFormData({ ...formData, delivery_phone: e.target.value })}
                placeholder="Teléfono"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Horario</Label>
              <Input
                value={formData.delivery_schedule}
                onChange={(e) => setFormData({ ...formData, delivery_schedule: e.target.value })}
                placeholder="Ej: Lun-Vie 8am-5pm"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={addDestination.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {addDestination.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                'Guardar Destino'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
