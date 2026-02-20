import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText,
  ShoppingCart,
  Megaphone,
  Moon,
  Sun,
  Bell,
  MessageCircle,
  DollarSign,
  Files
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useTheme } from '../theme-provider';
import { usuarioActual, notificaciones } from '../../lib/mock-data';
import { NotificacionesPanel } from './notificaciones-panel';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { theme, toggleTheme } = useTheme();
  const [panelNotificaciones, setPanelNotificaciones] = useState(false);
  
  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Megaphone },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
    { id: 'financiero', label: 'Financiero', icon: DollarSign },
    { id: 'formatos', label: 'Formatos', icon: Files },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'admin', label: 'Admin', icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo - Compacto */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-brand flex-shrink-0" />
              <span className="text-sm tracking-tight hidden sm:inline">Prosuministros</span>
            </div>

            {/* Navigation Links - Compacto - Solo desktop */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm
                      ${currentView === item.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions - Compacto */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPanelNotificaciones(true)}
              className="relative h-8 w-8 rounded-md hover:bg-secondary flex items-center justify-center transition-all"
            >
              {notificacionesNoLeidas > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] animate-pulse"
                >
                  {notificacionesNoLeidas}
                </Badge>
              )}
              <Bell className="h-4 w-4" />
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0 rounded-md"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Avatar className="h-7 w-7">
                <AvatarImage src={usuarioActual.avatar} alt={usuarioActual.nombre} />
                <AvatarFallback className="text-xs">{usuarioActual.nombre.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <p className="text-xs leading-none">{usuarioActual.nombre}</p>
                <p className="text-[10px] text-muted-foreground">{usuarioActual.rol}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Ultra compacto para maximizar espacio de contenido */}
      <div className="md:hidden border-t border-border bg-background">
        <div className="container mx-auto px-1.5">
          <div className="flex items-center justify-around py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`
                    flex flex-col items-center gap-0.5 px-1 py-0.5 rounded-md transition-all min-w-[48px]
                    ${currentView === item.id 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[8px] leading-none">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel de Notificaciones */}
      <NotificacionesPanel
        open={panelNotificaciones}
        onOpenChange={setPanelNotificaciones}
        onNotificacionClick={(notificacion) => {
          // Redirigir según el tipo de vínculo
          if (notificacion.vinculo) {
            switch (notificacion.vinculo.tipo) {
              case 'pedido':
                onViewChange('pedidos');
                break;
              case 'cotizacion':
                onViewChange('cotizaciones');
                break;
              case 'lead':
                onViewChange('leads');
                break;
            }
          }
        }}
      />
    </nav>
  );
}