# FASE 8: Storage Supabase (Buckets, Policies, Estructura)

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha:** 2026-02-11

---

## 1. ESTRUCTURA DE BUCKETS

| Bucket | Público | Max File Size | Tipos Permitidos | Uso |
|--------|---------|--------------|-----------------|-----|
| `organization-logos` | SI | 2MB | image/png, image/jpeg, image/svg+xml | Logos de organizaciones |
| `avatars` | SI | 1MB | image/png, image/jpeg, image/webp | Avatares de usuarios |
| `documents` | NO | 25MB | application/pdf, image/*, .xlsx, .docx | Documentos de pedidos, OC, facturas |
| `generated-pdfs` | NO | 10MB | application/pdf | PDFs generados (proformas, cotizaciones, órdenes) |
| `whatsapp-media` | NO | 16MB | image/*, audio/*, video/*, application/pdf | Media de conversaciones WhatsApp |
| `comment-attachments` | NO | 10MB | image/*, application/pdf, .xlsx, .docx | Adjuntos en comentarios |

## 2. ESTRUCTURA DE CARPETAS POR BUCKET

```
documents/
  └── {organization_id}/
      ├── orders/
      │   └── {order_id}/
      │       ├── purchase-orders/
      │       │   └── PO-001.pdf
      │       ├── invoices/
      │       │   └── FAC-12345.pdf
      │       ├── guides/
      │       │   └── guia-servientrega.pdf
      │       └── receipts/
      │           └── comprobante-entrega.pdf
      ├── quotes/
      │   └── {quote_id}/
      │       └── proforma-30001.pdf
      └── licenses/
          └── {order_item_id}/
              └── certificado-licencia.pdf

generated-pdfs/
  └── {organization_id}/
      ├── quotes/
      │   └── cotizacion-30001.pdf
      ├── proformas/
      │   └── proforma-30001.pdf
      └── orders/
          └── pedido-001.pdf

whatsapp-media/
  └── {organization_id}/
      └── {conversation_id}/
          ├── image-{timestamp}.jpg
          └── document-{timestamp}.pdf
```

## 3. STORAGE POLICIES (RLS)

```sql
-- Bucket: documents (privado)
CREATE POLICY "documents_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.get_user_org_id()::text
  );

CREATE POLICY "documents_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.get_user_org_id()::text
  );

-- Bucket: generated-pdfs (privado)
CREATE POLICY "pdfs_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'generated-pdfs'
    AND (storage.foldername(name))[1] = auth.get_user_org_id()::text
  );

CREATE POLICY "pdfs_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'generated-pdfs'
    AND (storage.foldername(name))[1] = auth.get_user_org_id()::text
  );

-- Bucket: organization-logos (público lectura)
CREATE POLICY "logos_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'organization-logos');

CREATE POLICY "logos_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'organization-logos'
    AND (storage.foldername(name))[1] = auth.get_user_org_id()::text
  );

-- Bucket: avatars (público lectura)
CREATE POLICY "avatars_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 4. HELPER DE UPLOAD

```typescript
// lib/storage/upload.ts
export async function uploadDocument(
  supabase: SupabaseClient,
  params: {
    organizationId: string;
    bucket: 'documents' | 'comment-attachments' | 'whatsapp-media';
    folder: string;  // ej: 'orders/uuid-123/invoices'
    file: File;
  }
): Promise<string> {
  const { organizationId, bucket, folder, file } = params;
  const ext = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `${organizationId}/${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Retornar URL firmada (válida 1 hora)
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);

  return data!.signedUrl;
}
```

## 5. RESUMEN

| Métrica | Valor |
|---|---|
| **Buckets** | 6 |
| **Buckets públicos** | 2 (logos, avatars) |
| **Buckets privados** | 4 (documents, pdfs, whatsapp, comments) |
| **Aislamiento** | Por `organization_id` en la ruta del archivo |
| **Max file size** | 25MB (documentos) |
| **RLS** | En todos los buckets |
