import { 
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  FileKey,
  ChevronRight,
  Filter,
  Edit3
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState } from 'react';

interface PendientePedido {
  id: string;
  numero: string;
  cliente: string;
  tipo: 'fisico' | 'intangible';
  nivelAtencion: 'sin_pendientes' | 'atencion_requerida' | 'critico';
  motivoPendiente: string;
  fechaClave: string;
  diasRestantes: number;
}

// Mock data
const pedidosPendientes: PendientePedido[] = [
  {
    id: '1',
    numero: 'PED-2025-004',
    cliente: 'TECH SOLUTIONS SAS',
    tipo: 'fisico',
    nivelAtencion: 'critico',
    motivoPendiente: 'Retraso en compra - Cliente esperando urgente',
    fechaClave: '2025-01-18',
    diasRestantes: -2 // negativo = atrasado
  },
  {
    id: '2',
    numero: 'PED-2025-002',
    cliente: 'MOTA-ENGIL COLOMBIA',
    tipo: 'fisico',
    nivelAtencion: 'atencion_requerida',
    motivoPendiente: 'Pago pendiente de confirmación',
    fechaClave: '2025-01-22',
    diasRestantes: 3
  },
  {
    id: '3',
    numero: 'PED-2025-005',
    cliente: 'INNOVATECH CORP',
    tipo: 'intangible',
    nivelAtencion: 'atencion_requerida',
    motivoPendiente: 'Pendiente activación de licencias',
    fechaClave: '2025-01-23',
    diasRestantes: 4
  },
  {
    id: '4',
    numero: 'PED-2025-001',
    cliente: 'ALLIANZ TECHNOLOGY S.E.',
    tipo: 'fisico',
    nivelAtencion: 'sin_pendientes',
    motivoPendiente: 'Todo OK - Listo para despacho',
    fechaClave: '2025-01-25',
    diasRestantes: 6
  },
  {
    id: '5',
    numero: 'PED-2025-003',
    cliente: 'OSAKA ELECTRONICS',
    tipo: 'intangible',
    nivelAtencion: 'sin_pendientes',
    motivoPendiente: 'Licencias activadas correctamente',
    fechaClave: '2025-01-20',
    diasRestantes: 1
  },
  {
    id: '6',
    numero: 'PED-2025-006',
    cliente: 'GLOBAL TECH INC',
    tipo: 'fisico',
    nivelAtencion: 'critico',
    motivoPendiente: 'Mercancía sin confirmar - Contactar proveedor',
    fechaClave: '2025-01-19',
    diasRestantes: 0
  },
];

interface VistaPendientesProps {
  onVerDetalle: (pedidoId: string) => void;
}

