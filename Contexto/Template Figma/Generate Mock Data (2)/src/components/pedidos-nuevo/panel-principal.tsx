import { useState } from 'react';
import { 
  Search,
  Filter,
  ArrowUpDown,
  Package,
  FileKey,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  MoreHorizontal,
  Plus
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useTheme } from '../theme-provider';

interface Pedido {
  id: string;
  numero: string;
  cliente: string;
  tipo: 'fisico' | 'intangible';
  estado: 'sin_pendientes' | 'atencion_requerida' | 'critico';
  fechaClave: string;
  indicadorPendientes: string;
  cotizacionOrigen?: string;
  total: number;
  estadoDetallado: string;
}

// Mock data
const pedidosMock: Pedido[] = [
  {
    id: '1',
    numero: 'PED-2025-001',
    cliente: 'ALLIANZ TECHNOLOGY S.E.',
    tipo: 'fisico',
    estado: 'sin_pendientes',
    fechaClave: '2025-01-25',
    indicadorPendientes: 'Todo OK - En bodega',
    cotizacionOrigen: 'COT-0025192',
    total: 95598.65,
    estadoDetallado: 'En Bodega'
  },
  {
    id: '2',
    numero: 'PED-2025-002',
    cliente: 'MOTA-ENGIL COLOMBIA',
    tipo: 'fisico',
    estado: 'atencion_requerida',
    fechaClave: '2025-01-22',
    indicadorPendientes: 'Pago pendiente',
    cotizacionOrigen: 'COT-0025193',
    total: 9050.75,
    estadoDetallado: 'Pendiente Pago'
  },
  {
    id: '3',
    numero: 'PED-2025-003',
    cliente: 'OSAKA ELECTRONICS',
    tipo: 'intangible',
    estado: 'sin_pendientes',
    fechaClave: '2025-01-20',
    indicadorPendientes: 'Licencias activadas',
    cotizacionOrigen: 'COT-0025194',
    total: 171176.46,
    estadoDetallado: 'Completado'
  },
  {
    id: '4',
    numero: 'PED-2025-004',
    cliente: 'TECH SOLUTIONS SAS',
    tipo: 'fisico',
    estado: 'critico',
    fechaClave: '2025-01-18',
    indicadorPendientes: 'Retraso en compra - Cliente esperando',
    cotizacionOrigen: 'COT-0025195',
    total: 250000,
    estadoDetallado: 'Pendiente Compra'
  },
  {
    id: '5',
    numero: 'PED-2025-005',
    cliente: 'INNOVATECH CORP',
    tipo: 'intangible',
    estado: 'atencion_requerida',
    fechaClave: '2025-01-23',
    indicadorPendientes: 'Pendiente activación licencias',
    cotizacionOrigen: 'COT-0025196',
    total: 180000,
    estadoDetallado: 'Por Activar'
  },
];

interface PanelPrincipalProps {
  onVerDetalle: (pedidoId: string) => void;
  onCrearPedido: () => void;
  onEditarPedido?: (pedidoId: string) => void;
}

