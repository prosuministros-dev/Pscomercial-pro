'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@kit/ui/button';
import { PermissionGate } from '@kit/rbac/permission-gate';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@kit/ui/alert-dialog';
import { SupplierTable } from './supplier-table';
import { createSupplierColumns } from './supplier-table-columns';
import { SupplierFormDialog } from './supplier-form-dialog';
import { SupplierFilters } from './supplier-filters';
import { useSuppliers, useDeleteSupplier } from '../_lib/supplier-queries';
import type { Supplier, SupplierFilters as SupplierFiltersType } from '../_lib/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function SuppliersPageClient() {
  const [filters, setFilters] = useState<SupplierFiltersType>({
    page: 1,
    limit: 10,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const { data, isLoading, error } = useSuppliers(filters);
  const deleteMutation = useDeleteSupplier();

  const handleFiltersChange = useCallback((newFilters: SupplierFiltersType) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await deleteMutation.mutateAsync(supplierToDelete.id);
    } catch {
      // Error handled in mutation
    } finally {
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  const columns = createSupplierColumns({
    onEdit: handleEditSupplier,
    onDelete: handleDeleteSupplier,
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            Gestione los proveedores de su organización
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGate permission="purchase_orders:create">
            <Button onClick={handleCreateSupplier}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </PermissionGate>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SupplierFilters
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        {error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Error al cargar proveedores: {(error as Error).message}
            </p>
          </div>
        ) : (
          <SupplierTable
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            pagination={data?.pagination}
            onPageChange={handlePageChange}
          />
        )}
      </motion.div>

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={selectedSupplier}
        mode={formMode}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar proveedor</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de eliminar al proveedor &quot;{supplierToDelete?.name}&quot;?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
