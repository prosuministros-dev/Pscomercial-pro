'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import { Badge } from '@kit/ui/badge';
import { toast } from 'sonner';
import { Send, Loader2, Mail } from 'lucide-react';
import type { Quote } from '../_lib/types';

interface SendQuoteDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SendQuoteDialog({ quote, open, onOpenChange, onSuccess }: SendQuoteDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Pre-fill from customer email when quote changes
  const customerEmail = (quote?.customer as { email?: string })?.email || '';

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && customerEmail) {
      setRecipientEmail(customerEmail);
    }
    if (!isOpen) {
      setRecipientEmail('');
      setRecipientName('');
      setMessage('');
    }
    onOpenChange(isOpen);
  };

  const handleSend = async () => {
    if (!quote || !recipientEmail) return;

    setIsSending(true);
    const toastId = toast.loading('Enviando...');

    try {
      const response = await fetch(`/api/quotes/${quote.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          recipientName: recipientName || undefined,
          message: message || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al enviar');
      }

      const result = await response.json();
      const docLabel = result.docType === 'proforma' ? 'Proforma' : 'Cotización';

      toast.success(`${docLabel} enviada`, {
        id: toastId,
        description: `Enviada a ${recipientEmail}`,
      });

      handleOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Error', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Error al enviar',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!quote) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-500" />
            Enviar al Cliente
          </DialogTitle>
          <DialogDescription>
            Cotización #{quote.quote_number} - {(quote.customer as { business_name?: string })?.business_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg text-sm">
            <p className="text-xs text-gray-500 mb-1">Se generará automáticamente:</p>
            <Badge variant="outline" className="text-xs">
              El tipo de documento se determina por el estado crediticio del cliente
            </Badge>
          </div>

          <div>
            <Label>Email del destinatario *</Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="cliente@ejemplo.com"
            />
          </div>

          <div>
            <Label>Nombre del destinatario</Label>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Nombre (opcional)"
            />
          </div>

          <div>
            <Label>Mensaje adicional</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Mensaje opcional para incluir en el email..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpen(false)}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !recipientEmail}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
