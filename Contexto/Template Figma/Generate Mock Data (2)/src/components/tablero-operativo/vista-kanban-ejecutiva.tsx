import { useState } from 'react';
import { 
  LayoutGrid,
  Package,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  ShoppingCart
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTheme } from '../theme-provider';
import { 
  generarVistaEjecutiva,
  labelEstadosMacro,
  type VistaEjecutiva,
  type EstadoMacro
} from '../../lib/mock-tablero-operativo';

export function VistaKanbanEjecutiva() {
  const { gradients } = useTheme();
  const [vistaEjecutiva] = useState<VistaEjecutiva[]>(generarVistaEjecutiva());

  // Agrupar por estado macro
  const agrupadosPorEstado = vistaEjecutiva.reduce((acc, item) => {
    if (!acc[item.estadoMacro]) {
      acc[item.estadoMacro] = [];
    }
    acc[item.estadoMacro].push(item);
    return acc;
  }, {} as Record<EstadoMacro, VistaEjecutiva[]>);

  // Configuración de columnas Kanban
  const columnasKanban = [
    {
      id: 'en_compras' as EstadoMacro,
      titulo: 'En Compras',
      descripcion: 'Pedidos en proceso de compra',
      icon: ShoppingCart,
      color: 'bg-amber-500/10 border-amber-500/30',
      headerColor: 'bg-amber-500',
      textColor: 'text-amber-700 dark:text-amber-400'
    },
    {
      id: 'en_proveedor' as EstadoMacro,
      titulo: 'En Proveedor',
      descripcion: 'Esperando producto del proveedor',
      icon: Building2,
      color: 'bg-blue-500/10 border-blue-500/30',
      headerColor: 'bg-blue-500',
      textColor: 'text-blue-700 dark:text-blue-400'
    },
    {
      id: 'en_transporte' as EstadoMacro,
      titulo: 'En Transporte',
      descripcion: 'Productos en ruta',
      icon: Truck,
      color: 'bg-purple-500/10 border-purple-500/30',
      headerColor: 'bg-purple-500',
      textColor: 'text-purple-700 dark:text-purple-400'
    },
    {
      id: 'en_bodega' as EstadoMacro,
      titulo: 'En Bodega',
      descripcion: 'Productos en bodega o despacho',
      icon: Package,
      color: 'bg-indigo-500/10 border-indigo-500/30',
      headerColor: 'bg-indigo-500',
      textColor: 'text-indigo-700 dark:text-indigo-400'
    },
    {
      id: 'bloqueado' as EstadoMacro,
      titulo: 'Bloqueado',
      descripcion: 'Requieren atención inmediata',
      icon: AlertTriangle,
      color: 'bg-red-500/10 border-red-500/30',
      headerColor: 'bg-red-500',
      textColor: 'text-red-700 dark:text-red-400'
    },
    {
      id: 'cerrado' as EstadoMacro,
      titulo: 'Cerrado',
      descripcion: 'Pedidos completados',
      icon: CheckCircle2,
      color: 'bg-green-500/10 border-green-500/30',
      headerColor: 'bg-green-500',
      textColor: 'text-green-700 dark:text-green-400'
    }
  ];

  // Calcular métricas generales
  const calcularMetricas = () => {
    const totalPedidos = vistaEjecutiva.length;
    const bloqueados = agrupadosPorEstado['bloqueado']?.length || 0;
    const cerrados = agrupadosPorEstado['cerrado']?.length || 0;
    const enProceso = totalPedidos - bloqueados - cerrados;
    const valorTotal = vistaEjecutiva.reduce((sum, item) => sum + item.valorTotal, 0);
    
    return {
      totalPedidos,
      bloqueados,
      cerrados,
      enProceso,
      valorTotal,
      tasaCierre: totalPedidos > 0 ? ((cerrados / totalPedidos) * 100).toFixed(1) : '0'
    };
  };

  const metricas = calcularMetricas();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="rounded-lg p-2"
            style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)' }}
          >
            <LayoutGrid className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2>Vista Ejecutiva · Kanban</h2>
            <p className="text-xs text-muted-foreground">
              Panel estratégico para Gerente General · Estados consolidados
            </p>
          </div>
        </div>
      </div>

      {/* Métricas Ejecutivas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 border-2">
          <div className="flex items-center justify-between mb-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <TrendingUp className="h-3 w-3 text-green-600" />
          </div>
          <p className="text-2xl font-bold">{metricas.totalPedidos}</p>
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
          <p className="text-lg font-bold">
            ${(metricas.valorTotal / 1000000).toFixed(1)}M
          </p>
          <p className="text-xs text-muted-foreground">Valor Total</p>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {columnasKanban.map((columna) => {
          const items = agrupadosPorEstado[columna.id] || [];
          const Icon = columna.icon;
          
          return (
            <Card key={columna.id} className={`overflow-hidden border-2 ${columna.color}`}>
              {/* Header de columna */}
              <div className={`${columna.headerColor} px-4 py-3 text-white`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <h3 className="font-medium text-sm">{columna.titulo}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                    {items.length}
                  </Badge>
                </div>
                <p className="text-xs opacity-90">{columna.descripcion}</p>
              </div>

              {/* Items */}
              <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="py-8 text-center">
                    <Icon className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                    <p className="text-xs text-muted-foreground">No hay pedidos</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <Card 
                      key={item.id} 
                      className="p-3 hover:shadow-md transition-all cursor-pointer border"
                    >
                      {/* Cliente */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-medium line-clamp-1 flex-1">
                          {item.cliente}
                        </p>
                        <Badge variant="outline" className="text-[10px] flex-shrink-0">
                          {item.cantidad}
                        </Badge>
                      </div>

                      {/* Producto */}
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">
                        {item.producto}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(item.fechaEntrega).toLocaleDateString('es-CO', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-medium">
                          <DollarSign className="h-3 w-3" />
                          <span>
                            {(item.valorTotal / 1000000).toFixed(1)}M
                          </span>
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

      {/* Nota informativa */}
      <Card className="p-4 bg-muted/30 border-2">
        <div className="flex items-start gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium mb-1">Vista Ejecutiva Simplificada</p>
            <p className="text-[11px] text-muted-foreground">
              Esta vista consolida los estados operativos en categorías macro para facilitar la toma de decisiones estratégicas.
              No muestra el sistema de colores operativo del tablero detallado.
              Los estados se calculan automáticamente a partir de la lógica operativa.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
