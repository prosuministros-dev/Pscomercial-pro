import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Info
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { useTheme } from '../theme-provider';
import {
  metricasDashboard,
  leads,
  cotizaciones,
  pedidos,
  notificaciones,
} from '../../lib/mock-data';

export function Dashboard() {
  const { gradients } = useTheme();

  const leadsConAlerta = leads.filter(l => l.alerta24h);
  const cotizacionesMargenBajo = cotizaciones.filter(c => c.aprobacionGerenciaRequerida);
  const pedidosEnProceso = pedidos.filter(p => p.estado === 'en_proceso');
  const notificacionesPendientes = notificaciones.filter(n => !n.leida);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Hero - Compacto */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl p-4 md:p-6 lg:p-8"
        style={{
          background: gradients ? 'var(--grad-brand)' : 'var(--color-accent)',
        }}
      >
        <h2 className="text-white mb-1 text-lg md:text-xl lg:text-2xl">Sistema Make to Order</h2>
        <p className="text-white/80 text-xs md:text-sm">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </motion.div>

      {/* Alertas - Compacto */}
      {(leadsConAlerta.length > 0 || cotizacionesMargenBajo.length > 0 || notificacionesPendientes.length > 0) && (
        <div className="grid gap-2 md:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {leadsConAlerta.length > 0 && (
            <Card className="p-3 border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    <span className="font-medium">{leadsConAlerta.length}</span> Lead{leadsConAlerta.length > 1 ? 's' : ''} +24h
                  </p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </Card>
          )}

          {cotizacionesMargenBajo.length > 0 && (
            <Card className="p-3 border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    <span className="font-medium">{cotizacionesMargenBajo.length}</span> Margen bajo
                  </p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </Card>
          )}

          {notificacionesPendientes.length > 0 && (
            <Card className="p-3 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2">
                <span className="text-base">🔔</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    <span className="font-medium">{notificacionesPendientes.length}</span> Sin leer
                  </p>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Métricas - Grid compacto */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {metricasDashboard.map((metrica, index) => (
          <motion.div
            key={metrica.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-muted-foreground">{metrica.label}</p>
                {metrica.cambio !== 0 && (
                  <div
                    className={`rounded-full p-1 ${
                      metrica.tendencia === 'up'
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {metrica.tendencia === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                  </div>
                )}
              </div>
              <h3 className="mb-1">{metrica.valor}</h3>
              {metrica.cambio !== 0 && (
                <p className={`text-xs ${
                  metrica.cambio > 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {metrica.cambio > 0 ? '+' : ''}{metrica.cambio}% vs mes
                </p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Actividad Reciente - Compacto */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Leads Recientes */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4>Leads Recientes</h4>
            <Badge variant="outline" className="text-xs">{leads.length}</Badge>
          </div>
          <div className="space-y-2">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
                <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                  lead.estado === 'pendiente' 
                    ? 'bg-yellow-500' 
                    : lead.estado === 'convertido' 
                    ? 'bg-green-500' 
                    : 'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    <span className="font-mono text-xs">#{lead.numero}</span> · {lead.nombreCliente}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                </div>
                {lead.alerta24h && (
                  <Badge variant="destructive" className="text-[10px] h-5 px-1.5">24h</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Pedidos en Proceso */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4>Pedidos Activos</h4>
            <Badge variant="outline" className="text-xs">{pedidosEnProceso.length}</Badge>
          </div>
          <div className="space-y-2">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="flex items-center gap-2 p-2 rounded hover:bg-secondary/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    <span className="font-mono text-xs">#{pedido.numero}</span> · {pedido.razonSocial}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-muted-foreground">
                      ${(pedido.subtotal / 1000000).toFixed(1)}M
                    </p>
                    <div className="flex items-center gap-1">
                      {pedido.pagoConfirmado ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <Clock className="h-3 w-3 text-yellow-600" />
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant={pedido.estado === 'completado' ? 'default' : 'secondary'} className="text-[10px] h-5 px-1.5">
                  {pedido.estado}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}