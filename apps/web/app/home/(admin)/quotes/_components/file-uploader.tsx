'use client';

import { useState, useRef } from 'react';
import { Button } from '@kit/ui/button';
import { toast } from 'sonner';
import { Upload, File, Trash2, Loader2, Paperclip, Download } from 'lucide-react';
import { motion } from 'motion/react';

interface Attachment {
  name: string;
  path: string;
  url: string | null;
  metadata?: {
    size?: number;
    mimetype?: string;
  };
}

interface FileUploaderProps {
  entityType: string;
  entityId: string;
  bucket?: string;
  onUploadComplete?: () => void;
}

export function FileUploader({
  entityType,
  entityId,
  bucket = 'documents',
  onUploadComplete,
}: FileUploaderProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing attachments
  const fetchAttachments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/attachments?entity_type=${entityType}&entity_id=${entityId}&bucket=${bucket}`
      );
      if (response.ok) {
        const data = await response.json();
        setAttachments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load on mount
  useState(() => {
    fetchAttachments();
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity_type', entityType);
        formData.append('entity_id', entityId);
        formData.append('bucket', bucket);

        const response = await fetch('/api/attachments', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al subir archivo');
        }

        const data = await response.json();
        setAttachments((prev) => [
          ...prev,
          {
            name: data.data.file_name,
            path: data.data.path,
            url: data.data.url,
            metadata: {
              size: data.data.file_size,
              mimetype: data.data.mime_type,
            },
          },
        ]);

        toast.success(`Archivo "${file.name}" subido correctamente`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Error al subir archivo'
        );
      }
    }

    setIsUploading(false);
    onUploadComplete?.();
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (path: string, name: string) => {
    try {
      const response = await fetch(
        `/api/attachments?path=${encodeURIComponent(path)}&bucket=${bucket}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setAttachments((prev) => prev.filter((a) => a.path !== path));
        toast.success(`"${name}" eliminado`);
      }
    } catch (error) {
      toast.error('Error al eliminar archivo');
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">
            Adjuntos ({attachments.length})
          </h4>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.docx,.doc"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Upload className="h-3 w-3 mr-1" />
            )}
            Subir archivo
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-4 border-2 border-dashed rounded-lg">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">
            Arrastra archivos aquí o haz clic en "Subir archivo"
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, imágenes, Excel, Word (máx. 25MB)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <motion.div
              key={attachment.path}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <File className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm truncate">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(attachment.metadata?.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {attachment.url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    asChild
                  >
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Descargar"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDelete(attachment.path, attachment.name)}
                  title="Eliminar"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
