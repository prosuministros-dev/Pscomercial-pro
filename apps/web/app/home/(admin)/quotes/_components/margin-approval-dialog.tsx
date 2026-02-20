'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Textarea } from '@kit/ui/textarea';
import { Label } from '@kit/ui/label';
import { PermissionGate } from '@kit/rbac/permission-gate';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import type { Quote } from '../_lib/types';

interface MarginApprovalDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ApprovalRecord {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  requester?: { id: string; full_name: string; email: string };
  reviewer?: { id: string; full_name: string; email: string } | null;
}

export function MarginApprovalDialog({
  quote,
  open,
  onOpenChange,
  onSuccess,
}: MarginApprovalDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [reviewNotes, setReviewNotes] = useState('');
  const [justification, setJustification] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadApprovals = async () => {
    if (!quote || hasLoaded) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}/approve-margin`);
      if (response.ok) {
        const data = await response.json();
        setApprovals(data.data || []);
      }
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  };

  // Load when dialog opens
  useEffect(() => {
    if (open && !hasLoaded && quote) {
      loadApprovals();
    }
  }, [open, quote?.id]);

  // Reset when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setHasLoaded(false);
      setApprovals([]);
      setReviewNotes('');
      setJustification('');
    }
    onOpenChange(newOpen);
  };

  const handleRequestApproval = async () => {
    if (!quote) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}/approve-margin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ justification }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al solicitar aprobación');
      }

      toast.success('Solicitud enviada', {
        description: 'La solicitud de aprobación de margen fue enviada',
      });
      setHasLoaded(false);
      loadApprovals();
      onSuccess?.();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al solicitar aprobación',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (action: 'approve' | 'reject') => {
    if (!quote) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}/approve-margin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, review_notes: reviewNotes }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al procesar la aprobación');
      }

      toast.success(
        action === 'approve' ? 'Margen aprobado' : 'Margen rechazado',
        {
          description: action === 'approve'
            ? 'El margen de la cotización fue aprobado'
            : 'El margen de la cotización fue rechazado',
        },
      );
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al procesar',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quote) return null;

  const pendingApproval = approvals.find((a) => a.status === 'pending');
  const marginColor = (quote.margin_pct ?? 0) < 7
    ? 'text-red-600'
    : (quote.margin_pct ?? 0) < 9
      ? 'text-yellow-600'
      : 'text-green-600';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Aprobación de Margen — Cotización #{quote.quote_number}</DialogTitle>
          <DialogDescription>
            Gestiona la aprobación de margen para esta cotización
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quote info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Cliente</p>
                <p className="font-medium text-sm">{quote.customer?.business_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-mono font-semibold text-sm">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: quote.currency,
                    minimumFractionDigits: 0,
                  }).format(quote.total)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Margen</p>
                <p className={`font-mono font-bold text-lg ${marginColor}`}>
                  {quote.margin_pct?.toFixed(2) ?? '—'}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado Aprobación</p>
                {quote.margin_approved ? (
                  <Badge className="bg-green-100 text-green-800">Aprobado</Badge>
                ) : pendingApproval ? (
                  <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                ) : (
                  <Badge variant="outline">Sin solicitud</Badge>
                )}
              </div>
            </div>

            {/* Approval history */}
            {approvals.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Historial de Aprobaciones</h4>
                {approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="flex items-start gap-3 p-3 border rounded-lg text-sm"
                  >
                    {approval.status === 'approved' && (
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    )}
                    {approval.status === 'rejected' && (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    {approval.status === 'pending' && (
                      <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {approval.status === 'approved'
                          ? 'Aprobado'
                          : approval.status === 'rejected'
                            ? 'Rechazado'
                            : 'Pendiente'}
                        {approval.requester && (
                          <span className="font-normal text-gray-500">
                            {' — Solicitado por '}
                            {approval.requester.full_name}
                          </span>
                        )}
                      </p>
                      {approval.reviewer && (
                        <p className="text-gray-500">
                          Revisado por {approval.reviewer.full_name}
                        </p>
                      )}
                      {approval.review_notes && (
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                          {approval.review_notes}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(approval.created_at).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Request approval section (for advisors) */}
            {!quote.margin_approved && !pendingApproval && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-4 h-4" />
                  <p className="text-sm font-medium">
                    El margen está por debajo del mínimo permitido
                  </p>
                </div>
                <div>
                  <Label htmlFor="justification">Justificación (opcional)</Label>
                  <Textarea
                    id="justification"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Explica por qué se requiere este margen..."
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleRequestApproval}
                  disabled={isSubmitting}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Solicitar Aprobación de Margen
                </Button>
              </div>
            )}

            {/* Approve/Reject section (for managers) */}
            {pendingApproval && (
              <PermissionGate permission="quotes:approve">
                <div className="space-y-3 pt-2 border-t">
                  <h4 className="text-sm font-semibold">Resolver Solicitud</h4>
                  <div>
                    <Label htmlFor="review_notes">Notas de revisión (opcional)</Label>
                    <Textarea
                      id="review_notes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Notas sobre la decisión..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleResolve('approve')}
                      disabled={isSubmitting}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Aprobar
                    </Button>
                    <Button
                      onClick={() => handleResolve('reject')}
                      disabled={isSubmitting}
                      variant="destructive"
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Rechazar
                    </Button>
                  </div>
                </div>
              </PermissionGate>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
