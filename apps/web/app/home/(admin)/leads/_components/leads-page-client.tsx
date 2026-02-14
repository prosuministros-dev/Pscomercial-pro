'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@kit/ui/button';
import { PermissionGate } from '@kit/rbac/permission-gate';
import { LayoutGrid, LayoutList, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { LeadsKanban } from './leads-kanban';
import { LeadsTable } from './leads-table';
import { LeadsFilters } from './leads-filters';
import { LeadFormDialog } from './lead-form-dialog';
import type { Lead, LeadFilters } from '../_lib/types';

type ViewMode = 'kanban' | 'table';

export function LeadsPageClient() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<LeadFilters>({});

  const fetchLeads = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams();
        params.set('page', currentPage.toString());
        params.set('limit', '20');

        if (filters.status) params.set('status', filters.status);
        if (filters.search) params.set('search', filters.search);
        if (filters.channel) params.set('channel', filters.channel);
        if (filters.assigned_to) params.set('assigned_to', filters.assigned_to);

        const response = await fetch(`/api/leads?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Error al cargar los leads');
        }

        const data = await response.json();
        setLeads(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (error) {
        console.error('Error fetching leads:', error);
        toast.error('Error', {
          description: 'No se pudieron cargar los leads',
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentPage, filters]
  );

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleRefresh = () => {
    fetchLeads(true);
  };

  const handleFiltersChange = (newFilters: LeadFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Leads
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona y da seguimiento a tus leads comerciales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Button>
          <PermissionGate permission="leads:create">
            <LeadFormDialog onSuccess={handleRefresh} />
          </PermissionGate>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <LeadsFilters filters={filters} onFiltersChange={handleFiltersChange} />
      </motion.div>

      {/* View Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-end gap-2"
      >
        <Button
          variant={viewMode === 'kanban' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('kanban')}
          className={
            viewMode === 'kanban'
              ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
              : ''
          }
        >
          <LayoutGrid className="w-4 h-4 mr-2" />
          Kanban
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('table')}
          className={
            viewMode === 'table'
              ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
              : ''
          }
        >
          <LayoutList className="w-4 h-4 mr-2" />
          Tabla
        </Button>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {viewMode === 'kanban' ? (
          <LeadsKanban leads={leads} onRefresh={handleRefresh} />
        ) : (
          <LeadsTable
            leads={leads}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </motion.div>
    </div>
  );
}
