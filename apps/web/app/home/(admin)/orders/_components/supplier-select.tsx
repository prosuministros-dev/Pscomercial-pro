'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@kit/ui/dialog';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useSuppliers, useCreateSupplier } from '../_lib/order-queries';
import type { Supplier } from '../_lib/types';

interface SupplierSelectProps {
  value: string | null;
  onChange: (supplierId: string, supplier: Supplier) => void;
}

export function SupplierSelect({ value, onChange }: SupplierSelectProps) {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data: suppliers = [], isLoading } = useSuppliers(search || undefined);
  const createSupplier = useCreateSupplier();
  const [newSupplier, setNewSupplier] = useState({ name: '', nit: '', contact_name: '', email: '', phone: '' });

  const selected = suppliers.find((s: Supplier) => s.id === value);

  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim()) {
      toast.error('Nombre del proveedor es requerido');
      return;
    }
    try {
      const created = await createSupplier.mutateAsync({
        name: newSupplier.name,
        nit: newSupplier.nit || undefined,
        contact_name: newSupplier.contact_name || undefined,
        email: newSupplier.email || undefined,
        phone: newSupplier.phone || undefined,
      });
      onChange(created.id, created);
      setShowCreate(false);
      setNewSupplier({ name: '', nit: '', contact_name: '', email: '', phone: '' });
      toast.success('Proveedor creado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear proveedor');
    }
  };

  return (
    <div className="space-y-2">
      <Label>Proveedor</Label>
      {selected && (
        <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded text-sm">
          <span className="font-medium">{selected.name}</span>
          {selected.nit && <span className="text-gray-500 ml-2">NIT: {selected.nit}</span>}
        </div>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        <div className="max-h-40 overflow-y-auto border rounded divide-y">
          {(suppliers as Supplier[]).map((s) => (
            <button
              key={s.id}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${s.id === value ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''}`}
              onClick={() => onChange(s.id, s)}
            >
              <span className="font-medium">{s.name}</span>
              {s.nit && <span className="text-xs text-gray-500 ml-2">NIT: {s.nit}</span>}
              {s.city && <span className="text-xs text-gray-500 ml-2">{s.city}</span>}
            </button>
          ))}
          {suppliers.length === 0 && (
            <p className="text-sm text-gray-500 p-3 text-center">Sin resultados</p>
          )}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={newSupplier.name} onChange={(e) => setNewSupplier(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>NIT</Label>
                <Input value={newSupplier.nit} onChange={(e) => setNewSupplier(p => ({ ...p, nit: e.target.value }))} />
              </div>
              <div>
                <Label>Contacto</Label>
                <Input value={newSupplier.contact_name} onChange={(e) => setNewSupplier(p => ({ ...p, contact_name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={newSupplier.email} onChange={(e) => setNewSupplier(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={newSupplier.phone} onChange={(e) => setNewSupplier(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreateSupplier} disabled={createSupplier.isPending}>
              {createSupplier.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
