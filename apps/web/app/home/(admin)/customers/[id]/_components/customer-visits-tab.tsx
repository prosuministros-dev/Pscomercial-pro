'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Plus, Loader2, Calendar, User, MessageSquare } from 'lucide-react';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';
import { PermissionGate } from '@kit/rbac/permission-gate';

import { useCustomerVisits } from '../../_lib/customer-queries';
import { VisitFormDialog } from './visit-form-dialog';

interface CustomerVisitsTabProps {
  customerId: string;
}

const VISIT_TYPE_MAP: Record<string, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
  telefonica: 'Telefónica',
};

const VISIT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  programada: { label: 'Programada', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  realizada: { label: 'Realizada', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  cancelada: { label: 'Cancelada', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
};

export function CustomerVisitsTab({ customerId }: CustomerVisitsTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const { data, isLoading, error } = useCustomerVisits(customerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  const visits = data?.data || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {data?.pagination?.total || 0} visitas
        </h3>
        <PermissionGate permission="visits:create">
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Visita
          </Button>
        </PermissionGate>
      </div>

      {visits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">Sin visitas</p>
          <p className="text-xs text-muted-foreground">No hay visitas registradas para este cliente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visits.map((visit, index) => {
            const statusInfo = VISIT_STATUS_MAP[visit.status] || { label: visit.status, className: '' };

            return (
              <motion.div
                key={visit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {new Date(visit.visit_date).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                        <Badge variant="outline">
                          {VISIT_TYPE_MAP[visit.visit_type] || visit.visit_type}
                        </Badge>
                        <Badge className={statusInfo.className}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>

                    {visit.advisor?.full_name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {visit.advisor.full_name}
                      </div>
                    )}

                    {visit.observations && (
                      <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <p className="whitespace-pre-wrap">{visit.observations}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <VisitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customerId={customerId}
      />
    </motion.div>
  );
}
