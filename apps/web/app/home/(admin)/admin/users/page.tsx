'use client';

import { useState } from 'react';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Label } from '@kit/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Badge } from '@kit/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCog, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  user_roles: Array<{
    role: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
}

interface Role {
  id: string;
  name: string;
  slug: string;
}

export default function UsersPage() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isAssignRoleDialogOpen, setIsAssignRoleDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  // Fetch users with their roles
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          email,
          full_name,
          is_active,
          last_login_at,
          created_at,
          user_roles (
            role:roles (
              id,
              name,
              slug
            )
          )
        `,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Fetch all available roles
  const { data: roles } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Role[];
    },
  });

  // Toggle user active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Estado del usuario actualizado');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar estado del usuario');
    },
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      roleId,
    }: {
      userId: string;
      roleId: string;
    }) => {
      // First check if the user already has this role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .single();

      if (existingRole) {
        throw new Error('El usuario ya tiene este rol asignado');
      }

      const { error } = await supabase.from('user_roles').insert([
        {
          user_id: userId,
          role_id: roleId,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setIsAssignRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRoleId('');
      toast.success('Rol asignado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al asignar rol');
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      roleId,
    }: {
      userId: string;
      roleId: string;
    }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Rol removido correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al remover rol');
    },
  });

  const handleAssignRole = (user: UserProfile) => {
    setSelectedUser(user);
    setIsAssignRoleDialogOpen(true);
  };

  const handleRemoveRole = (userId: string, roleId: string) => {
    if (confirm('¿Estás seguro de remover este rol del usuario?')) {
      removeRoleMutation.mutate({ userId, roleId });
    }
  };

  const handleSubmitAssignRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && selectedRoleId) {
      assignRoleMutation.mutate({
        userId: selectedUser.id,
        roleId: selectedRoleId,
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoadingUsers) {
    return <div className="py-8 text-center">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último Acceso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || 'N/A'}
                  </TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.user_roles && user.user_roles.length > 0 ? (
                        user.user_roles.map((ur, index) =>
                          ur.role ? (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="group relative"
                            >
                              <Shield className="mr-1 h-3 w-3" />
                              {ur.role.name}
                              <button
                                onClick={() =>
                                  handleRemoveRole(user.id, ur.role!.id)
                                }
                                className="ml-1 hidden rounded-full hover:bg-destructive hover:text-destructive-foreground group-hover:inline-flex"
                                title="Remover rol"
                              >
                                ×
                              </button>
                            </Badge>
                          ) : null,
                        )
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Sin roles asignados
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          userId: user.id,
                          isActive: user.is_active,
                        })
                      }
                    >
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </Button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.last_login_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAssignRole(user)}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      Asignar Rol
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={isAssignRoleDialogOpen}
        onOpenChange={(open) => {
          setIsAssignRoleDialogOpen(open);
          if (!open) {
            setSelectedUser(null);
            setSelectedRoleId('');
          }
        }}
      >
        <DialogContent>
          <form onSubmit={handleSubmitAssignRole}>
            <DialogHeader>
              <DialogTitle>Asignar Rol</DialogTitle>
              <DialogDescription>
                Asignar un rol a {selectedUser?.full_name || 'este usuario'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Seleccionar Rol</Label>
                <Select
                  value={selectedRoleId}
                  onValueChange={setSelectedRoleId}
                  required
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Elige un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles &&
                      roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name} ({role.slug})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAssignRoleDialogOpen(false);
                  setSelectedUser(null);
                  setSelectedRoleId('');
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={assignRoleMutation.isPending}>
                Asignar Rol
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
