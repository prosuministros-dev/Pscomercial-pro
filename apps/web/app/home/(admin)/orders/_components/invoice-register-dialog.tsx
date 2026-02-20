'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRegisterInvoice } from '../_lib/order-queries';

interface InvoiceRegisterDialogProps {
  orderId: string;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceRegisterDialog({ orderId, currency, open, onOpenChange }: InvoiceRegisterDialogProps) {
  const registerInvoice = useRegisterInvoice();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]!);
  const [dueDate, setDueDate] = useState('');
  const [cur, setCur] = useState<'COP' | 'USD'>(currency as 'COP' | 'USD');
  const [subtotal, setSubtotal] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [total, setTotal] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubtotalChange = (val: string) => {
    setSubtotal(val);
    const sub = parseFloat(val) || 0;
    const tax = sub * 0.19;
    setTaxAmount(tax.toFixed(0));
    setTotal((sub + tax).toFixed(0));
  };

  const handleSubmit = async () => {
    if (!invoiceNumber.trim()) {
      toast.error('Número de factura es requerido');
      return;
    }
    if (!total || parseFloat(total) <= 0) {
      toast.error('Total debe ser mayor a 0');
      return;
    }

    try {
      await registerInvoice.mutateAsync({
        order_id: orderId,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate || undefined,
        currency: cur,
        subtotal: parseFloat(subtotal) || 0,
        tax_amount: parseFloat(taxAmount) || 0,
        total: parseFloat(total) || 0,
        payment_method: paymentMethod || undefined,
        notes: notes || undefined,
      });
      toast.success('Factura registrada');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar factura');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Factura</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Número de Factura *</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="FAC-001" />
            </div>
            <div>
              <Label>Moneda</Label>
              <select className="w-full border rounded px-3 py-2 text-sm" value={cur} onChange={(e) => setCur(e.target.value as any)}>
                <option value="COP">COP</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha de Factura *</Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
            <div>
              <Label>Fecha de Vencimiento</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Subtotal</Label>
              <Input type="number" value={subtotal} onChange={(e) => handleSubtotalChange(e.target.value)} />
            </div>
            <div>
              <Label>IVA</Label>
              <Input type="number" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
            </div>
            <div>
              <Label>Total *</Label>
              <Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} className="font-bold" />
            </div>
          </div>

          <div>
            <Label>Medio de Pago</Label>
            <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Transferencia, cheque..." />
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={registerInvoice.isPending}>
            {registerInvoice.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Registrar Factura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
