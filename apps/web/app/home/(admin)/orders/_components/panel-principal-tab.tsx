'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card } from '@kit/ui/card';
import {
  Package,
  FileKey,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { PanelPrincipalFilters } from './panel-principal-filters';
import { usePanelPrincipal } from '../_lib/order-queries';
import { STATUS_LABELS, ESTADO_CONFIG } from '../_lib/schemas';
import type { PanelPrincipalOrder } from '../_lib/types';

interface PanelPrincipalTabProps {
  onViewDetail: (orderId: string) => void;
}

const estadoIcons = { sin_pendientes: CheckCircle2, atencion_requerida: Clock, critico: AlertCircle };

export function PanelPrincipalTab({ onViewDetail }: PanelPrincipalTabProps) {
  const { data, isLoading, isFetching, refetch } = usePanelPrincipal();
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [estado, setEstado] = useState('todos');

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((o) => {
      const matchSearch =
        !search ||
        o.order_number.toString().includes(search) ||
        o.customer_name.toLowerCase().includes(search.toLowerCase());
      const matchTipo = tipo === 'todos' || o.tipo === tipo;
      const matchEstado = estado === 'todos' || o.estado === estado;
      return matchSearch && matchTipo && matchEstado;
    });
  }, [data, search, tipo, estado]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PanelPrincipalFilters
        search={search}
        onSearchChange={setSearch}
        tipo={tipo}
        onTipoChange={setTipo}
        estado={estado}
        onEstadoChange={setEstado}
      />

      {/* Desktop Table */}
      <Card className="overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-3 py-2.5 text-left font-medium text-xs">Tipo</th>
                <th className="px-3 py-2.5 text-left font-medium text-xs">Estado</th>
                <th className="px-3 py-2.5 text-left font-medium text-xs"># Pedido</th>
                <th className="px-3 py-2.5 text-left font-medium text-xs">Cliente</th>
                <th className="px-3 py-2.5 text-left font-medium text-xs">Asesor</th>
                <th className="px-3 py-2.5 text-left font-medium text-xs">Fecha Clave</th>
                <th className="px-3 py-2.5 text-left font-medium text-xs">Indicador</th>
                <th className="px-3 py-2.5 text-right font-medium text-xs">Total</th>
                <th className="px-3 py-2.5 text-center font-medium text-xs"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((order) => {
                const estadoCfg = ESTADO_CONFIG[order.estado];
                const EstadoIcon = estadoIcons[order.estado as keyof typeof estadoIcons] || CheckCircle2;
                const TipoIcon = order.tipo === 'fisico' ? Package : FileKey;
                return (
                  <tr
                    key={order.order_id}
                    className="hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => onViewDetail(order.order_id)}
                  >
                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          order.tipo === 'fisico'
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400'
                        }`}
                      >
                        <TipoIcon className="h-3 w-3 mr-1" />
                        {order.tipo === 'fisico' ? 'Físico' : 'Intangible'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${estadoCfg?.bg || ''}`}>
                        <EstadoIcon className={`h-3.5 w-3.5 ${estadoCfg?.text || ''}`} />
                        <span className={`text-xs font-medium ${estadoCfg?.text || ''}`}>
                          {estadoCfg?.label || order.estado}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                        #{order.order_number}
                      </code>
                      {order.quote_number && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">
                          COT-{order.quote_number}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs max-w-[200px] truncate">{order.customer_name}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{order.advisor_name}</td>
                    <td className="px-3 py-2 text-xs">
                      {new Date(order.fecha_clave).toLocaleDateString('es-CO', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2 text-xs max-w-[200px]">
                      <span className="line-clamp-1">{order.indicador_pendientes}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-medium">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail(order.order_id);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron pedidos</p>
          </div>
        )}
      </Card>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((order) => {
          const estadoCfg = ESTADO_CONFIG[order.estado];
          const EstadoIcon = estadoIcons[order.estado as keyof typeof estadoIcons] || CheckCircle2;
          return (
            <Card
              key={order.order_id}
              className={`p-4 cursor-pointer hover:bg-muted/30 transition-colors border-l-4 ${estadoCfg?.border || ''}`}
              onClick={() => onViewDetail(order.order_id)}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-muted/50 px-2 py-0.5 rounded">
                    #{order.order_number}
                  </code>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      order.tipo === 'fisico'
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400'
                        : 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400'
                    }`}
                  >
                    {order.tipo === 'fisico' ? 'Físico' : 'Intangible'}
                  </Badge>
                </div>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${estadoCfg?.bg || ''}`}>
                  <EstadoIcon className={`h-3 w-3 ${estadoCfg?.text || ''}`} />
                </div>
              </div>
              <p className="text-sm font-medium truncate mb-1">{order.customer_name}</p>
              <div className={`rounded-lg p-2 mb-2 ${estadoCfg?.bg || 'bg-muted/50'}`}>
                <p className="text-xs">{order.indicador_pendientes}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {new Date(order.fecha_clave).toLocaleDateString('es-CO', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(order.total, order.currency)}
                </span>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron pedidos</p>
          </Card>
        )}
      </div>
    </div>
  );
}
