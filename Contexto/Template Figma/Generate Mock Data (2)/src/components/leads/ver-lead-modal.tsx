import { X, FileText, Megaphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import type { Lead } from '../../lib/mock-data';

interface VerLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onCrearCotizacion?: (lead: Lead) => void;
}

export function VerLeadModal({ open, onOpenChange, lead, onCrearCotizacion }: VerLeadModalProps) {
  const getEstadoBadge = (estado: string) => {
    const badges = {
      pendiente: { variant: 'outline' as const, label: 'Pendiente', className: 'border-yellow-500 text-yellow-600' },
      en_gestion: { variant: 'secondary' as const, label: 'En Gestión', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
      convertido: { variant: 'default' as const, label: 'Convertido', className: 'bg-green-600' },
      descartado: { variant: 'secondary' as const, label: 'Descartado', className: '' },
    };
    const badge = badges[estado as keyof typeof badges];
    if (!badge) return null;
    return (
      <Badge variant={badge.variant} className={`text-xs h-5 ${badge.className || ''}`}>
        {badge.label}
      </Badge>
    );
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] md:w-full max-h-[92vh] md:max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-3 md:px-6 py-3 md:py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div className="rounded-lg bg-gradient-accent p-1.5 md:p-2 flex-shrink-0">
                <Megaphone className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="flex items-center gap-2 text-sm md:text-base">
                  <span className="truncate">Lead #{lead.numero}</span>
                  {getEstadoBadge(lead.estado)}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Detalles completos del lead incluyendo información de contacto y requerimiento
                </DialogDescription>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
                  {lead.razonSocial}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 md:h-8 md:w-8 p-0 flex-shrink-0"
            >
              <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4">
          <div className="space-y-3 md:space-y-4">
            {/* Información del Cliente */}
            <Card className="p-3 md:p-4">
              <h4 className="mb-2 md:mb-3 text-sm md:text-base">Información del Cliente</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
                <div>
                  <Label className="text-[10px] md:text-xs text-muted-foreground">Razón Social</Label>
                  <p className="mt-1 text-xs md:text-sm">{lead.razonSocial}</p>
                </div>
                <div>
                  <Label className="text-[10px] md:text-xs text-muted-foreground">NIT</Label>
                  <p className="mt-1 text-xs md:text-sm">{lead.nit}</p>
                </div>
                <div>
                  <Label className="text-[10px] md:text-xs text-muted-foreground">Fuente</Label>
                  <p className="mt-1">
                    <Badge variant="outline" className="text-[10px] md:text-xs">
                      {lead.origen}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-[10px] md:text-xs text-muted-foreground">Estado</Label>
                  <p className="mt-1">{getEstadoBadge(lead.estado)}</p>
                </div>
              </div>
            </Card>

            {/* Contacto Principal */}
            <Card className="p-3 md:p-4">
              <h4 className="mb-2 md:mb-3 text-sm md:text-base">Contacto Principal</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
                <div className="sm:col-span-2">
                  <Label className="text-[10px] md:text-xs text-muted-foreground">Nombre</Label>
                  <p className="mt-1 text-xs md:text-sm">{lead.nombreContacto}</p>
                </div>
                <div>
                  <Label className="text-[10px] md:text-xs text-muted-foreground">Email</Label>
                  <p className="mt-1 truncate text-xs md:text-sm">
                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                      {lead.email}
                    </a>
                  </p>
                </div>
                <div>
                  <Label className="text-[10px] md:text-xs text-muted-foreground">Teléfono</Label>
                  <p className="mt-1 text-xs md:text-sm">
                    <a href={`tel:${lead.telefono}`} className="text-primary hover:underline">
                      {lead.telefono}
                    </a>
                  </p>
                </div>
              </div>
            </Card>

            {/* Requerimiento */}
            <Card className="p-3 md:p-4">
              <h4 className="mb-2 md:mb-3 text-sm md:text-base">Requerimiento del Cliente</h4>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {lead.requerimiento}
              </p>
            </Card>

            {/* Información de Gestión */}
            <Card className="p-3 md:p-4">
              <h4 className="mb-2 md:mb-3 text-sm md:text-base">Gestión</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
                <div>
                  <Label className="text-[10px] md:text-xs text-muted-foreground">Asignado a</Label>
                  <p className="mt-1 text-xs md:text-sm">{lead.asignadoA}</p>
                </div>
                <div>
                  <Label className="text-[10px] md:text-xs text-muted-foreground">Creado por</Label>
                  <p className="mt-1 text-xs md:text-sm">{lead.creadoPor}</p>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-[10px] md:text-xs text-muted-foreground">Fecha de creación</Label>
                  <p className="mt-1 text-xs md:text-sm">{formatFecha(lead.creadoEn)}</p>
                </div>
              </div>

              {lead.alerta24h && (
                <>
                  <Separator className="my-3" />
                  <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse flex-shrink-0" />
                    <p className="text-[10px] md:text-xs text-yellow-700 dark:text-yellow-400">
                      Este lead tiene más de 24 horas sin convertir
                    </p>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>

        <div className="px-3 md:px-6 py-3 md:py-4 border-t border-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cerrar
          </Button>
          {lead.estado === 'en_gestion' && onCrearCotizacion && (
            <Button
              size="sm"
              onClick={() => {
                onCrearCotizacion(lead);
                onOpenChange(false);
              }}
              className="gap-2 w-full sm:w-auto"
              style={{ background: 'var(--grad-brand)', color: 'white' }}
            >
              <FileText className="h-3.5 w-3.5" />
              Crear Cotización
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}