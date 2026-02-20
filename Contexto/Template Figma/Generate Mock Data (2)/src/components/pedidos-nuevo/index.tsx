import { useState } from 'react';
import { Package, Plus, ListChecks, LayoutGrid } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { PanelPrincipal } from './panel-principal';
import { CrearPedido } from './crear-pedido';
import { DetallePedido } from './detalle-pedido';
import { EditarPedido } from './editar-pedido';
import { VistaPendientes } from './vista-pendientes';
import { TableroOperativoIndex } from '../tablero-operativo';
import { useTheme } from '../theme-provider';

export function PedidosNuevo() {
  const { gradients } = useTheme();
  const [vista, setVista] = useState<'panel' | 'pendientes' | 'tablero'>('panel');
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<string | null>(null);

  const handleCrearPedido = (data: any) => {
    console.log('Pedido creado:', data);
    setModalCrear(false);
    // Aquí iría la lógica para guardar el pedido
  };

  const handleVerDetalle = (pedidoId: string) => {
    setPedidoSeleccionado(pedidoId);
    setModalDetalle(true);
  };

  const handleEditarPedido = (pedidoId: string) => {
    setPedidoSeleccionado(pedidoId);
    setModalEditar(true);
  };

  const handleGuardarEdicion = (data: any) => {
    console.log('Pedido editado:', data);
    setModalEditar(false);
    // Aquí iría la lógica para actualizar el pedido
  };

  return (
    <div className="space-y-4">
      {/* Header con selector de vista */}
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
            <p className="text-xs text-muted-foreground">
              Sistema Make to Order - Control operativo
            </p>
          </div>
        </div>
      </div>

      {/* Tabs de Vista */}
      <Tabs value={vista} onValueChange={(v) => setVista(v as 'panel' | 'pendientes' | 'tablero')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="panel" className="gap-1 md:gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Panel Principal</span>
            <span className="sm:hidden text-xs">Panel</span>
          </TabsTrigger>
          <TabsTrigger value="pendientes" className="gap-1 md:gap-2">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">Control de Pendientes</span>
            <span className="sm:hidden text-xs">Pendientes</span>
          </TabsTrigger>
          <TabsTrigger value="tablero" className="gap-1 md:gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Tablero Operativo</span>
            <span className="sm:hidden text-xs">Tablero</span>
          </TabsTrigger>
        </TabsList>

        {/* Panel Principal */}
        <TabsContent value="panel" className="space-y-4">
          <PanelPrincipal 
            onVerDetalle={handleVerDetalle}
            onCrearPedido={() => setModalCrear(true)}
            onEditarPedido={handleEditarPedido}
          />
        </TabsContent>

        {/* Vista de Pendientes */}
        <TabsContent value="pendientes" className="space-y-4">
          <VistaPendientes 
            onVerDetalle={handleVerDetalle}
            onEditarPedido={handleEditarPedido}
          />
        </TabsContent>

        {/* Tablero Operativo */}
        <TabsContent value="tablero" className="space-y-4">
          <TableroOperativoIndex />
        </TabsContent>
      </Tabs>

      {/* Modal: Crear Pedido */}
      <Dialog open={modalCrear} onOpenChange={setModalCrear}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Pedido</DialogTitle>
            <DialogDescription>
              Crear pedido desde cotización aprobada
            </DialogDescription>
          </DialogHeader>
          <CrearPedido 
            onCerrar={() => setModalCrear(false)}
            onCrear={handleCrearPedido}
          />
        </DialogContent>
      </Dialog>

      {/* Modal: Detalle del Pedido */}
      <Dialog open={modalDetalle} onOpenChange={setModalDetalle}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
            <DialogTitle>Detalle del Pedido</DialogTitle>
            <DialogDescription>
              Información completa y trazabilidad (solo lectura)
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {pedidoSeleccionado && (
              <DetallePedido pedidoId={pedidoSeleccionado} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Pedido */}
      <Dialog open={modalEditar} onOpenChange={setModalEditar}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
            <DialogTitle>Editar Pedido</DialogTitle>
            <DialogDescription>
              Modificar estados, información operativa y logística
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {pedidoSeleccionado && (
              <EditarPedido
                pedidoId={pedidoSeleccionado}
                onCerrar={() => setModalEditar(false)}
                onGuardar={handleGuardarEdicion}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}