'use client';

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Search, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { useCartera } from '../_lib/finance-queries';
import { CustomerCreditDialog } from './customer-credit-dialog';
import type { CustomerCartera } from '../_lib/types';

export function CarteraTab() {
  const { data: customers = [], isLoading } = useCartera();
  const [search, setSearch] = useState('');
  const [showBlockedOnly, setShowBlockedOnly] = useState(false);
  const [dialogCustomer, setDialogCustomer] = useState<CustomerCartera | null>(null);
  const [dialogMode, setDialogMode] = useState<'block' | 'unblock'>('block');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (showBlockedOnly) {
      result = result.filter((c) => c.is_blocked);
    }

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.business_name.toLowerCase().includes(term) ||
          c.nit.toLowerCase().includes(term),
      );
    }

    return result;
  }, [customers, search, showBlockedOnly]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(n);

  const handleBlock = (customer: CustomerCartera) => {
    setDialogCustomer(customer);
    setDialogMode('block');
    setDialogOpen(true);
  };

  const handleUnblock = (customer: CustomerCartera) => {
    setDialogCustomer(customer);
    setDialogMode('unblock');
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o NIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showBlockedOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowBlockedOnly(!showBlockedOnly)}
          className="gap-1.5"
        >
          <ShieldAlert className="w-4 h-4" />
          {showBlockedOnly ? 'Ver todos' : 'Solo bloqueados'}
        </Button>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead className="text-right">Cupo Total</TableHead>
              <TableHead className="text-right">En Uso</TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Asesor</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  {search || showBlockedOnly
                    ? 'No se encontraron clientes con los filtros aplicados.'
                    : 'No hay clientes activos.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => {
                const usagePct = customer.credit_limit > 0
                  ? ((customer.credit_used / customer.credit_limit) * 100)
                  : 0;

                return (
                  <TableRow
                    key={customer.id}
                    className={customer.is_blocked ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                  >
                    <TableCell className="font-medium">
                      {customer.business_name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {customer.nit}
                    </TableCell>
                    <TableCell className="text-sm">
                      {customer.city || '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {fmt(customer.credit_limit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      <span className={usagePct > 80 ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                        {fmt(customer.credit_used)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {fmt(customer.credit_available)}
                    </TableCell>
                    <TableCell>
                      {customer.is_blocked ? (
                        <Badge variant="destructive" className="gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          Bloqueado
                        </Badge>
                      ) : (
                        <Badge variant="default" className="gap-1 bg-emerald-500">
                          <ShieldCheck className="w-3 h-3" />
                          Activo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {customer.assigned_sales_rep?.full_name || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.is_blocked ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnblock(customer)}
                          className="gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Desbloquear
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBlock(customer)}
                          className="gap-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Bloquear
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>

      <CustomerCreditDialog
        customer={dialogCustomer}
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
