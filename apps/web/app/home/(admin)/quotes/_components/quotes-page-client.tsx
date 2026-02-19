'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Button } from '@kit/ui/button';
import { PermissionGate } from '@kit/rbac/permission-gate';
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
import { RefreshCw, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { createQuotesTableColumns, type QuoteAction } from './quotes-table-columns';
import { QuoteFormDialog } from './quote-form-dialog';
import { MarginApprovalDialog } from './margin-approval-dialog';
import { SendQuoteDialog } from './send-quote-dialog';
import { ClientResponseDialog } from './client-response-dialog';
import type { Quote, QuoteFilters } from '../_lib/types';

export function QuotesPageClient() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<QuoteFilters>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'quote_number', desc: true },
  ]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editQuote, setEditQuote] = useState<Quote | null>(null);
  const [approvalQuote, setApprovalQuote] = useState<Quote | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [sendQuote, setSendQuote] = useState<Quote | null>(null);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [responseQuote, setResponseQuote] = useState<Quote | null>(null);
  const [isResponseOpen, setIsResponseOpen] = useState(false);

  const fetchQuotes = useCallback(
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
        if (filters.customer_id) params.set('customer_id', filters.customer_id);
        if (filters.advisor_id) params.set('advisor_id', filters.advisor_id);
        if (filters.search) params.set('search', filters.search);
        if (filters.from_date) params.set('from_date', filters.from_date);
        if (filters.to_date) params.set('to_date', filters.to_date);

        const response = await fetch(`/api/quotes?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Error al cargar las cotizaciones');
        }

        const data = await response.json();
        setQuotes(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (error) {
        console.error('Error fetching quotes:', error);
        toast.error('Error', {
          description: 'No se pudieron cargar las cotizaciones',
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentPage, filters]
  );

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleRefresh = () => {
    fetchQuotes(true);
  };

  const handleAction = useCallback((action: QuoteAction) => {
    switch (action.type) {
      case 'view':
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
              // Storage upload failed — API returned raw PDF bytes
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);
              window.open(blobUrl, '_blank');
              toast.success('PDF generado', {
                id: toastId,
                description: `Cotización #${action.quote.quote_number}`,
              });
            } else {
              // Normal JSON response with signed URL
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

  const table = useReactTable({
    data: quotes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

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
            Cotizaciones
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona y da seguimiento a tus cotizaciones
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

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {quotes.length === 0 ? (
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
                                header.getContext()
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
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
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
