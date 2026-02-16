'use client';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Lock, Loader2 } from 'lucide-react';
import { useBillingSteps, useUpdateBillingStep } from '../_lib/order-queries';
import { useUserRoles } from '../_lib/use-user-roles';
import {
  ADV_BILLING_STEP_LABELS,
  ADV_BILLING_VALUE_LABELS,
} from '../_lib/schemas';

type BillingStep = 'request' | 'approval' | 'remission' | 'invoice';

const STEPS: BillingStep[] = ['request', 'approval', 'remission', 'invoice'];

const STEP_ALLOWED_ROLES: Record<BillingStep, string[]> = {
  request: ['asesor_comercial', 'gerente_comercial', 'director_comercial', 'gerente_general', 'super_admin'],
  approval: ['compras', 'gerente_general', 'super_admin'],
  remission: ['logistica', 'compras', 'gerente_general', 'super_admin'],
  invoice: ['finanzas', 'facturacion', 'gerente_general', 'super_admin'],
};

const STEP_COMPLETED_VALUES: Record<BillingStep, string> = {
  request: 'required',
  approval: 'approved',
  remission: 'generated',
  invoice: 'generated',
};

const STEP_ACTION_LABEL: Record<BillingStep, string> = {
  request: 'Marcar como Requerida',
  approval: 'Aprobar',
  remission: 'Marcar como Generada',
  invoice: 'Marcar como Generada',
};

interface AdvanceBillingPanelProps {
  orderId: string;
}

export function AdvanceBillingPanel({ orderId }: AdvanceBillingPanelProps) {
  const { data: billingData, isLoading } = useBillingSteps(orderId);
  const { data: userRoles } = useUserRoles();
  const updateStep = useUpdateBillingStep();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando facturación anticipada...
      </div>
    );
  }

  if (!billingData) return null;

  const getStepValue = (step: BillingStep): string => {
    const col = `adv_billing_${step}` as keyof typeof billingData;
    return (billingData[col] as string) || 'pending';
  };

  const getStepTimestamp = (step: BillingStep): string | null => {
    const col = `adv_billing_${step}_at` as keyof typeof billingData;
    return billingData[col] as string | null;
  };

  const isStepCompleted = (step: BillingStep): boolean => {
    return getStepValue(step) === STEP_COMPLETED_VALUES[step];
  };

  const canUserEditStep = (step: BillingStep): boolean => {
    if (!userRoles?.length) return false;
    return userRoles.some((role: string) => STEP_ALLOWED_ROLES[step].includes(role));
  };

  const isStepEditable = (step: BillingStep): boolean => {
    if (isStepCompleted(step)) return false;
    if (!canUserEditStep(step)) return false;
    // Previous steps must be completed
    const stepIdx = STEPS.indexOf(step);
    for (let i = 0; i < stepIdx; i++) {
      if (!isStepCompleted(STEPS[i]!)) return false;
    }
    return true;
  };

  const handleUpdateStep = async (step: BillingStep) => {
    const value = STEP_COMPLETED_VALUES[step];
    try {
      await updateStep.mutateAsync({ orderId, step, value });
      toast.success(`${ADV_BILLING_STEP_LABELS[step]} actualizada`);
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al actualizar',
      });
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Flujo de Facturación Anticipada</h4>
      <div className="space-y-2">
        {STEPS.map((step, idx) => {
          const value = getStepValue(step);
          const completed = isStepCompleted(step);
          const editable = isStepEditable(step);
          const timestamp = getStepTimestamp(step);
          const valueLabel = ADV_BILLING_VALUE_LABELS[step]?.[value] || value;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                completed
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                  : editable
                    ? 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
              }`}
            >
              {/* Step number */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  completed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}
              >
                {completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>

              {/* Step info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {ADV_BILLING_STEP_LABELS[step]}
                  </span>
                  <Badge
                    variant={completed ? 'default' : 'outline'}
                    className={`text-xs ${completed ? 'bg-green-500' : ''}`}
                  >
                    {valueLabel}
                  </Badge>
                </div>
                {timestamp && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(timestamp).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>

              {/* Action */}
              {editable ? (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStep(step)}
                  disabled={updateStep.isPending}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs"
                >
                  {updateStep.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    STEP_ACTION_LABEL[step]
                  )}
                </Button>
              ) : completed ? (
                <Lock className="w-4 h-4 text-gray-400" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