export function VistaPendientes({ onVerDetalle }: VistaPendientesProps) {
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  // Filtrar pedidos
  const pedidosFiltrados = pedidosPendientes
    .filter(p => {
      const matchNivel = filtroNivel === 'todos' || p.nivelAtencion === filtroNivel;
      const matchTipo = filtroTipo === 'todos' || p.tipo === filtroTipo;
      return matchNivel && matchTipo;
    })
    .sort((a, b) => {
      // Ordenar por prioridad: crítico primero, luego atención, luego sin pendientes
      const orden = { critico: 0, atencion_requerida: 1, sin_pendientes: 2 };
      return orden[a.nivelAtencion] - orden[b.nivelAtencion];
    });

  // Obtener color de fondo según tipo (azul/morado)
  const getTipoColor = (tipo: 'fisico' | 'intangible') => {
    if (tipo === 'fisico') {
      return 'bg-blue-500 dark:bg-blue-600';
    }
    return 'bg-purple-500 dark:bg-purple-600';
  };

  // Obtener color de borde según nivel de atención (verde/amarillo/rojo)
  const getNivelColor = (nivel: 'sin_pendientes' | 'atencion_requerida' | 'critico') => {
    const colores = {
      sin_pendientes: {
        border: 'border-green-500',
        bg: 'bg-green-500/10',
        icon: CheckCircle2,
        iconColor: 'text-green-600 dark:text-green-500',
        badge: 'bg-green-500 dark:bg-green-600'
      },
      atencion_requerida: {
        border: 'border-yellow-500',
        bg: 'bg-yellow-500/10',
        icon: Clock,
        iconColor: 'text-yellow-600 dark:text-yellow-500',
        badge: 'bg-yellow-500 dark:bg-yellow-600'
      },
      critico: {
        border: 'border-red-500',
        bg: 'bg-red-500/10',
        icon: AlertCircle,
        iconColor: 'text-red-600 dark:text-red-500',
        badge: 'bg-red-500 dark:bg-red-600'
      }
    };
    return colores[nivel];
  };

  // Obtener icono de tipo
  const getTipoIcon = (tipo: 'fisico' | 'intangible') => {
    return tipo === 'fisico' ? Package : FileKey;
  };

  // Stats
  const stats = {
    criticos: pedidosPendientes.filter(p => p.nivelAtencion === 'critico').length,
    atencion: pedidosPendientes.filter(p => p.nivelAtencion === 'atencion_requerida').length,
    ok: pedidosPendientes.filter(p => p.nivelAtencion === 'sin_pendientes').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="mb-1">Control Operativo Diario</h3>
        <p className="text-xs text-muted-foreground">
          Vista de checklist visual - Priorización inmediata por colores
        </p>
      </div>

      {/* Stats Rápidos */}
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

      {/* Filtros */}
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
              <SelectItem value="critico">🔴 Crítico</SelectItem>
              <SelectItem value="atencion_requerida">🟡 Atención</SelectItem>
              <SelectItem value="sin_pendientes">🟢 Sin Pendientes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="fisico">🔵 Físico</SelectItem>
              <SelectItem value="intangible">🟣 Intangible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Listado de Pedidos - Diseño Visual tipo Checklist */}
      <div className="space-y-2">
        {pedidosFiltrados.map((pedido) => {
          const nivelConfig = getNivelColor(pedido.nivelAtencion);
          const IconoNivel = nivelConfig.icon;
          const IconoTipo = getTipoIcon(pedido.tipo);

          return (
            <Card 
              key={pedido.id}
              className={`relative overflow-hidden border-l-4 ${nivelConfig.border} cursor-pointer hover:bg-muted/30 transition-all`}
              onClick={() => onVerDetalle(pedido.id)}
            >
              <div className="p-4">
                {/* Header con indicadores de color */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Barra de tipo (azul/morado) */}
                  <div className={`w-1 h-full absolute left-0 top-0 ${getTipoColor(pedido.tipo)}`} />

                  {/* Badge de nivel (verde/amarillo/rojo) */}
                  <div className={`w-10 h-10 rounded-lg ${nivelConfig.bg} flex items-center justify-center flex-shrink-0`}>
                    <IconoNivel className={`h-5 w-5 ${nivelConfig.iconColor}`} />
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono text-sm font-medium">{pedido.numero}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${pedido.tipo === 'fisico' 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400' 
                          : 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400'
                        }`}
                      >
                        <IconoTipo className="h-3 w-3 mr-1" />
                        {pedido.tipo === 'fisico' ? 'Físico' : 'Intangible'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{pedido.cliente}</p>
                  </div>

                  {/* Días restantes */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-medium ${
                      pedido.diasRestantes < 0 ? 'text-red-600' :
                      pedido.diasRestantes === 0 ? 'text-orange-600' :
                      'text-muted-foreground'
                    }`}>
                      {pedido.diasRestantes < 0 
                        ? `${Math.abs(pedido.diasRestantes)} días atrasado`
                        : pedido.diasRestantes === 0 
                        ? 'HOY' 
                        : `${pedido.diasRestantes} días`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(pedido.fechaClave).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  {/* Botón Ver */}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVerDetalle(pedido.id);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Motivo del pendiente - VISIBLE y CLARO */}
                <div className={`rounded-lg p-3 ${nivelConfig.bg}`}>
                  <p className="text-sm font-medium">{pedido.motivoPendiente}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {pedidosFiltrados.length === 0 && (
        <Card className="p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No hay pedidos en esta categoría</p>
        </Card>
      )}

      {/* Leyenda de colores */}
      <Card className="p-4 bg-muted/30">
        <h4 className="text-sm font-medium mb-3">Leyenda de Colores</h4>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium mb-2">Tipo de Pedido (Barra Base)</p>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>Pedido Físico</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500" />
                <span>Licencias / Intangibles</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-2">Nivel de Atención (Indicador Principal)</p>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Sin Pendientes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Atención Requerida</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Crítico</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}