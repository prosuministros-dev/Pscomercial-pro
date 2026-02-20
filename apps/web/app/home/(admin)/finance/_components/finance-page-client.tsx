'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Wallet, ShieldAlert } from 'lucide-react';
import { FinanceSummaryCards } from './finance-summary-cards';
import { CarteraTab } from './cartera-tab';

type FinanceTab = 'cartera';

export function FinancePageClient() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('cartera');

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financiero
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestión de cartera, crédito y verificación de pagos
          </p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <FinanceSummaryCards />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FinanceTab)}>
        <TabsList>
          <TabsTrigger value="cartera" className="gap-1.5">
            <Wallet className="w-4 h-4" />
            Cartera
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cartera" className="mt-4">
          <CarteraTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
