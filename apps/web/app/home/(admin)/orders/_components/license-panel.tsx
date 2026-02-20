'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@kit/ui/dialog';
import { Loader2, Plus, Key, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useOrderLicenses, useCreateLicense, useUpdateLicense } from '../_lib/order-queries';
import { LICENSE_TYPE_LABELS, LICENSE_STATUS_LABELS } from '../_lib/schemas';
import type { LicenseRecord, OrderItem } from '../_lib/types';

interface LicensePanelProps {
  orderId: string;
  orderItems: OrderItem[];
}

export function LicensePanel({ orderId, orderItems }: LicensePanelProps) {
  const { data: licenses = [], isLoading } = useOrderLicenses(orderId);
  const createLicense = useCreateLicense();
  const updateLicense = useUpdateLicense();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [licenseType, setLicenseType] = useState<string>('software');
  const [vendor, setVendor] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [activationDate, setActivationDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [seats, setSeats] = useState('');
  const [endUserName, setEndUserName] = useState('');
  const [endUserEmail, setEndUserEmail] = useState('');

  const handleCreate = async () => {
    if (!selectedItemId) {
      toast.error('Selecciona un item del pedido');
      return;
    }

    try {
      await createLicense.mutateAsync({
        order_id: orderId,
        order_item_id: selectedItemId,
        license_type: licenseType as any,
        vendor: vendor || undefined,
        license_key: licenseKey || undefined,
        activation_date: activationDate || undefined,
        expiry_date: expiryDate || undefined,
        seats: seats ? parseInt(seats) : undefined,
        end_user_name: endUserName || undefined,
        end_user_email: endUserEmail || undefined,
      });
      toast.success('Licencia creada');
      setShowCreate(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error');
    }
  };

  const handleActivate = async (license: LicenseRecord) => {
    const key = prompt('Ingrese la clave de licencia:');
    if (!key) return;
    try {
      await updateLicense.mutateAsync({
        licenseId: license.id,
        orderId,
        status: 'active',
        license_key: key,
        activation_date: new Date().toISOString().split('T')[0],
      });
      toast.success('Licencia activada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error');
    }
  };

  const resetForm = () => {
    setSelectedItemId('');
    setLicenseType('software');
    setVendor('');
    setLicenseKey('');
    setActivationDate('');
    setExpiryDate('');
    setSeats('');
    setEndUserName('');
    setEndUserEmail('');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'expired': case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-1">
          <Shield className="w-4 h-4" />
          Licencias
        </h4>
        <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva Licencia
        </Button>
      </div>

      {(licenses as LicenseRecord[]).length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Sin licencias registradas</p>
      ) : (
        <div className="space-y-2">
          {(licenses as LicenseRecord[]).map((lic) => (
            <div key={lic.id} className="border rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">
                    {LICENSE_TYPE_LABELS[lic.license_type] || lic.license_type}
                  </span>
                  {lic.vendor && <span className="text-xs text-gray-500">({lic.vendor})</span>}
                  <Badge variant={statusColor(lic.status)}>
                    {LICENSE_STATUS_LABELS[lic.status] || lic.status}
                  </Badge>
                </div>
                {lic.status === 'pending' && (
                  <Button size="sm" variant="outline" onClick={() => handleActivate(lic)} disabled={updateLicense.isPending}>
                    Activar
                  </Button>
                )}
              </div>
              {lic.license_key && (
                <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">{lic.license_key}</p>
              )}
              <div className="flex gap-4 text-xs text-gray-500">
                {lic.activation_date && <span>Activada: {new Date(lic.activation_date).toLocaleDateString('es-CO')}</span>}
                {lic.expiry_date && <span>Vence: {new Date(lic.expiry_date).toLocaleDateString('es-CO')}</span>}
                {lic.seats && <span>{lic.seats} puesto(s)</span>}
                {lic.end_user_name && <span>Usuario: {lic.end_user_name}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Licencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Item del pedido *</Label>
              <select className="w-full border rounded px-3 py-2 text-sm" value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
                <option value="">Seleccionar item...</option>
                {orderItems.map((oi) => (
                  <option key={oi.id} value={oi.id}>{oi.sku} — {oi.description}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo *</Label>
                <select className="w-full border rounded px-3 py-2 text-sm" value={licenseType} onChange={(e) => setLicenseType(e.target.value)}>
                  {Object.entries(LICENSE_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Proveedor/Vendor</Label>
                <Input value={vendor} onChange={(e) => setVendor(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Clave de Licencia</Label>
              <Input value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} placeholder="XXXXX-XXXXX-XXXXX" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Fecha activación</Label>
                <Input type="date" value={activationDate} onChange={(e) => setActivationDate(e.target.value)} />
              </div>
              <div>
                <Label>Vencimiento</Label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
              <div>
                <Label>Puestos</Label>
                <Input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} min={1} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Usuario final</Label>
                <Input value={endUserName} onChange={(e) => setEndUserName(e.target.value)} />
              </div>
              <div>
                <Label>Email usuario</Label>
                <Input type="email" value={endUserEmail} onChange={(e) => setEndUserEmail(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createLicense.isPending}>
              {createLicense.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Crear Licencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
