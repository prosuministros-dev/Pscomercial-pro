'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Input } from '@kit/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/react-table';
import { PermissionGate } from '@kit/rbac/permission-gate';
import { useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw,
  Plus,
  Search,
  LayoutGrid,
  TableIcon,
  FileText,
  TrendingDown,
  MessageSquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuotesKanban, useQuotes, useTRM, quoteKeys } from '../_lib/quote-queries';
import { createQuotesTableColumns, type QuoteAction } from './quotes-table-columns';
import { QuotesKanban } from './quotes-kanban';
import { QuoteDetailModal } from './quote-detail-modal';
import { QuoteFormDialog } from './quote-form-dialog';
import { MarginApprovalDialog } from './margin-approval-dialog';
import { SendQuoteDialog } from './send-quote-dialog';
import { ClientResponseDialog } from './client-response-dialog';
import type { Quote } from '../_lib/types';

type ViewMode = 'kanban' | 'table';

export function QuotesPageClient() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'quote_number', desc: true },
  ]);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editQuote, setEditQuote] = useState<Quote | null>(null);
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [approvalQuote, setApprovalQuote] = useState<Quote | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [sendQuote, setSendQuote] = useState<Quote | null>(null);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [responseQuote, setResponseQuote] = useState<Quote | null>(null);
  const [isResponseOpen, setIsResponseOpen] = useState(false);

  // Data
  const { data: kanbanQuotes = [], isLoading: kanbanLoading } = useQuotesKanban();
  const { data: tableData, isLoading: tableLoading } = useQuotes({
    page: currentPage,
    limit: 20,
    search: searchTerm || undefined,
  });
  const { data: trm } = useTRM();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: quoteKeys.all });
    setIsRefreshing(false);
  };

  const handleKanbanStatusChange = useCallback(async (quoteId: string, newStatus: string) => {
    const toastId = toast.loading('Cambiando estado...');
    try {
      const response = await fetch('/api/quotes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quoteId, status: newStatus }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cambiar estado');
      }
      toast.success('Estado actualizado', { id: toastId });
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
    } catch (error) {
      toast.error('Error', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Error al cambiar estado',
      });
    }
  }, [queryClient]);

  // Stats computed from kanban data
  const stats = useMemo(() => {
    const active = kanbanQuotes.filter((q) => q.status !== 'lost');
    return {
      total: active.length,
      lowMargin: active.filter(
        (q) =>
          q.margin_pct !== null &&
          q.margin_pct < 7 &&
          !['rejected', 'expired', 'lost'].includes(q.status),
      ).length,
      negotiation: active.filter((q) => q.status === 'negotiation').length,
      pendingOC: active.filter((q) => q.status === 'pending_oc').length,
    };
  }, [kanbanQuotes]);

  const handleAction = useCallback((action: QuoteAction) => {
    switch (action.type) {
      case 'view':
        setDetailQuote(action.quote);
        setIsDetailOpen(true);
        break;
      case 'edit':
        setEditQuote(action.quote);
        setIsFormOpen(true);
        break;
      case 'approve-margin':
        setApprovalQuote(action.quote);
        setIsApprovalOpen(true);
        break;
      case 'generate-pdf': {
        const generatePdf = async () => {
          const toastId = toast.loading('Generando PDF...');
          try {
            const response = await fetch(`/api/pdf/quote/${action.quote.id}`);
            if (!response.ok) {
              const errorText = await response.text();
              let errorMsg = 'Error al generar el PDF';
              try {
                const errorData = JSON.parse(errorText);
                errorMsg = errorData.error || errorMsg;
              } catch {
                // response wasn't JSON
              }
              throw new Error(errorMsg);
            }
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/pdf')) {
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);
              window.open(blobUrl, '_blank');
              toast.success('PDF generado', {
                id: toastId,
                description: `Cotización #${action.quote.quote_number}`,
              });
            } else {
              const data = await response.json();
              if (data.url) {
                window.open(data.url, '_blank');
                toast.success('PDF generado', {
                  id: toastId,
                  description: `Cotización #${action.quote.quote_number}`,
                });
              } else {
                toast.dismiss(toastId);
                toast.error('Error', { description: 'No se pudo generar la URL del PDF' });
              }
            }
          } catch (error) {
            toast.error('Error', {
              id: toastId,
              description: error instanceof Error ? error.message : 'Error al generar PDF',
            });
          }
        };
        generatePdf();
        break;
      }
      case 'create-order': {
        const createOrder = async () => {
          const toastId = toast.loading('Creando pedido...');
          try {
            const response = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quote_id: action.quote.id }),
            });
            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || 'Error al crear el pedido');
            }
            const order = await response.json();
            toast.success('Pedido creado', {
              id: toastId,
              description: `Pedido #${order.order_number} creado desde cotización #${action.quote.quote_number}`,
            });
            handleRefresh();
          } catch (error) {
            toast.error('Error', {
              id: toastId,
              description: error instanceof Error ? error.message : 'Error al crear pedido',
            });
          }
        };
        createOrder();
        break;
      }
      case 'send-to-client':
        setSendQuote(action.quote);
        setIsSendOpen(true);
        break;
      case 'client-response':
        setResponseQuote(action.quote);
        setIsResponseOpen(true);
        break;
    }
  }, []);

  const columns = useMemo(() => createQuotesTableColumns(handleAction), [handleAction]);

  const tableQuotes = tableData?.data || [];
  const totalPages = tableData?.pagination?.totalPages || 1;

  const table = useReactTable({
    data: tableQuotes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  const isLoading = viewMode === 'kanban' ? kanbanLoading : tableLoading;

  if (isLoading && kanbanQuotes.length === 0 && tableQuotes.length === 0) {
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
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Cotizaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona y da seguimiento a tus cotizaciones
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* TRM Badge */}
          {trm && (
            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1.5 text-sm font-mono border-emerald-300 dark:border-emerald-700"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              TRM: ${trm.rate.toLocaleString('es-CO')}
            </Badge>
          )}
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
          <PermissionGate permission="quotes:create">
            <Button
              onClick={() => {
                setEditQuote(null);
                setIsFormOpen(true);
              }}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cotización
            </Button>
          </PermissionGate>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatsCard
          label="Total Activas"
          value={stats.total}
          icon={<FileText className="w-5 h-5" />}
          color="cyan"
        />
        <StatsCard
          label="Margen Bajo"
          value={stats.lowMargin}
          icon={<TrendingDown className="w-5 h-5" />}
          color="red"
        />
        <StatsCard
          label="Negociación"
          value={stats.negotiation}
          icon={<MessageSquare className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          label="Pendiente OC"
          value={stats.pendingOC}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
        />
      </motion.div>

      {/* Search + View Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por # cotización o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="gap-1.5"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Kanban</span>
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="gap-1.5"
          >
            <TableIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Tabla</span>
          </Button>
        </div>
      </motion.div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <QuotesKanban
          quotes={kanbanQuotes}
          searchTerm={searchTerm}
          onQuoteClick={(quote) => {
            setDetailQuote(quote);
            setIsDetailOpen(true);
          }}
          onStatusChange={handleKanbanStatusChange}
        />
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {tableQuotes.length === 0 && !tableLoading ? (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No se encontraron cotizaciones
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Crea tu primera cotización para comenzar
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => {
                          setDetailQuote(row.original);
                          setIsDetailOpen(true);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Detail Modal */}
      <QuoteDetailModal
        quote={detailQuote}
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setDetailQuote(null);
        }}
        onEdit={(quote) => {
          setIsDetailOpen(false);
          setEditQuote(quote);
          setIsFormOpen(true);
        }}
        onAction={handleAction}
      />

      {/* Quote Form Dialog */}
      <QuoteFormDialog
        quote={editQuote || undefined}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditQuote(null);
        }}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditQuote(null);
          handleRefresh();
        }}
      />

      {/* Margin Approval Dialog */}
      <MarginApprovalDialog
        quote={approvalQuote}
        open={isApprovalOpen}
        onOpenChange={setIsApprovalOpen}
        onSuccess={handleRefresh}
      />

      {/* Send Quote Dialog */}
      <SendQuoteDialog
        quote={sendQuote}
        open={isSendOpen}
        onOpenChange={setIsSendOpen}
        onSuccess={handleRefresh}
      />

      {/* Client Response Dialog */}
      <ClientResponseDialog
        quote={responseQuote}
        open={isResponseOpen}
        onOpenChange={setIsResponseOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

/* ---------- Stats Card ---------- */

const STAT_COLORS = {
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    icon: 'text-cyan-600 dark:text-cyan-400',
    value: 'text-cyan-700 dark:text-cyan-300',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    value: 'text-red-700 dark:text-red-300',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'text-orange-600 dark:text-orange-400',
    value: 'text-orange-700 dark:text-orange-300',
  },
};

function StatsCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: keyof typeof STAT_COLORS;
}) {
  const c = STAT_COLORS[color];
  return (
    <div
      className={`${c.bg} rounded-xl p-4 flex items-center gap-3 border border-gray-200/50 dark:border-gray-700/50`}
    >
      <div className={c.icon}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-2xl font-bold font-mono ${c.value}`}>{value}</p>
      </div>
    </div>
  );
}
