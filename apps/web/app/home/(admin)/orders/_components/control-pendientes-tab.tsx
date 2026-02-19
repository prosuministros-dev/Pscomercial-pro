'use client';

import { useState, useMemo } from 'react';
import { Card } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  FileKey,
  ChevronRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@kit/ui/button';
import { useControlPendientes } from '../_lib/order-queries';
import { ESTADO_CONFIG } from '../_lib/schemas';
import type { PendienteOrder } from '../_lib/types';

interface ControlPendientesTabProps {
  onViewDetail: (orderId: string) => void;
}

export function ControlPendientesTab({ onViewDetail }: ControlPendientesTabProps) {
  const { data, isLoading } = useControlPendientes();
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const filtered = useMemo(() => {
    if (!data) return [];
    return data
      .filter((p) => {
        const matchNivel = filtroNivel === 'todos' || p.nivel_atencion === filtroNivel;
        const matchTipo = filtroTipo === 'todos' || p.tipo === filtroTipo;
        return matchNivel && matchTipo;
      })
      .sort((a, b) => {
        const orden = { critico: 0, atencion_requerida: 1, sin_pendientes: 2 };
        return (orden[a.nivel_atencion as keyof typeof orden] ?? 2) - (orden[b.nivel_atencion as keyof typeof orden] ?? 2);
      });
  }, [data, filtroNivel, filtroTipo]);

  const stats = useMemo(() => {
    if (!data) return { criticos: 0, atencion: 0, ok: 0 };
    return {
      criticos: data.filter((p) => p.nivel_atencion === 'critico').length,
      atencion: data.filter((p) => p.nivel_atencion === 'atencion_requerida').length,
      ok: data.filter((p) => p.nivel_atencion === 'sin_pendientes').length,
    };
  }, [data]);

  const nivelIcons = { sin_pendientes: CheckCircle2, atencion_requerida: Clock, critico: AlertCircle };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-semibold mb-1">Control Operativo Diario</h3>
        <p className="text-xs text-muted-foreground">
          Vista de checklist visual - Priorización inmediata por colores
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <p className="text-xs text-muted-foreground">Críticos</p>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.criticos}</p>
        </Card>
        <Card className="p-3 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <p className="text-xs text-muted-foreground">Atención</p>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.atencion}</p>
        </Card>
        <Card className="p-3 border-green-500/30 bg-green-500/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-xs text-muted-foreground">OK</p>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.ok}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select value={filtroNivel} onValueChange={setFiltroNivel}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Nivel de atención" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los niveles</SelectItem>
              <SelectItem value="critico">Crítico</SelectItem>
              <SelectItem value="atencion_requerida">Atención</SelectItem>
              <SelectItem value="sin_pendientes">Sin Pendientes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="fisico">Físico</SelectItem>
              <SelectItem value="intangible">Intangible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Checklist Cards */}
      <div className="space-y-2">
        {filtered.map((pedido) => {
          const nivelConfig = ESTADO_CONFIG[pedido.nivel_atencion];
          const IconoNivel = nivelIcons[pedido.nivel_atencion as keyof typeof nivelIcons] || CheckCircle2;
          const IconoTipo = pedido.tipo === 'fisico' ? Package : FileKey;

          return (
            <Card
              key={pedido.order_id}
              className={`relative overflow-hidden border-l-4 ${nivelConfig?.border || ''} cursor-pointer hover:bg-muted/30 transition-all`}
              onClick={() => onViewDetail(pedido.order_id)}
            >
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${nivelConfig?.bg || ''} flex items-center justify-center flex-shrink-0`}>
                    <IconoNivel className={`h-5 w-5 ${nivelConfig?.text || ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono text-sm font-medium">#{pedido.order_number}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          pedido.tipo === 'fisico'
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400'
                        }`}
                      >
                        <IconoTipo className="h-3 w-3 mr-1" />
                        {pedido.tipo === 'fisico' ? 'Físico' : 'Intangible'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{pedido.customer_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-xs font-medium ${
                        pedido.dias_restantes < 0
                          ? 'text-red-600'
                          : pedido.dias_restantes === 0
                            ? 'text-orange-600'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {pedido.dias_restantes < 0
                        ? `${Math.abs(pedido.dias_restantes)} días atrasado`
                        : pedido.dias_restantes === 0
                          ? 'HOY'
                          : `${pedido.dias_restantes} días`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(pedido.fecha_clave).toLocaleDateString('es-CO', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetail(pedido.order_id);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className={`rounded-lg p-3 ${nivelConfig?.bg || 'bg-muted/50'}`}>
                  <p className="text-sm font-medium">{pedido.motivo_pendiente}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No hay pedidos en esta categoría</p>
        </Card>
      )}
    </div>
  );
}
