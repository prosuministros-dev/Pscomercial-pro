import { useState } from 'react';
import { 
  Search,
  Filter,
  AlertCircle,
  Package,
  Eye,
  Info,
  ChevronRight,
  Building2,
  User,
  Calendar
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { useTheme } from '../theme-provider';
import { 
  registrosTableroMock, 
  configColores, 
  type RegistroTablero, 
  type ColorEstado 
} from '../../lib/mock-tablero-operativo';

interface TableroOperativoProps {
  onVerDetalle?: (registroId: string) => void;
}

export function TableroOperativo({ onVerDetalle }: TableroOperativoProps) {
  const { gradients } = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState<string>('todos');
  const [filtroCliente, setFiltroCliente] = useState<string>('todos');

  // Extraer clientes únicos para filtro
  const clientesUnicos = Array.from(new Set(registrosTableroMock.map(r => r.cliente))).sort();

  // Filtrar registros
  const registrosFiltrados = registrosTableroMock.filter(registro => {
    const matchBusqueda = busqueda === '' || 
      registro.oc.toLowerCase().includes(busqueda.toLowerCase()) ||
      registro.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      registro.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
      registro.op.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchResponsable = filtroResponsable === 'todos' || registro.responsable === filtroResponsable;
    const matchCliente = filtroCliente === 'todos' || registro.cliente === filtroCliente;
    
    return matchBusqueda && matchResponsable && matchCliente;
  });

  // Renderizar celda con color
  const renderCeldaColor = (color: ColorEstado, contenido?: string) => {
    if (!color) {
      return (
        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
          —
        </div>
      );
    }

    const config = configColores[color];
    
    if (!config) {
      return (
        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
          —
        </div>
      );
    }
    
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`h-full flex items-center justify-center cursor-help transition-all hover:scale-105 ${config.color} border rounded px-2 py-1`}
            >
              <div className={`h-2 w-2 rounded-full ${config.colorSolido}`}></div>
              {contenido && <span className="ml-1.5 text-[11px] font-medium">{contenido}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[250px]">
            <p className="font-medium text-xs mb-1">{config.label}</p>
            <p className="text-[11px] text-muted-foreground">{config.descripcion}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Contar registros por color de responsable
  const contarPorColor = () => {
    const conteo: Record<string, number> = {
      'rojo': 0,
      'naranja': 0,
      'morado': 0,
      'amarillo': 0,
      'azul': 0,
      'verde-claro': 0,
      'verde-oscuro': 0
    };
    
    registrosFiltrados.forEach(r => {
      if (r.responsable) {
        conteo[r.responsable]++;
      }
    });
    
    return conteo;
  };

  const conteo = contarPorColor();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="rounded-lg p-2"
            style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)' }}
          >
            <Package className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2>Tablero Operativo de Seguimiento</h2>
            <p className="text-xs text-muted-foreground">
              Vista operativa para Gerente Operativo · Sistema de colores por responsabilidad
            </p>
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen por color */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {Object.entries(configColores).map(([key, config]) => (
          <Card 
            key={key}
            className={`p-3 border-2 cursor-pointer hover:scale-105 transition-all ${config.color}`}
            onClick={() => setFiltroResponsable(filtroResponsable === key ? 'todos' : key)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className={`h-2.5 w-2.5 rounded-full ${config.colorSolido}`}></div>
              <span className="text-lg font-bold">{conteo[key as ColorEstado] || 0}</span>
            </div>
            <p className="text-[10px] font-medium leading-tight">{config.label}</p>
          </Card>
        ))}
      </div>

      {/* Filtros y búsqueda */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Búsqueda */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar OC, cliente, producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtro Cliente */}
          <Select value={filtroCliente} onValueChange={setFiltroCliente}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los clientes</SelectItem>
              {clientesUnicos.map(cliente => (
                <SelectItem key={cliente} value={cliente}>{cliente}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Responsable */}
          <Select value={filtroResponsable} onValueChange={setFiltroResponsable}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por responsable" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los responsables</SelectItem>
              {Object.entries(configColores).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${config.colorSolido}`}></div>
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtroResponsable !== 'todos' && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-0.5">
                  {configColores[filtroResponsable as ColorEstado].label}
                </p>
                <p className="text-[11px]">
                  {configColores[filtroResponsable as ColorEstado].descripcion}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tabla principal - Vista Desktop Ultra Densa */}
      <Card className="overflow-hidden hidden xl:block">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="border-b-2 border-border">
                {/* Bloque 1: Información Operativa Base */}
                <th className="px-2 py-2 text-left font-medium text-[10px] whitespace-nowrap">Proveedor</th>
                <th className="px-2 py-2 text-left font-medium text-[10px] whitespace-nowrap">OC</th>
                <th className="px-2 py-2 text-left font-medium text-[10px] whitespace-nowrap">Cliente</th>
                <th className="px-2 py-2 text-left font-medium text-[10px] whitespace-nowrap">OP</th>
                <th className="px-2 py-2 text-left font-medium text-[10px] whitespace-nowrap">Producto</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap">Cant.</th>
                <th className="px-2 py-2 text-left font-medium text-[10px] whitespace-nowrap">F. Entrega</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap">Resp.</th>
                <th className="px-2 py-2 text-left font-medium text-[10px] max-w-[200px]">Novedades</th>
                
                {/* Separador visual */}
                <th className="bg-primary/10 w-1"></th>
                
                {/* Bloque 2: Subprocesos Administrativos */}
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap bg-muted/30">REM</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap bg-muted/30">Fact.</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap bg-muted/30">Transp.</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap bg-muted/30">Guía</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap bg-muted/30">CRM</th>
                <th className="px-2 py-2 text-center font-medium text-[10px] whitespace-nowrap bg-muted/30">Correo UF</th>
                
                <th className="px-2 py-2 text-center font-medium text-[10px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {registrosFiltrados.map((registro) => (
                <tr 
                  key={registro.id} 
                  className="hover:bg-muted/20 transition-colors"
                >
                  {/* Información Operativa */}
                  <td className="px-2 py-2 text-[11px] whitespace-nowrap">{registro.proveedor}</td>
                  <td className="px-2 py-2">
                    <code className="text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                      {registro.oc}
                    </code>
                  </td>
                  <td className="px-2 py-2 text-[11px] max-w-[150px] truncate" title={registro.cliente}>
                    {registro.cliente}
                  </td>
                  <td className="px-2 py-2">
                    <code className="text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                      {registro.op}
                    </code>
                  </td>
                  <td className="px-2 py-2 text-[11px] max-w-[200px] truncate" title={registro.producto}>
                    {registro.producto}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {registro.cantidad}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 text-[11px] whitespace-nowrap">
                    {new Date(registro.fechaEntrega).toLocaleDateString('es-CO', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {renderCeldaColor(registro.responsable)}
                  </td>
                  <td className="px-2 py-2 text-[11px] max-w-[200px]">
                    <div className="line-clamp-2" title={registro.novedades}>
                      {registro.novedades}
                    </div>
                  </td>
                  
                  {/* Separador visual */}
                  <td className="bg-primary/10"></td>
                  
                  {/* Subprocesos Administrativos */}
                  <td className="px-2 py-2 bg-muted/10">
                    {renderCeldaColor(registro.subprocesos.rem)}
                  </td>
                  <td className="px-2 py-2 bg-muted/10">
                    {renderCeldaColor(registro.subprocesos.factura)}
                  </td>
                  <td className="px-2 py-2 bg-muted/10">
                    {renderCeldaColor(registro.subprocesos.transportadora)}
                  </td>
                  <td className="px-2 py-2 bg-muted/10">
                    {renderCeldaColor(registro.subprocesos.guia)}
                  </td>
                  <td className="px-2 py-2 bg-muted/10">
                    {renderCeldaColor(registro.subprocesos.obsCrm)}
                  </td>
                  <td className="px-2 py-2 bg-muted/10">
                    {renderCeldaColor(registro.subprocesos.correoUF)}
                  </td>
                  
                  {/* Acciones */}
                  <td className="px-2 py-2 text-center">
                    {onVerDetalle && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onVerDetalle(registro.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {registrosFiltrados.length === 0 && (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron registros</p>
          </div>
        )}
      </Card>

      {/* Vista Tablet/Mobile - Cards compactas */}
      <div className="xl:hidden space-y-3">
        {registrosFiltrados.map((registro) => (
          <Card 
            key={registro.id} 
            className="p-4 hover:bg-muted/30 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-[11px] font-mono bg-muted/50 px-2 py-0.5 rounded">
                    {registro.oc}
                  </code>
                  <code className="text-[11px] font-mono bg-muted/50 px-2 py-0.5 rounded">
                    {registro.op}
                  </code>
                </div>
                <p className="text-sm font-medium truncate">{registro.cliente}</p>
                <p className="text-xs text-muted-foreground truncate">{registro.producto}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {renderCeldaColor(registro.responsable)}
                {onVerDetalle && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onVerDetalle(registro.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Info secundaria */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Proveedor</p>
                <p className="font-medium text-[11px] truncate" title={registro.proveedor}>
                  {registro.proveedor}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Cantidad</p>
                <p className="font-medium">{registro.cantidad}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">F. Entrega</p>
                <p className="font-medium text-[11px]">
                  {new Date(registro.fechaEntrega).toLocaleDateString('es-CO', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Novedades */}
            <div className="bg-muted/50 rounded-lg p-2 mb-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Novedades:</p>
              <p className="text-[11px] line-clamp-2">{registro.novedades}</p>
            </div>

            <Separator className="my-3" />

            {/* Subprocesos en grid compacto */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-medium">Subprocesos:</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground mb-1">REM</p>
                  {renderCeldaColor(registro.subprocesos.rem)}
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground mb-1">Factura</p>
                  {renderCeldaColor(registro.subprocesos.factura)}
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground mb-1">Transp.</p>
                  {renderCeldaColor(registro.subprocesos.transportadora)}
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground mb-1">Guía</p>
                  {renderCeldaColor(registro.subprocesos.guia)}
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground mb-1">CRM</p>
                  {renderCeldaColor(registro.subprocesos.obsCrm)}
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground mb-1">Correo</p>
                  {renderCeldaColor(registro.subprocesos.correoUF)}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {registrosFiltrados.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron registros</p>
          </Card>
        )}
      </div>

      {/* Leyenda de colores - Footer */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-2 mb-3">
          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium mb-1">Sistema de Colores por Responsabilidad</p>
            <p className="text-[11px] text-muted-foreground">
              Cada columna representa un proceso independiente. Una fila puede tener múltiples colores simultáneamente.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {Object.entries(configColores).map(([key, config]) => (
            <div key={key} className="flex items-start gap-2 text-xs">
              <div className={`h-3 w-3 rounded-full ${config.colorSolido} flex-shrink-0 mt-0.5`}></div>
              <div>
                <p className="font-medium text-[11px]">{config.label}</p>
                <p className="text-[10px] text-muted-foreground">{config.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}