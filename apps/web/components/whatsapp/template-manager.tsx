'use client';

import { useCallback, useEffect, useState } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Globe,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import { Input } from '@kit/ui/input';
import { Skeleton } from '@kit/ui/skeleton';
import { cn } from '@kit/ui/utils';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WhatsAppTemplate {
  id: string;
  name: string;
  status: 'approved' | 'pending' | 'rejected';
  language: string;
  category: string;
  body: string;
  header?: string;
  footer?: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Status badge config                                                */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<
  WhatsAppTemplate['status'],
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  approved: {
    label: 'Aprobada',
    icon: CheckCircle2,
    className:
      'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  },
  pending: {
    label: 'Pendiente',
    icon: Clock,
    className:
      'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  },
  rejected: {
    label: 'Rechazada',
    icon: XCircle,
    className:
      'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  marketing: 'Marketing',
  utility: 'Utilidad',
  authentication: 'Autenticación',
};

/* ------------------------------------------------------------------ */
/*  Template preview dialog                                            */
/* ------------------------------------------------------------------ */

function TemplatePreviewDialog({
  template,
}: {
  template: WhatsAppTemplate;
}) {
  const statusCfg = STATUS_CONFIG[template.status];
  const StatusIcon = statusCfg.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
          <span className="sr-only">Ver plantilla</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {template.name}
          </DialogTitle>
          <DialogDescription>
            Vista previa de la plantilla de WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={statusCfg.className}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusCfg.label}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Globe className="h-3 w-3" />
              {template.language.toUpperCase()}
            </Badge>
            <Badge variant="secondary">
              {CATEGORY_LABELS[template.category] ?? template.category}
            </Badge>
          </div>

          {/* WhatsApp-style preview */}
          <div className="rounded-lg bg-[#e5ddd5] p-4 dark:bg-gray-800">
            <div className="mx-auto max-w-xs rounded-lg bg-white px-3 py-2 shadow dark:bg-gray-700">
              {template.header && (
                <p className="mb-1 text-sm font-bold text-foreground">
                  {template.header}
                </p>
              )}
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {template.body}
              </p>
              {template.footer && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {template.footer}
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Última actualización:{' '}
            {new Date(template.updated_at).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Template card                                                      */
/* ------------------------------------------------------------------ */

function TemplateCard({
  template,
  index,
}: {
  template: WhatsAppTemplate;
  index: number;
}) {
  const statusCfg = STATUS_CONFIG[template.status];
  const StatusIcon = statusCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
    >
      <Card className="border-border bg-card transition-shadow hover:shadow-md">
        <CardContent className="flex items-start gap-4 p-4">
          {/* Icon */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <div className="overflow-hidden">
                <h4 className="truncate text-sm font-semibold text-foreground">
                  {template.name}
                </h4>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {template.body}
                </p>
              </div>
              <TemplatePreviewDialog template={template} />
            </div>

            {/* Badges */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn('px-1.5 py-0 text-[10px]', statusCfg.className)}
              >
                <StatusIcon className="mr-0.5 h-2.5 w-2.5" />
                {statusCfg.label}
              </Badge>
              <Badge
                variant="secondary"
                className="gap-0.5 px-1.5 py-0 text-[10px]"
              >
                <Globe className="h-2.5 w-2.5" />
                {template.language.toUpperCase()}
              </Badge>
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {CATEGORY_LABELS[template.category] ?? template.category}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function TemplateManager() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  /* ---- Fetch templates ---- */
  const fetchTemplates = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/whatsapp/templates');
      if (!res.ok) throw new Error('Error al cargar plantillas');
      const data = await res.json();
      setTemplates(data.data ?? []);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al cargar plantillas';
      setError(msg);
      toast.error('Error', { description: msg });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  /* ---- Filter templates ---- */
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.body.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: templates.length,
    approved: templates.filter((t) => t.status === 'approved').length,
    pending: templates.filter((t) => t.status === 'pending').length,
    rejected: templates.filter((t) => t.status === 'rejected').length,
  };

  /* ---- Render ---- */

  return (
    <div className="space-y-6">
      {/* Header & filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Input
            placeholder="Buscar plantilla..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-4"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter pills */}
          {(
            ['all', 'approved', 'pending', 'rejected'] as const
          ).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'text-xs',
                statusFilter === s &&
                  'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              {s === 'all'
                ? 'Todas'
                : STATUS_CONFIG[s].label}
              <span className="ml-1 tabular-nums opacity-70">
                ({statusCounts[s]})
              </span>
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTemplates(true)}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
            />
          </Button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="flex gap-4 p-4">
                  <Skeleton className="h-10 w-10 flex-shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-16 rounded-full" />
                      <Skeleton className="h-4 w-12 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/30 bg-destructive/5 py-16 text-center"
          >
            <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
            <p className="font-medium text-foreground">
              Error al cargar plantillas
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTemplates()}
              className="mt-4"
            >
              Reintentar
            </Button>
          </motion.div>
        ) : filteredTemplates.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 py-16 text-center"
          >
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium text-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'No se encontraron plantillas'
                : 'Sin plantillas'}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Intenta con otros filtros de búsqueda'
                : 'Las plantillas se gestionan desde Meta Business Manager y aparecerán aquí una vez sincronizadas.'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredTemplates.map((template, idx) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={idx}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info note */}
      <Card className="border-border bg-muted/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-primary" />
            Gestión de plantillas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Las plantillas de WhatsApp se crean y editan desde{' '}
            <a
              href="https://business.facebook.com/wa/manage/message-templates/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Meta Business Manager
            </a>
            . Los cambios se sincronizan automáticamente con esta vista.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
