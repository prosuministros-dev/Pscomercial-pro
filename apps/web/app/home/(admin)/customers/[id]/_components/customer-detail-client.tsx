'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, Building2, FileText, ShoppingCart, MapPin, BarChart3, Loader2 } from 'lucide-react';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';

import { useCustomers } from '../../_lib/customer-queries';
import type { Customer } from '../../_lib/types';

import { CustomerInfoTab } from './customer-info-tab';
import { CustomerQuotesTab } from './customer-quotes-tab';
import { CustomerOrdersTab } from './customer-orders-tab';
import { CustomerVisitsTab } from './customer-visits-tab';
import { CustomerSummaryTab } from './customer-summary-tab';

interface CustomerDetailClientProps {
  customerId: string;
}

export function CustomerDetailClient({ customerId }: CustomerDetailClientProps) {
  const [activeTab, setActiveTab] = useState('info');

  // Load customer data from the list (will be filtered by RLS)
  const { data, isLoading, error } = useCustomers({ limit: 1000 });

  const customer = data?.data?.find((c: Customer) => c.id === customerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Button variant="ghost" asChild>
          <Link href="/home/customers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a clientes
          </Link>
        </Button>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <Building2 className="h-12 w-12 mx-auto text-destructive/50 mb-3" />
          <p className="text-sm text-destructive">
            {error ? (error as Error).message : 'Cliente no encontrado'}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/home/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-medium tracking-tight">{customer.business_name}</h1>
              <Badge
                variant={customer.status === 'active' ? 'default' : 'secondary'}
                className={customer.status === 'active' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : ''}
              >
                {customer.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              NIT: {customer.nit}
              {customer.city && ` · ${customer.city}`}
              {customer.department && `, ${customer.department}`}
            </p>
          </div>
        </div>

        {customer.assigned_advisor && (
          <div className="text-sm text-muted-foreground">
            Asesor: <span className="font-medium text-foreground">{customer.assigned_advisor.full_name}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="info" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Información</span>
          </TabsTrigger>
          <TabsTrigger value="quotes" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Cotizaciones</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Pedidos</span>
          </TabsTrigger>
          <TabsTrigger value="visits" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Visitas</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <CustomerInfoTab customer={customer} />
        </TabsContent>

        <TabsContent value="quotes">
          <CustomerQuotesTab customerId={customerId} />
        </TabsContent>

        <TabsContent value="orders">
          <CustomerOrdersTab customerId={customerId} />
        </TabsContent>

        <TabsContent value="visits">
          <CustomerVisitsTab customerId={customerId} />
        </TabsContent>

        <TabsContent value="summary">
          <CustomerSummaryTab customerId={customerId} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
