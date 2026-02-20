'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Building2,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Badge } from '@kit/ui/badge';
import { Card } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { toast } from 'sonner';
import type { Lead } from '../_lib/types';
import { LeadFormDialog } from './lead-form-dialog';

interface LeadsKanbanProps {
  leads: Lead[];
  onRefresh: () => void;
}

const STATUS_COLUMNS = [
  {
    id: 'created',
    title: 'Creado',
    statuses: ['created', 'pending_assignment'],
    icon: AlertCircle,
    color: 'bg-yellow-500',
  },
  {
    id: 'pending',
    title: 'Pendiente',
    statuses: ['assigned', 'pending_info'],
    icon: Clock,
    color: 'bg-blue-500',
  },
  {
    id: 'converted',
    title: 'Convertido',
    statuses: ['converted'],
    icon: CheckCircle2,
    color: 'bg-green-500',
  },
];

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  web: 'Web',
  manual: 'Manual',
};

export function LeadsKanban({ leads, onRefresh }: LeadsKanbanProps) {
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const handleConvert = async (leadId: string) => {
    setConvertingId(leadId);

    try {
      const response = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadId,
          status: 'converted',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al convertir el lead');
      }

      toast.success('Lead convertido', {
        description: 'El lead se ha marcado como convertido correctamente',
      });

      onRefresh();
    } catch (error) {
      console.error('Error converting lead:', error);
      toast.error('Error', {
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo convertir el lead',
      });
    } finally {
      setConvertingId(null);
    }
  };

  const getLeadsForColumn = (statuses: string[]) => {
    return leads.filter((lead) => statuses.includes(lead.status));
  };

  const isOverdue = (lead: Lead) => {
    if (lead.status === 'converted' || lead.status === 'rejected') return false;

    const leadDate = new Date(lead.lead_date);
    const now = new Date();
    const diffInMs = now.getTime() - leadDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays > 1;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {STATUS_COLUMNS.map((column) => {
        const columnLeads = getLeadsForColumn(column.statuses);
        const Icon = column.icon;

        return (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {column.title}
                </h3>
              </div>
              <Badge variant="secondary" className="font-semibold">
                {columnLeads.length}
              </Badge>
            </div>

            {/* Cards */}
            <AnimatePresence mode="popLayout">
              {columnLeads.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <Icon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay leads en esta columna
                  </p>
                </motion.div>
              ) : (
                columnLeads.map((lead, index) => (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 hover:shadow-lg transition-shadow">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                              {lead.business_name}
                            </h4>
                            {isOverdue(lead) && (
                              <Badge
                                variant="destructive"
                                className="text-xs shrink-0"
                              >
                                Vencido
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Lead #{lead.lead_number}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs shrink-0 ml-2"
                        >
                          {CHANNEL_LABELS[lead.channel] || lead.channel}
                        </Badge>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300 truncate">
                            {lead.contact_name}
                          </span>
                        </div>
                        {lead.nit && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {lead.nit}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {lead.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300 truncate">
                            {lead.email}
                          </span>
                        </div>
                      </div>

                      {/* Requirement */}
                      <div className="mb-3">
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                            {lead.requirement}
                          </p>
                        </div>
                      </div>

                      {/* Assigned User */}
                      {lead.assigned_user && (
                        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Asignado a:
                          </p>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">
                            {lead.assigned_user.full_name}
                          </p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(lead.lead_date), "d MMM 'a las' HH:mm", {
                            locale: es,
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <LeadFormDialog
                            lead={lead}
                            onSuccess={onRefresh}
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                              >
                                Editar
                              </Button>
                            }
                          />
                          {lead.status !== 'converted' &&
                            lead.status !== 'rejected' && (
                              <Button
                                variant="default"
                                size="sm"
                                className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleConvert(lead.id)}
                                disabled={convertingId === lead.id}
                              >
                                {convertingId === lead.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Convirtiendo...
                                  </>
                                ) : (
                                  'Convertir'
                                )}
                              </Button>
                            )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
