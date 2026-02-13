'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { Button } from '@kit/ui/button';
import { CustomerTable } from './customer-table';
import { createCustomerColumns } from './customer-table-columns';
import { CustomerFormDialog } from './customer-form-dialog';
import { CustomerContactsDialog } from './customer-contacts-dialog';
import { CustomerFilters } from './customer-filters';
import { useCustomers } from '../_lib/customer-queries';
import type { Customer, CustomerFilters as CustomerFiltersType } from '../_lib/types';

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

export function CustomersPageClient() {
  const [filters, setFilters] = useState<CustomerFiltersType>({
    page: 1,
    limit: 10,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const { data, isLoading, error } = useCustomers(filters);

  const handleFiltersChange = useCallback((newFilters: CustomerFiltersType) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleViewContacts = (customer: Customer) => {
    setSelectedCustomer(customer);
    setContactsOpen(true);
  };

  const columns = createCustomerColumns({
    onEdit: handleEditCustomer,
    onViewContacts: handleViewContacts,
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
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestione los clientes de su organización
          </p>
        </div>
        <Button onClick={handleCreateCustomer}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <CustomerFilters
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        {error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Error al cargar clientes: {(error as Error).message}
            </p>
          </div>
        ) : (
          <CustomerTable
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            pagination={data?.pagination}
            onPageChange={handlePageChange}
          />
        )}
      </motion.div>

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={selectedCustomer}
        mode={formMode}
      />

      <CustomerContactsDialog
        open={contactsOpen}
        onOpenChange={setContactsOpen}
        customer={selectedCustomer}
      />
    </motion.div>
  );
}
