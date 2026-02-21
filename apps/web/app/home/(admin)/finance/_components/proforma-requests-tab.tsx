'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
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
import { Loader2, Search, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { financeKeys } from '../_lib/finance-queries';

interface QuoteForProforma {
  id: string;
  quote_number: number;
  currency: string;
  total: number;
  payment_terms: string;
  status: string;
  proforma_url: string | null;
  proforma_generated_at: string | null;
  customer?: {
    id: string;
    business_name: string;
    nit: string;
  };
  advisor?: {
    id: string;
    full_name: string;
  };
}

export function ProformaRequestsTab() {
  const supabase = useSupabase();
  const [search, setSearch] = useState('');

  // Fetch quotes with payment_terms = ANTICIPADO that need proformas
  const { data: quotes = [], isLoading } = useQuery<QuoteForProforma[]>({
    queryKey: [...financeKeys.all, 'proforma-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id, quote_number, currency, total, payment_terms, status,
          proforma_url, proforma_generated_at,
          customer:customers(id, business_name, nit),
          advisor:profiles!quotes_advisor_id_fkey(id, full_name)
        `)
        .eq('payment_terms', 'ANTICIPADO')
        .is('deleted_at', null)
        .in('status', ['offer_created', 'negotiation', 'risk', 'pending_oc'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as QuoteForProforma[];
    },
    staleTime: 30000,
  });

  const handleGenerateProforma = async (quoteId: string, quoteNumber: number) => {
    const toastId = toast.loading('Generando proforma...');
    try {
      const response = await fetch(`/api/pdf/proforma/${quoteId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al generar proforma');
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        const data = await response.json();
        if (data.url) {
          window.open(data.url, '_blank');
        }
      }
      toast.success('Proforma generada', {
        id: toastId,
        description: `Cotización #${quoteNumber}`,
      });
    } catch (error) {
      toast.error('Error', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Error al generar proforma',
      });
    }
  };

  const fmt = (n: number, currency = 'COP') =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(n);

  const filtered = quotes.filter((q) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      String(q.quote_number).includes(s) ||
      q.customer?.business_name.toLowerCase().includes(s) ||
      q.customer?.nit.toLowerCase().includes(s)
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por # cotización, cliente o NIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay cotizaciones de pago anticipado pendientes</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cotización</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Asesor</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado Proforma</TableHead>
                <TableHead className="w-40"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-mono font-medium">
                    #{q.quote_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {q.customer?.business_name || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {q.customer?.nit}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {q.advisor?.full_name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {fmt(q.total, q.currency)}
                  </TableCell>
                  <TableCell>
                    {q.proforma_generated_at ? (
                      <Badge variant="default">Generada</Badge>
                    ) : (
                      <Badge variant="outline">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={q.proforma_generated_at ? 'outline' : 'default'}
                        onClick={() => handleGenerateProforma(q.id, q.quote_number)}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        {q.proforma_generated_at ? 'Regenerar' : 'Generar'}
                      </Button>
                      {q.proforma_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(q.proforma_url!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
