'use client';

import { useState, useMemo } from 'react';
import { Card } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Search, Eye, Package, Info } from 'lucide-react';
import { ResponsableColorCell } from './responsable-color-cell';
import { ColorLegend } from './color-legend';
import { RESPONSABLE_COLORS } from '../_lib/schemas';
import type { TableroOperativoOrder, ResponsableColor } from '../_lib/types';

interface VistaOperativaProps {
  data: TableroOperativoOrder[];
  onViewDetail: (orderId: string) => void;
}

export function VistaOperativa({ data, onViewDetail }: VistaOperativaProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('todos');
  const [filtroCliente, setFiltroCliente] = useState('todos');

  const clientesUnicos = useMemo(() => Array.from(new Set(data.map((r) => r.customer_name))).sort(), [data]);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const matchBusqueda =
        !busqueda ||
        r.order_number.toString().includes(busqueda) ||
        r.customer_name.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.order_product.toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.po_number && r.po_number.toString().includes(busqueda));
      const matchResponsable = filtroResponsable === 'todos' || r.responsable_color === filtroResponsable;
      const matchCliente = filtroCliente === 'todos' || r.customer_name === filtroCliente;
      return matchBusqueda && matchResponsable && matchCliente;
    });
  }, [data, busqueda, filtroResponsable, filtroCliente]);

  const conteo = useMemo(() => {
    const c: Record<string, number> = {};
    Object.keys(RESPONSABLE_COLORS).forEach((k) => (c[k] = 0));
    filtered.forEach((r) => {
      if (r.responsable_color && c[r.responsable_color] !== undefined) c[r.responsable_color]++;
    });
    return c;
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* 7-color summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {Object.entries(RESPONSABLE_COLORS).map(([key, config]) => (
          <Card
            key={key}
            className={`p-3 border-2 cursor-pointer hover:scale-105 transition-all ${config.bg} ${config.border}`}
            onClick={() => setFiltroResponsable(filtroResponsable === key ? 'todos' : key)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className={`h-2.5 w-2.5 rounded-full ${config.solid}`} />
              <span className="text-lg font-bold">{conteo[key] || 0}</span>
            </div>
            <p className="text-[10px] font-medium leading-tight">{config.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar OC, cliente, producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroCliente} onValueChange={setFiltroCliente}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los clientes</SelectItem>
              {clientesUnicos.map((cliente) => (
                <SelectItem key={cliente} value={cliente}>
                  {cliente}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroResponsable} onValueChange={setFiltroResponsable}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por responsable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los responsables</SelectItem>
              {Object.entries(RESPONSABLE_COLORS).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${config.solid}`} />
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filtroResponsable !== 'todos' && RESPONSABLE_COLORS[filtroResponsable] && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-0.5">{RESPONSABLE_COLORS[filtroResponsable]!.label}</p>
                <p className="text-[11px]">{RESPONSABLE_COLORS[filtroResponsable]!.description}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Desktop Dense Table */}
      <Card className="overflow-hidden hidden xl:block">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="border-b-2">
                <th className="px-2 py-2 text-left font-medium text-[10px] whitespace-nowrap">Proveedor</th>
                <th className="px-2 py-2 text-left font-medium text-[10px] whitespace-nowrap">OC</th>
                <th className="px-2 py-2 text-left font-medium text-[10px] whitespace-nowrap">Cliente</th>
                <th className="px-2 py-2 text-left font-medium text-[10px] whitespace-nowrap">OP</th>
                <th className="px-2 py-2 text-left font-medium text-[10px] whitespace-nowrap">Producto</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap">Cant.</th>
                <th className="px-2 py-2 text-left font-medium text-[10px] whitespace-nowrap">F. Entrega</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap">Resp.</th>
                <th className="px-2 py-2 text-left font-medium text-[10px] max-w-[200px]">Novedades</th>
                <th className="bg-primary/10 w-1" />
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap bg-muted/30">REM</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap bg-muted/30">Fact.</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap bg-muted/30">Transp.</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap bg-muted/30">Guía</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap bg-muted/30">CRM</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap bg-muted/30">Correo UF</th>
                <th className="px-2 py-2 text-center font-medium text-[10px]" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.order_id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-2 py-2 text-[11px] whitespace-nowrap">{r.supplier_name}</td>
                  <td className="px-2 py-2">
                    {r.po_number ? (
                      <code className="text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded">OC-{r.po_number}</code>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-[11px] max-w-[150px] truncate" title={r.customer_name}>
                    {r.customer_name}
                  </td>
                  <td className="px-2 py-2">
                    <code className="text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded">#{r.order_number}</code>
                  </td>
                  <td className="px-2 py-2 text-[11px] max-w-[200px] truncate" title={r.order_product}>
                    {r.order_product}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {r.order_quantity}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 text-[11px] whitespace-nowrap">
                    {r.expected_delivery
                      ? new Date(r.expected_delivery).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <ResponsableColorCell color={r.responsable_color} />
                  </td>
                  <td className="px-2 py-2 text-[11px] max-w-[200px]">
                    <div className="line-clamp-2" title={r.novedades}>
                      {r.novedades}
                    </div>
                  </td>
                  <td className="bg-primary/10" />
                  <td className="px-2 py-2 bg-muted/10"><ResponsableColorCell color={r.sub_rem} /></td>
                  <td className="px-2 py-2 bg-muted/10"><ResponsableColorCell color={r.sub_factura} /></td>
                  <td className="px-2 py-2 bg-muted/10"><ResponsableColorCell color={r.sub_transportadora} /></td>
                  <td className="px-2 py-2 bg-muted/10"><ResponsableColorCell color={r.sub_guia} /></td>
                  <td className="px-2 py-2 bg-muted/10"><ResponsableColorCell color={r.sub_crm} /></td>
                  <td className="px-2 py-2 bg-muted/10"><ResponsableColorCell color={r.sub_correo_uf} /></td>
                  <td className="px-2 py-2 text-center">
                    <Button size="sm" variant="ghost" onClick={() => onViewDetail(r.order_id)} className="h-7 w-7 p-0">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron registros</p>
          </div>
        )}
      </Card>

      {/* Mobile Cards */}
      <div className="xl:hidden space-y-3">
        {filtered.map((r) => (
          <Card key={r.order_id} className="p-4 hover:bg-muted/30 transition-colors" onClick={() => onViewDetail(r.order_id)}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {r.po_number && <code className="text-[11px] font-mono bg-muted/50 px-2 py-0.5 rounded">OC-{r.po_number}</code>}
                  <code className="text-[11px] font-mono bg-muted/50 px-2 py-0.5 rounded">#{r.order_number}</code>
                </div>
                <p className="text-sm font-medium truncate">{r.customer_name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.order_product}</p>
              </div>
              <ResponsableColorCell color={r.responsable_color} />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Proveedor</p>
                <p className="font-medium text-[11px] truncate">{r.supplier_name}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Cantidad</p>
                <p className="font-medium">{r.order_quantity}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">F. Entrega</p>
                <p className="font-medium text-[11px]">
                  {r.expected_delivery ? new Date(r.expected_delivery).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 mb-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Novedades:</p>
              <p className="text-[11px] line-clamp-2">{r.novedades}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-medium">Subprocesos:</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center"><p className="text-[9px] text-muted-foreground mb-1">REM</p><ResponsableColorCell color={r.sub_rem} /></div>
                <div className="text-center"><p className="text-[9px] text-muted-foreground mb-1">Factura</p><ResponsableColorCell color={r.sub_factura} /></div>
                <div className="text-center"><p className="text-[9px] text-muted-foreground mb-1">Transp.</p><ResponsableColorCell color={r.sub_transportadora} /></div>
                <div className="text-center"><p className="text-[9px] text-muted-foreground mb-1">Guía</p><ResponsableColorCell color={r.sub_guia} /></div>
                <div className="text-center"><p className="text-[9px] text-muted-foreground mb-1">CRM</p><ResponsableColorCell color={r.sub_crm} /></div>
                <div className="text-center"><p className="text-[9px] text-muted-foreground mb-1">Correo</p><ResponsableColorCell color={r.sub_correo_uf} /></div>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron registros</p>
          </Card>
        )}
      </div>

      <ColorLegend />
    </div>
  );
}
