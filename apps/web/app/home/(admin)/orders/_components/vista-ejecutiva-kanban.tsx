'use client';

import { useMemo } from 'react';
import { Card } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import {
  Package,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  ShoppingCart,
} from 'lucide-react';
import { MACRO_STATE_CONFIG } from '../_lib/schemas';
import type { TableroOperativoOrder, MacroState } from '../_lib/types';

interface VistaEjecutivaKanbanProps {
  data: TableroOperativoOrder[];
  onViewDetail: (orderId: string) => void;
}

const macroIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  en_compras: ShoppingCart,
  en_proveedor: Building2,
  en_transporte: Truck,
  en_bodega: Package,
  bloqueado: AlertTriangle,
  cerrado: CheckCircle2,
};

export function VistaEjecutivaKanban({ data, onViewDetail }: VistaEjecutivaKanbanProps) {
  const grouped = useMemo(() => {
    const g: Record<string, TableroOperativoOrder[]> = {};
    Object.keys(MACRO_STATE_CONFIG).forEach((k) => (g[k] = []));
    data.forEach((item) => {
      if (g[item.macro_state]) g[item.macro_state]!.push(item);
    });
    return g;
  }, [data]);

  const metricas = useMemo(() => {
    const total = data.length;
    const bloqueados = grouped['bloqueado']?.length || 0;
    const cerrados = grouped['cerrado']?.length || 0;
    const enProceso = total - bloqueados - cerrados;
    const valorTotal = data.reduce((sum, item) => sum + (item.total || 0), 0);
    return { total, bloqueados, cerrados, enProceso, valorTotal };
  }, [data, grouped]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 border-2">
          <div className="flex items-center justify-between mb-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <TrendingUp className="h-3 w-3 text-green-600" />
          </div>
          <p className="text-2xl font-bold">{metricas.total}</p>
          <p className="text-xs text-muted-foreground">Total Pedidos</p>
        </Card>
        <Card className="p-4 border-2 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{metricas.enProceso}</p>
          <p className="text-xs text-muted-foreground">En Proceso</p>
        </Card>
        <Card className="p-4 border-2 border-red-500/30 bg-red-500/5">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">{metricas.bloqueados}</p>
          <p className="text-xs text-muted-foreground">Bloqueados</p>
        </Card>
        <Card className="p-4 border-2 border-green-500/30 bg-green-500/5">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">{metricas.cerrados}</p>
          <p className="text-xs text-muted-foreground">Completados</p>
        </Card>
        <Card className="p-4 border-2">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold">{formatCurrency(metricas.valorTotal)}</p>
          <p className="text-xs text-muted-foreground">Valor Total</p>
        </Card>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(MACRO_STATE_CONFIG).map(([key, config]) => {
          const items = grouped[key] || [];
          const Icon = macroIcons[key] || Package;
          return (
            <Card key={key} className={`overflow-hidden border-2 ${config.color}`}>
              <div className={`${config.headerColor} px-4 py-3 text-white`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <h3 className="font-medium text-sm">{config.label}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                    {items.length}
                  </Badge>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="py-8 text-center">
                    <Icon className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                    <p className="text-xs text-muted-foreground">No hay pedidos</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <Card
                      key={item.order_id}
                      className="p-3 hover:shadow-md transition-all cursor-pointer border"
                      onClick={() => onViewDetail(item.order_id)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-medium line-clamp-1 flex-1">{item.customer_name}</p>
                        <Badge variant="outline" className="text-[10px] flex-shrink-0">
                          {item.order_quantity}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">{item.order_product}</p>
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {item.expected_delivery
                              ? new Date(item.expected_delivery).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
                              : '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-medium">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatCurrency(item.total)}</span>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
