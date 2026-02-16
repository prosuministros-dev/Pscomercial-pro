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
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import { toast } from 'sonner';
import { Loader2, MessageSquare } from 'lucide-react';
import type { Quote } from '../_lib/types';

interface ClientResponseDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const RESPONSE_OPTIONS = [
  { value: 'accepted', label: 'Aceptada', description: 'El cliente aceptó la cotización', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'changes_requested', label: 'Cambios Solicitados', description: 'El cliente solicita modificaciones', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'rejected', label: 'Rechazada', description: 'El cliente rechazó la cotización', color: 'bg-red-100 text-red-800 border-red-300' },
] as const;

export function ClientResponseDialog({ quote, open, onOpenChange, onSuccess }: ClientResponseDialogProps) {
  const [response, setResponse] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setResponse('');
    setNotes('');
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!quote || !response) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/client-response`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response, notes: notes || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al registrar respuesta');
      }

      const result = await res.json();
      const label = RESPONSE_OPTIONS.find((o) => o.value === response)?.label || response;
      toast.success('Respuesta registrada', {
        description: `Cotización #${quote.quote_number}: ${label}`,
      });

      handleClose();
      onSuccess?.();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al registrar respuesta',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!quote) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-500" />
            Respuesta del Cliente
          </DialogTitle>
          <DialogDescription>
            Cotización #{quote.quote_number} - {(quote.customer as { business_name?: string })?.business_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Respuesta *</Label>
            <div className="space-y-2">
              {RESPONSE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setResponse(option.value)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    response === option.value
                      ? option.color + ' border-current'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs opacity-75">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observaciones del cliente (opcional)..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !response}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Registrar Respuesta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
