'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Textarea } from '@kit/ui/textarea';
import { Label } from '@kit/ui/label';
import { PermissionGate } from '@kit/rbac/permission-gate';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface ApprovalRecord {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  justification: string | null;
  created_at: string;
  requester?: { id: string; full_name: string; email: string } | null;
  reviewer?: { id: string; full_name: string; email: string } | null;
}

interface PurchaseApprovalPanelProps {
  orderId: string;
  orderNumber: number | string;
  onSuccess?: () => void;
}

export function PurchaseApprovalPanel({
  orderId,
  orderNumber,
  onSuccess,
}: PurchaseApprovalPanelProps) {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justification, setJustification] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/approve-purchase`);
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching purchase approvals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleRequestApproval = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/approve-purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ justification }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al solicitar aprobación');
      }

      toast.success('Solicitud enviada', {
        description: 'La solicitud de aprobación fue enviada a gerencia',
      });
      setJustification('');
      await fetchApprovals();
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
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/approve-purchase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, review_notes: reviewNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al procesar la aprobación');
      }

      toast.success(
        action === 'approve' ? 'Compra aprobada' : 'Compra rechazada',
        {
          description:
            action === 'approve'
              ? 'La solicitud de compra fue aprobada exitosamente'
              : 'La solicitud de compra fue rechazada',
        },
      );
      setReviewNotes('');
      await fetchApprovals();
      onSuccess?.();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al procesar',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingApproval = approvals.find((a) => a.status === 'pending');
  const latestApproved = approvals.find((a) => a.status === 'approved');
  const hasAnyApproval = approvals.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Aprobación de Compra</h4>
        {latestApproved && (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
            Aprobada
          </Badge>
        )}
        {pendingApproval && !latestApproved && (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs">
            Pendiente
          </Badge>
        )}
        {!hasAnyApproval && (
          <Badge variant="outline" className="text-xs">
            Sin solicitud
          </Badge>
        )}
      </div>

      {/* Historial de aprobaciones */}
      {hasAnyApproval && (
        <div className="space-y-2">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="flex items-start gap-3 p-3 border border-border rounded-lg text-sm"
            >
              {approval.status === 'approved' && (
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              )}
              {approval.status === 'rejected' && (
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              )}
              {approval.status === 'pending' && (
                <Clock className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">
                  {approval.status === 'approved'
                    ? 'Aprobada'
                    : approval.status === 'rejected'
                      ? 'Rechazada'
                      : 'Pendiente de aprobación'}
                  {approval.requester && (
                    <span className="font-normal text-muted-foreground">
                      {' — por '}{approval.requester.full_name}
                    </span>
                  )}
                </p>
                {approval.justification && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Justificación: {approval.justification}
                  </p>
                )}
                {approval.reviewer && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Revisado por {approval.reviewer.full_name}
                  </p>
                )}
                {approval.review_notes && (
                  <p className="text-sm text-foreground mt-1">{approval.review_notes}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
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

      {/* Sección para solicitar aprobación (asesores/coordinadores) */}
      {!pendingApproval && !latestApproved && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <p className="text-sm">
              Este pedido requiere aprobación de compra por gerencia
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`justification-${orderId}`} className="text-xs">
              Justificación (opcional)
            </Label>
            <Textarea
              id={`justification-${orderId}`}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explica el motivo de esta compra..."
              rows={2}
              disabled={isSubmitting}
              className="resize-none text-sm"
            />
          </div>
          <Button
            onClick={handleRequestApproval}
            disabled={isSubmitting}
            size="sm"
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4 mr-2" />
            )}
            Solicitar Aprobación de Compra
          </Button>
        </div>
      )}

      {/* Sección para aprobar/rechazar (gerentes con orders:approve) */}
      {pendingApproval && (
        <PermissionGate permission="orders:approve">
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-sm font-medium">Resolver Solicitud</p>
            <div className="space-y-1">
              <Label htmlFor={`review-notes-${orderId}`} className="text-xs">
                Notas de revisión (opcional)
              </Label>
              <Textarea
                id={`review-notes-${orderId}`}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Notas sobre la decisión..."
                rows={2}
                disabled={isSubmitting}
                className="resize-none text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleResolve('approve')}
                disabled={isSubmitting}
                size="sm"
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
                size="sm"
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
    </motion.div>
  );
}
