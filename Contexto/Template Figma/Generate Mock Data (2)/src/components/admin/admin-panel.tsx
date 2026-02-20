import { motion } from 'motion/react';
import { Palette, Moon, Sun, Zap, Sparkles, Shield } from 'lucide-react';
import { Card } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTheme } from '../theme-provider';
import { configApp } from '../../lib/mock-data';
import { RolesPermisos } from './roles-permisos';

export function AdminPanel() {
  const { theme, gradients, toggleTheme, toggleGradients } = useTheme();

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="rounded-lg p-2"
            style={{ background: gradients ? 'var(--grad-accent)' : 'var(--color-primary)' }}
          >
            <Palette className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2>Administración</h2>
            <p className="text-xs text-muted-foreground">Configuración del sistema</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="apariencia" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="apariencia" className="text-xs">
            <Palette className="h-3 w-3 mr-1.5" />
            Apariencia
          </TabsTrigger>
          <TabsTrigger value="roles" className="text-xs">
            <Shield className="h-3 w-3 mr-1.5" />
            Roles y Permisos
          </TabsTrigger>
        </TabsList>

        {/* APARIENCIA */}
        <TabsContent value="apariencia" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Theme Settings */}
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <h4>Apariencia</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Personaliza el aspecto de la aplicación
                  </p>
                </div>

                <Separator />

                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {theme === 'light' ? (
                      <Sun className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Moon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <Label htmlFor="dark-mode" className="text-sm">Modo Oscuro</Label>
                      <p className="text-xs text-muted-foreground">
                        {theme === 'light' ? 'Cambiar a tema oscuro' : 'Actualmente en modo oscuro'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                </div>

                <Separator />

                {/* Gradients Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="gradients" className="text-sm">Gradientes</Label>
                        <Badge variant="secondary" className="text-xs h-4">
                          Marca
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {gradients ? 'Gradientes de marca activados' : 'Usar colores sólidos'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="gradients"
                    checked={gradients}
                    onCheckedChange={toggleGradients}
                  />
                </div>

                {/* Gradient Preview */}
                {gradients && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-2"
                  >
                    <p className="text-xs text-muted-foreground">Estilos de Gradiente</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="h-12 rounded-lg bg-gradient-brand" />
                        <p className="text-xs text-muted-foreground text-center">Marca</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-12 rounded-lg bg-gradient-hero" />
                        <p className="text-xs text-muted-foreground text-center">Hero</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-12 rounded-lg bg-gradient-accent" />
                        <p className="text-xs text-muted-foreground text-center">Acento</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-12 rounded-lg bg-gradient-soft border border-border" />
                        <p className="text-xs text-muted-foreground text-center">Suave</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>

            {/* Brand Colors */}
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <h4>Colores de Marca</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Paleta oficial de colores
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg border border-border flex-shrink-0" style={{ backgroundColor: '#00C8CF' }} />
                    <div>
                      <p className="font-mono text-sm">#00C8CF</p>
                      <p className="text-xs text-muted-foreground">Cyan Primario</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg border border-border flex-shrink-0" style={{ backgroundColor: '#161052' }} />
                    <div>
                      <p className="font-mono text-sm">#161052</p>
                      <p className="text-xs text-muted-foreground">Navy Acento</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg border border-border flex-shrink-0" style={{ backgroundColor: '#00E5ED' }} />
                    <div>
                      <p className="font-mono text-sm">#00E5ED</p>
                      <p className="text-xs text-muted-foreground">Cyan Claro</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* System Info */}
            <Card className="p-4 lg:col-span-2">
              <div className="space-y-4">
                <div>
                  <h4>Información del Sistema</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configuración actual de la aplicación
                  </p>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Nombre de la Aplicación</p>
                    <p className="text-sm font-medium">{configApp.nombre}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Versión</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{configApp.version}</p>
                      <Badge variant="outline" className="gap-1 text-xs h-5">
                        <Zap className="h-3 w-3" />
                        Última
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Email de Soporte</p>
                    <p className="text-sm font-medium">{configApp.emailSoporte}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Eslogan</p>
                  <p className="text-sm">{configApp.tagline}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Descripción</p>
                  <p className="text-sm">{configApp.descripcion}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ROLES Y PERMISOS */}
        <TabsContent value="roles" className="mt-4">
          <RolesPermisos />
        </TabsContent>
      </Tabs>
    </div>
  );
}