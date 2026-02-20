import { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Users, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { useTheme } from '../theme-provider';
import {
  roles as rolesData,
  permisos as permisosData,
  usuarios as usuariosData,
  bitacoraAdministrativa,
  usuarioActual,
  type Rol,
  type Permiso,
  type Usuario,
} from '../../lib/mock-data';

export function RolesPermisos() {
  const { gradients } = useTheme();
  const [roles, setRoles] = useState<Rol[]>(rolesData);
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosData);
  const [modalRol, setModalRol] = useState(false);
  const [modalUsuario, setModalUsuario] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState<Rol | null>(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);

  const [formRol, setFormRol] = useState({
    nombre: '',
    descripcion: '',
    estado: 'activo' as 'activo' | 'inactivo',
    permisos: [] as string[],
  });

  const [formUsuario, setFormUsuario] = useState({
    nombre: '',
    email: '',
    area: '',
    roles: [] as string[],
    estado: 'activo' as 'activo' | 'inactivo',
  });

  // Agrupar permisos por módulo
  const permisosPorModulo = permisosData.reduce((acc, permiso) => {
    if (!acc[permiso.modulo]) {
      acc[permiso.modulo] = [];
    }
    acc[permiso.modulo].push(permiso);
    return acc;
  }, {} as Record<string, Permiso[]>);

  const handleCrearRol = () => {
    setRolSeleccionado(null);
    setFormRol({
      nombre: '',
      descripcion: '',
      estado: 'activo',
      permisos: [],
    });
    setModalRol(true);
  };

  const handleEditarRol = (rol: Rol) => {
    setRolSeleccionado(rol);
    setFormRol({
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      estado: rol.estado,
      permisos: rol.permisos,
    });
    setModalRol(true);
  };

  const handleGuardarRol = () => {
    if (!formRol.nombre.trim()) {
      toast.error('El nombre del rol es obligatorio');
      return;
    }

    if (rolSeleccionado) {
      // Editar
      setRoles(roles.map(r =>
        r.id === rolSeleccionado.id
          ? {
              ...r,
              ...formRol,
              modificadoPor: usuarioActual.nombre,
              modificadoEn: new Date().toISOString(),
            }
          : r
      ));
      toast.success('Rol actualizado exitosamente');
    } else {
      // Crear
      const nuevoRol: Rol = {
        id: `rol-${Date.now()}`,
        ...formRol,
        creadoPor: usuarioActual.nombre,
        creadoEn: new Date().toISOString(),
      };
      setRoles([...roles, nuevoRol]);
      toast.success('Rol creado exitosamente');
    }

    setModalRol(false);
  };

  const handleEliminarRol = (rol: Rol) => {
    if (confirm(`¿Estás seguro de eliminar el rol "${rol.nombre}"?`)) {
      setRoles(roles.filter(r => r.id !== rol.id));
      toast.success('Rol eliminado exitosamente');
    }
  };

  const handleCrearUsuario = () => {
    setUsuarioSeleccionado(null);
    setFormUsuario({
      nombre: '',
      email: '',
      area: '',
      roles: [],
      estado: 'activo',
    });
    setModalUsuario(true);
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormUsuario({
      nombre: usuario.nombre,
      email: usuario.email,
      area: usuario.area,
      roles: usuario.roles,
      estado: usuario.estado,
    });
    setModalUsuario(true);
  };

  const handleGuardarUsuario = () => {
    if (!formUsuario.nombre.trim() || !formUsuario.email.trim()) {
      toast.error('Nombre y email son obligatorios');
      return;
    }

    if (usuarioSeleccionado) {
      // Editar
      setUsuarios(usuarios.map(u =>
        u.id === usuarioSeleccionado.id
          ? {
              ...u,
              ...formUsuario,
            }
          : u
      ));
      toast.success('Usuario actualizado exitosamente');
    } else {
      // Crear
      const nuevoUsuario: Usuario = {
        id: `usr-${Date.now()}`,
        ...formUsuario,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formUsuario.nombre}`,
        creadoPor: usuarioActual.nombre,
        creadoEn: new Date().toISOString(),
      };
      setUsuarios([...usuarios, nuevoUsuario]);
      toast.success('Usuario creado exitosamente');
    }

    setModalUsuario(false);
  };

  const togglePermiso = (permisoId: string) => {
    setFormRol(prev => ({
      ...prev,
      permisos: prev.permisos.includes(permisoId)
        ? prev.permisos.filter(p => p !== permisoId)
        : [...prev.permisos, permisoId]
    }));
  };

  const toggleRolUsuario = (rolId: string) => {
    setFormUsuario(prev => ({
      ...prev,
      roles: prev.roles.includes(rolId)
        ? prev.roles.filter(r => r !== rolId)
        : [...prev.roles, rolId]
    }));
  };

  const getRolNombre = (rolId: string) => {
    return roles.find(r => r.id === rolId)?.nombre || 'Desconocido';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="rounded-lg p-2"
            style={{ background: gradients ? 'var(--grad-accent)' : 'var(--color-primary)' }}
          >
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2>Roles y Permisos</h2>
            <p className="text-xs text-muted-foreground">Gestión de seguridad y accesos</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="roles" className="text-xs">Roles</TabsTrigger>
          <TabsTrigger value="usuarios" className="text-xs">Usuarios</TabsTrigger>
          <TabsTrigger value="bitacora" className="text-xs">Bitácora</TabsTrigger>
        </TabsList>

        {/* ROLES */}
        <TabsContent value="roles" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{roles.length} roles configurados</p>
            <Button
              size="sm"
              onClick={handleCrearRol}
              style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Rol
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {roles.map((rol) => (
              <Card key={rol.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4>{rol.nombre}</h4>
                      <Badge variant={rol.estado === 'activo' ? 'default' : 'secondary'} className="text-xs h-5">
                        {rol.estado}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{rol.descripcion}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Lock className="h-3 w-3" />
                  <span>{rol.permisos.length} permisos</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-7"
                    onClick={() => handleEditarRol(rol)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 text-red-600 hover:text-red-600"
                    onClick={() => handleEliminarRol(rol)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* USUARIOS */}
        <TabsContent value="usuarios" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{usuarios.length} usuarios registrados</p>
            <Button
              size="sm"
              onClick={handleCrearUsuario}
              style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id} className="text-sm">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={usuario.avatar}
                          alt={usuario.nombre}
                          className="h-8 w-8 rounded-full"
                        />
                        <span className="font-medium">{usuario.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{usuario.email}</TableCell>
                    <TableCell className="text-xs">{usuario.area}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {usuario.roles.map((rolId) => (
                          <Badge key={rolId} variant="outline" className="text-xs">
                            {getRolNombre(rolId)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={usuario.estado === 'activo' ? 'default' : 'secondary'} className="text-xs">
                        {usuario.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleEditarUsuario(usuario)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* BITÁCORA */}
        <TabsContent value="bitacora" className="space-y-4 mt-4">
          <Card className="p-4">
            <h4 className="mb-4">Historial de Cambios</h4>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {bitacoraAdministrativa.map((evento) => (
                  <div key={evento.id} className="border-l-2 border-primary pl-4 pb-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{evento.accion}</p>
                        <p className="text-xs text-muted-foreground">{evento.descripcion}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Por: {evento.usuario}</span>
                          <span>•</span>
                          <span>
                            {new Date(evento.creadoEn).toLocaleString('es-CO', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Rol */}
      <Dialog open={modalRol} onOpenChange={setModalRol}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{rolSeleccionado ? 'Editar Rol' : 'Crear Rol'}</DialogTitle>
            <DialogDescription>
              Configura los permisos y accesos del rol
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <div>
                <Label>Nombre del Rol *</Label>
                <Input
                  value={formRol.nombre}
                  onChange={(e) => setFormRol({ ...formRol, nombre: e.target.value })}
                  placeholder="Ej: Gerente Comercial"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formRol.descripcion}
                  onChange={(e) => setFormRol({ ...formRol, descripcion: e.target.value })}
                  placeholder="Describe las responsabilidades de este rol"
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formRol.estado === 'activo'}
                  onCheckedChange={(checked) =>
                    setFormRol({ ...formRol, estado: checked ? 'activo' : 'inactivo' })
                  }
                />
                <Label>Rol Activo</Label>
              </div>

              <div>
                <Label className="mb-3 block">Permisos ({formRol.permisos.length} seleccionados)</Label>
                <div className="space-y-4">
                  {Object.entries(permisosPorModulo).map(([modulo, permisos]) => (
                    <Card key={modulo} className="p-3">
                      <h4 className="mb-3 capitalize">{modulo}</h4>
                      <div className="grid gap-2 md:grid-cols-2">
                        {permisos.map((permiso) => (
                          <div key={permiso.id} className="flex items-start gap-2">
                            <Checkbox
                              checked={formRol.permisos.includes(permiso.id)}
                              onCheckedChange={() => togglePermiso(permiso.id)}
                            />
                            <div className="flex-1">
                              <p className="text-sm capitalize">{permiso.accion}</p>
                              <p className="text-xs text-muted-foreground">{permiso.descripcion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setModalRol(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarRol}
              className="flex-1"
              style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
            >
              {rolSeleccionado ? 'Actualizar' : 'Crear'} Rol
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Usuario */}
      <Dialog open={modalUsuario} onOpenChange={setModalUsuario}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{usuarioSeleccionado ? 'Editar Usuario' : 'Crear Usuario'}</DialogTitle>
            <DialogDescription>
              Configura la información y roles del usuario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nombre Completo *</Label>
              <Input
                value={formUsuario.nombre}
                onChange={(e) => setFormUsuario({ ...formUsuario, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formUsuario.email}
                onChange={(e) => setFormUsuario({ ...formUsuario, email: e.target.value })}
                placeholder="juan@prosuministros.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Área</Label>
              <Input
                value={formUsuario.area}
                onChange={(e) => setFormUsuario({ ...formUsuario, area: e.target.value })}
                placeholder="Ej: Ventas"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="mb-3 block">Roles Asignados</Label>
              <div className="space-y-2">
                {roles.filter(r => r.estado === 'activo').map((rol) => (
                  <div key={rol.id} className="flex items-start gap-2">
                    <Checkbox
                      checked={formUsuario.roles.includes(rol.id)}
                      onCheckedChange={() => toggleRolUsuario(rol.id)}
                    />
                    <div className="flex-1">
                      <p className="text-sm">{rol.nombre}</p>
                      <p className="text-xs text-muted-foreground">{rol.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formUsuario.estado === 'activo'}
                onCheckedChange={(checked) =>
                  setFormUsuario({ ...formUsuario, estado: checked ? 'activo' : 'inactivo' })
                }
              />
              <Label>Usuario Activo</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalUsuario(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarUsuario}
              className="flex-1"
              style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
            >
              {usuarioSeleccionado ? 'Actualizar' : 'Crear'} Usuario
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