export function PanelPrincipal({ onVerDetalle, onCrearPedido, onEditarPedido }: PanelPrincipalProps) {
  const { gradients } = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [ordenarPor, setOrdenarPor] = useState<string>('fecha_desc');

  // Filtrar pedidos
  const pedidosFiltrados = pedidosMock.filter(pedido => {
    const matchBusqueda = busqueda === '' || 
      pedido.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.cliente.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchTipo = filtroTipo === 'todos' || pedido.tipo === filtroTipo;
    const matchEstado = filtroEstado === 'todos' || pedido.estado === filtroEstado;
    
    return matchBusqueda && matchTipo && matchEstado;
  });

  // Obtener color de fondo según tipo
  const getTipoColor = (tipo: 'fisico' | 'intangible') => {
    if (tipo === 'fisico') {
      return 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400';
    }
    return 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400';
  };

  // Obtener indicador de estado
  const getEstadoIndicador = (estado: 'sin_pendientes' | 'atencion_requerida' | 'critico') => {
    const indicadores = {
      sin_pendientes: {
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-500',
        bg: 'bg-green-500/10',
        label: 'Sin Pendientes'
      },
      atencion_requerida: {
        icon: Clock,
        color: 'text-yellow-600 dark:text-yellow-500',
        bg: 'bg-yellow-500/10',
        label: 'Atención Requerida'
      },
      critico: {
        icon: AlertCircle,
        color: 'text-red-600 dark:text-red-500',
        bg: 'bg-red-500/10',
        label: 'Crítico'
      }
    };

    const indicador = indicadores[estado];
    const Icon = indicador.icon;

    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${indicador.bg}`}>
        <Icon className={`h-3.5 w-3.5 ${indicador.color}`} />
        <span className={`text-xs font-medium ${indicador.color}`}>
          {indicador.label}
        </span>
      </div>
    );
  };

  // Obtener icono de tipo
  const getTipoIcon = (tipo: 'fisico' | 'intangible') => {
    if (tipo === 'fisico') {
      return <Package className="h-3.5 w-3.5" />;
    }
    return <FileKey className="h-3.5 w-3.5" />;
  };

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
            <h2>Gestión de Pedidos</h2>
            <p className="text-xs text-muted-foreground">Control operativo centralizado</p>
          </div>
        </div>
        <Button onClick={onCrearPedido} className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Pedido
        </Button>
      </div>

      {/* Filtros y búsqueda VISIBLES (no ocultos) */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Búsqueda */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número o cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtro Tipo */}
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de pedido" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="fisico">🔵 Físico</SelectItem>
              <SelectItem value="intangible">🟣 Intangible</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Estado */}
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="sin_pendientes">🟢 Sin Pendientes</SelectItem>
              <SelectItem value="atencion_requerida">🟡 Atención Requerida</SelectItem>
              <SelectItem value="critico">🔴 Crítico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ordenamiento manual visible */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Ordenar por:</span>
          <Select value={ordenarPor} onValueChange={setOrdenarPor}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fecha_desc">Fecha (más reciente)</SelectItem>
              <SelectItem value="fecha_asc">Fecha (más antigua)</SelectItem>
              <SelectItem value="cliente">Cliente (A-Z)</SelectItem>
              <SelectItem value="total_desc">Total (mayor a menor)</SelectItem>
              <SelectItem value="estado">Estado (crítico primero)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabla principal - Vista Desktop */}
      <Card className="overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-xs">
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-left font-medium">Número</th>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Fecha Clave</th>
                <th className="px-4 py-3 text-left font-medium">Indicador Pendientes</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pedidosFiltrados.map((pedido) => (
                <tr 
                  key={pedido.id} 
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onVerDetalle(pedido.id)}
                >
                  {/* Tipo - Color base (azul/morado) */}
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={getTipoColor(pedido.tipo)}>
                      <span className="flex items-center gap-1.5">
                        {getTipoIcon(pedido.tipo)}
                        <span className="text-xs font-medium">
                          {pedido.tipo === 'fisico' ? 'Físico' : 'Intangible'}
                        </span>
                      </span>
                    </Badge>
                  </td>

                  {/* Estado - Indicador adicional (verde/amarillo/rojo) */}
                  <td className="px-4 py-3">
                    {getEstadoIndicador(pedido.estado)}
                  </td>

                  {/* Número */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-mono text-sm font-medium">{pedido.numero}</p>
                      {pedido.cotizacionOrigen && (
                        <p className="text-xs text-muted-foreground">
                          desde {pedido.cotizacionOrigen}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium truncate max-w-[200px]">
                      {pedido.cliente}
                    </p>
                  </td>

                  {/* Fecha Clave */}
                  <td className="px-4 py-3">
                    <p className="text-sm">
                      {new Date(pedido.fechaClave).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </td>

                  {/* Indicador Pendientes */}
                  <td className="px-4 py-3">
                    <p className="text-sm">{pedido.indicadorPendientes}</p>
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-medium">
                      ${pedido.total.toLocaleString('es-CO')}
                    </p>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onVerDetalle(pedido.id)}
                        className="h-8 gap-2"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEditarPedido && (
                            <DropdownMenuItem className="text-sm" onClick={() => onEditarPedido(pedido.id)}>
                              Editar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-sm">Duplicar</DropdownMenuItem>
                          <DropdownMenuItem className="text-sm text-destructive">Cancelar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pedidosFiltrados.length === 0 && (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron pedidos</p>
          </div>
        )}
      </Card>

      {/* Vista Mobile */}
      <div className="lg:hidden space-y-3">
        {pedidosFiltrados.map((pedido) => (
          <Card 
            key={pedido.id} 
            className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => onVerDetalle(pedido.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-medium mb-1">{pedido.numero}</p>
                <p className="text-sm font-medium truncate">{pedido.cliente}</p>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onVerDetalle(pedido.id);
                }}
                className="h-8 gap-2 flex-shrink-0"
              >
                <Eye className="h-3.5 w-3.5" />
                Ver
              </Button>
            </div>

            {/* Tipo y Estado */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={getTipoColor(pedido.tipo)}>
                <span className="flex items-center gap-1.5">
                  {getTipoIcon(pedido.tipo)}
                  <span className="text-xs font-medium">
                    {pedido.tipo === 'fisico' ? 'Físico' : 'Intangible'}
                  </span>
                </span>
              </Badge>
              {getEstadoIndicador(pedido.estado)}
            </div>

            {/* Indicador */}
            <div className="bg-muted/50 rounded-lg p-2 mb-3">
              <p className="text-xs text-muted-foreground mb-0.5">Estado:</p>
              <p className="text-sm">{pedido.indicadorPendientes}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Fecha clave</p>
                <p className="font-medium">
                  {new Date(pedido.fechaClave).toLocaleDateString('es-CO', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-medium">
                  ${pedido.total.toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {pedidosFiltrados.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron pedidos</p>
          </Card>
        )}
      </div>
    </div>
  );
}