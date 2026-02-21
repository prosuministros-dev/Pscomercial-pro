'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import {
  Loader2,
  Upload,
  FileText,
  Download,
  Trash2,
  FolderOpen,
  Building2,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderDocument {
  id: string;
  order_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string;
  created_at: string;
  uploader?: {
    full_name: string;
  };
}

interface DocumentsTabProps {
  orderId: string;
  organizationId: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  purchase_order: 'Orden de Compra',
  invoice: 'Factura',
  guide: 'Guía de Despacho',
  receipt: 'Recibo',
  proforma: 'Proforma',
  other: 'Otro',
};

// Categorize docs into client vs supplier folders
const CLIENT_DOC_TYPES = ['purchase_order', 'proforma', 'other'];
const SUPPLIER_DOC_TYPES = ['invoice', 'guide', 'receipt'];

export function DocumentsTab({ orderId, organizationId }: DocumentsTabProps) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadDialog, setUploadDialog] = useState<'client' | 'supplier' | null>(null);
  const [selectedDocType, setSelectedDocType] = useState('other');
  const [uploading, setUploading] = useState(false);

  const { data: documents = [], isLoading } = useQuery<OrderDocument[]>({
    queryKey: ['order-documents', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_documents')
        .select(`
          *,
          uploader:profiles!order_documents_uploaded_by_fkey(full_name)
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as OrderDocument[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from('order_documents')
        .delete()
        .eq('id', docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-documents', orderId] });
      toast.success('Documento eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar documento');
    },
  });

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading('Subiendo archivo...');

    try {
      const ext = file.name.split('.').pop();
      const folder = uploadDialog === 'client' ? 'client' : 'supplier';
      const storagePath = `${organizationId}/orders/${orderId}/${folder}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(storagePath);

      const { error: insertError } = await supabase
        .from('order_documents')
        .insert({
          organization_id: organizationId,
          order_id: orderId,
          document_type: selectedDocType,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ['order-documents', orderId] });
      toast.success('Documento subido', { id: toastId });
      setUploadDialog(null);
    } catch (error) {
      toast.error('Error al subir documento', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setUploading(false);
    }
  };

  const clientDocs = documents.filter((d) => CLIENT_DOC_TYPES.includes(d.document_type));
  const supplierDocs = documents.filter((d) => SUPPLIER_DOC_TYPES.includes(d.document_type));

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Documents Folder */}
      <DocumentFolder
        title="Documentos Cliente"
        icon={<Building2 className="w-4 h-4" />}
        docs={clientDocs}
        onUpload={() => {
          setUploadDialog('client');
          setSelectedDocType('purchase_order');
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
        formatSize={formatSize}
      />

      {/* Supplier Documents Folder */}
      <DocumentFolder
        title="Documentos Proveedor"
        icon={<Truck className="w-4 h-4" />}
        docs={supplierDocs}
        onUpload={() => {
          setUploadDialog('supplier');
          setSelectedDocType('invoice');
        }}
        onDelete={(id) => deleteMutation.mutate(id)}
        formatSize={formatSize}
      />

      {/* Upload Dialog */}
      <Dialog open={!!uploadDialog} onOpenChange={(open) => { if (!open) setUploadDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Subir Documento — {uploadDialog === 'client' ? 'Cliente' : 'Proveedor'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo de Documento</label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
              >
                {(uploadDialog === 'client' ? CLIENT_DOC_TYPES : SUPPLIER_DOC_TYPES).map(
                  (type) => (
                    <option key={type} value={type}>
                      {DOC_TYPE_LABELS[type]}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-8 cursor-pointer hover:border-cyan-400 transition-colors dark:border-gray-600"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-500">
                Haz clic para seleccionar un archivo
              </p>
              <p className="text-xs text-gray-400">
                PDF, imágenes, documentos (máx. 10MB)
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(null)} disabled={uploading}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Sub-component: DocumentFolder ---

function DocumentFolder({
  title,
  icon,
  docs,
  onUpload,
  onDelete,
  formatSize,
}: {
  title: string;
  icon: React.ReactNode;
  docs: OrderDocument[];
  onUpload: () => void;
  onDelete: (id: string) => void;
  formatSize: (bytes: number | null) => string;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-cyan-600" />
          {icon}
          <h4 className="text-sm font-semibold">{title}</h4>
          <Badge variant="secondary" className="text-xs">
            {docs.length}
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={onUpload}>
          <Upload className="w-3.5 h-3.5 mr-1" />
          Subir
        </Button>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <FileText className="w-6 h-6 mx-auto mb-1 opacity-50" />
          <p className="text-xs">No hay documentos</p>
        </div>
      ) : (
        <div className="divide-y">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <p className="text-xs text-gray-500">
                    {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                    {doc.file_size ? ` — ${formatSize(doc.file_size)}` : ''}
                    {doc.uploader ? ` — ${doc.uploader.full_name}` : ''}
                    {' — '}
                    {new Date(doc.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(doc.file_url, '_blank')}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => onDelete(doc.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
