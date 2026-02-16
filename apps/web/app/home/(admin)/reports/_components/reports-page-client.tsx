'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@kit/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Badge } from '@kit/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Loader2, Download, Save, BookmarkPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useReportData, useSaveReport } from '../_lib/report-queries';
import type { ReportType } from '../_lib/types';
import { REPORT_TYPE_CONFIG } from '../_lib/types';
import { ReportFilters } from './report-filters';
import { ReportChart } from './report-chart';
import { SavedReportsPanel } from './saved-reports-panel';

const REPORT_TYPES: ReportType[] = ['leads', 'quotes', 'orders', 'revenue', 'performance'];

export function ReportsPageClient() {
  const [activeType, setActiveType] = useState<ReportType>('leads');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const config = REPORT_TYPE_CONFIG[activeType];
  const { data, isLoading } = useReportData(activeType, filters);
  const saveReport = useSaveReport();

  const handleExport = () => {
    const params = new URLSearchParams({ type: activeType, ...filters });
    window.open(`/api/reports/export?${params}`, '_blank');
  };

  const handleSave = async () => {
    if (!saveName.trim()) return;
    try {
      await saveReport.mutateAsync({
        name: saveName.trim(),
        report_type: activeType,
        filters,
      });
      toast.success('Reporte guardado');
      setSaveName('');
      setShowSaveInput(false);
    } catch (error) {
      toast.error('Error al guardar', {
        description: error instanceof Error ? error.message : 'Error',
      });
    }
  };

  const handleLoadSaved = (type: ReportType, savedFilters: Record<string, string>) => {
    setActiveType(type);
    setFilters(savedFilters);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reportes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Genera y exporta reportes del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showSaveInput ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nombre del reporte..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-48 h-9"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!saveName.trim() || saveReport.isPending}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {saveReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSaveInput(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowSaveInput(true)}>
              <BookmarkPlus className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Saved reports */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Reportes Guardados</CardTitle>
            </CardHeader>
            <CardContent>
              <SavedReportsPanel onLoad={handleLoadSaved} />
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Report type tabs */}
          <Tabs
            value={activeType}
            onValueChange={(v) => setActiveType(v as ReportType)}
          >
            <TabsList className="w-full grid grid-cols-5">
              {REPORT_TYPES.map((type) => (
                <TabsTrigger key={type} value={type} className="text-xs">
                  {REPORT_TYPE_CONFIG[type].label.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Description + Filters */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{config.description}</p>
            <ReportFilters
              filters={filters}
              onFiltersChange={setFilters}
              showAdvisor={activeType === 'quotes' || activeType === 'performance' || activeType === 'leads'}
              showStatus={activeType === 'leads'}
            />
          </div>

          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{config.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                </div>
              ) : (
                <ReportChart
                  chartType={config.chartType}
                  data={data?.chart_data || []}
                  isCurrency={activeType === 'revenue'}
                />
              )}
            </CardContent>
          </Card>

          {/* Summary badges */}
          {data?.summary && (
            <div className="flex items-center gap-3 flex-wrap">
              {Object.entries(data.summary).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs py-1 px-3">
                  {key.replace(/_/g, ' ')}: {typeof value === 'number' && value > 10000 ? fmt(value) : value}
                </Badge>
              ))}
            </div>
          )}

          {/* Data table */}
          {data?.table_data && data.table_data.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(data.table_data[0]!).slice(0, 8).map((col) => (
                          <TableHead key={col} className="text-xs whitespace-nowrap">
                            {col.replace(/_/g, ' ')}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.table_data.slice(0, 100).map((row, idx) => (
                        <TableRow key={idx}>
                          {Object.values(row).slice(0, 8).map((val, colIdx) => (
                            <TableCell key={colIdx} className="text-xs">
                              {val == null
                                ? '—'
                                : typeof val === 'number'
                                  ? val > 10000
                                    ? fmt(val)
                                    : val.toLocaleString('es-CO')
                                  : String(val).slice(0, 50)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {data.table_data.length > 100 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Mostrando 100 de {data.table_data.length} registros. Exporta CSV para ver todos.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
