'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { Button } from '@kit/ui/button';
import { PermissionGate } from '@kit/rbac/permission-gate';
import { ProductTable } from './product-table';
import { createProductColumns } from './product-table-columns';
import { ProductFormDialog } from './product-form-dialog';
import { ProductFilters } from './product-filters';
import { useProducts } from '../_lib/product-queries';
import type { Product, ProductFilters as ProductFiltersType } from '../_lib/types';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useQuery } from '@tanstack/react-query';

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

export function ProductsPageClient() {
  const supabase = useSupabase();
  const [filters, setFilters] = useState<ProductFiltersType>({
    page: 1,
    limit: 10,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const { data, isLoading, error } = useProducts(filters);

  // Fetch product categories
  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Array<{ id: string; name: string; slug: string }>;
    },
  });

  const handleFiltersChange = useCallback((newFilters: ProductFiltersType) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormMode('edit');
    setFormOpen(true);
  };

  const columns = createProductColumns({
    onEdit: handleEditProduct,
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
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Gestione el catálogo de productos de su organización
          </p>
        </div>
        <PermissionGate permission="products:create">
          <Button onClick={handleCreateProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </PermissionGate>
      </motion.div>

      <motion.div variants={itemVariants}>
        <ProductFilters
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
          categories={categories || []}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        {error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Error al cargar productos: {(error as Error).message}
            </p>
          </div>
        ) : (
          <ProductTable
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            pagination={data?.pagination}
            onPageChange={handlePageChange}
          />
        )}
      </motion.div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={selectedProduct}
        mode={formMode}
        categories={categories || []}
      />
    </motion.div>
  );
}
