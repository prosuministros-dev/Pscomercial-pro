'use client';

import { DollarSign, FileText, ShoppingCart, TrendingUp, UserPlus } from 'lucide-react';

import { StatCard } from '~/components/shared/stat-card';

export function DashboardDemoEnhanced() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value="1,234"
          icon={UserPlus}
          trend={{ value: 12.5, isPositive: true }}
          description="vs last month"
          delay={0}
        />
        <StatCard
          title="Cotizaciones"
          value="856"
          icon={FileText}
          trend={{ value: 8.2, isPositive: true }}
          description="vs last month"
          delay={0.1}
        />
        <StatCard
          title="Pedidos"
          value="432"
          icon={ShoppingCart}
          trend={{ value: 15.3, isPositive: true }}
          description="vs last month"
          delay={0.2}
        />
        <StatCard
          title="Revenue"
          value="$125,430"
          icon={DollarSign}
          trend={{ value: 23.1, isPositive: true }}
          description="vs last month"
          delay={0.3}
        />
      </div>

      {/* Conversion Funnel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard
          title="Lead Conversion"
          value="34.2%"
          icon={TrendingUp}
          description="Leads to quotes"
          delay={0.4}
        />
        <StatCard
          title="Quote Acceptance"
          value="42.8%"
          icon={TrendingUp}
          description="Quotes to orders"
          delay={0.5}
        />
        <StatCard
          title="Payment Rate"
          value="89.3%"
          icon={TrendingUp}
          description="Orders paid on time"
          delay={0.6}
        />
      </div>
    </div>
  );
}
