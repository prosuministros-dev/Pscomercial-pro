# FASE 9: Generación de PDF (Compatible Vercel, Sin Chromium)

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha:** 2026-02-11
**Restricción:** NO Chromium/Puppeteer (no funciona en Vercel serverless)

---

## 1. ANÁLISIS DE OPCIONES

| Librería | Peso | Serverless | Pros | Contras | Veredicto |
|----------|------|-----------|------|---------|-----------|
| **@react-pdf/renderer** | ~2MB | SI | JSX syntax, React familiar, fonts custom | Limitado en layout complejo | **RECOMENDADA** |
| **pdf-lib** | ~400KB | SI | Muy ligera, bajo nivel, precisa | Sin HTML/CSS, manual positioning | Alternativa |
| **jsPDF** | ~300KB | SI | Ligera, popular | API imperativa, difícil mantener | No recomendada |
| **pdfmake** | ~1.5MB | SI | Declarativa, tablas fáciles | Fonts custom complejo | Alternativa |
| Puppeteer/Chromium | ~300MB | NO | Renderiza HTML exacto | NO funciona en Vercel | DESCARTADA |

### Decisión: **@react-pdf/renderer**

Razones:
1. JSX syntax → familiar para el equipo React
2. Compatible 100% con Vercel serverless (no usa Chromium)
3. Soporte nativo de tablas, imágenes, fonts custom
4. Genera PDF de alta calidad con layout preciso
5. Se puede usar en API Routes de Next.js
6. ~2MB total bundle (aceptable para serverless)

---

## 2. ARQUITECTURA DE GENERACIÓN

```
Frontend                    API Route                     Storage
┌──────────┐    GET    ┌─────────────────┐    Upload    ┌──────────┐
│ Button   │ ────────→ │ /api/pdf/       │ ──────────→ │ Supabase │
│ "Generar │           │ quote/[id]      │             │ Storage  │
│  PDF"    │           │                 │             │ (bucket: │
│          │ ←──────── │ 1. Fetch data   │ ←────────── │ generated│
│ (download│   PDF     │ 2. Render PDF   │   URL       │ -pdfs)   │
│  link)   │           │ 3. Upload       │             │          │
└──────────┘           │ 4. Return URL   │             └──────────┘
                       └─────────────────┘
```

## 3. IMPLEMENTACIÓN

### 3.1 Template de Cotización/Proforma

```tsx
// lib/pdf/templates/quote-template.tsx
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';

// Registrar fuentes (opcional, para branding)
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Inter' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  logo: { width: 120, height: 40 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#2C3E2B' },
  subtitle: { fontSize: 10, color: '#666' },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  infoBox: { width: '48%', padding: 10, backgroundColor: '#f8f8f8', borderRadius: 4 },
  label: { fontSize: 7, color: '#999', marginBottom: 2, textTransform: 'uppercase' },
  value: { fontSize: 9, fontWeight: 'bold' },
  table: { marginTop: 10, marginBottom: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#2C3E2B', padding: 6 },
  tableHeaderCell: { color: '#fff', fontWeight: 'bold', fontSize: 8 },
  tableRow: { flexDirection: 'row', padding: 6, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  tableCell: { fontSize: 8 },
  totals: { alignItems: 'flex-end', marginTop: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, padding: 3 },
  totalLabel: { fontSize: 9 },
  totalValue: { fontSize: 9, fontWeight: 'bold' },
  grandTotal: { fontSize: 12, fontWeight: 'bold', color: '#2C3E2B' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 7, color: '#999', textAlign: 'center' },
  terms: { marginTop: 20, padding: 10, backgroundColor: '#f8f8f8', borderRadius: 4 },
});

interface QuotePDFProps {
  quote: any;
  companyInfo: any;
}

export function QuotePDFTemplate({ quote, companyInfo }: QuotePDFProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header con logo */}
        <View style={styles.header}>
          <View>
            {companyInfo.logo_url && <Image src={companyInfo.logo_url} style={styles.logo} />}
            <Text style={styles.title}>{companyInfo.name}</Text>
            <Text style={styles.subtitle}>NIT: {companyInfo.nit}</Text>
            <Text style={styles.subtitle}>{companyInfo.address}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.title}>COTIZACIÓN</Text>
            <Text style={styles.subtitle}>No. {quote.quote_number}</Text>
            <Text style={styles.subtitle}>Fecha: {formatDatePDF(quote.quote_date)}</Text>
            <Text style={styles.subtitle}>Válida hasta: {formatDatePDF(quote.expires_at)}</Text>
          </View>
        </View>

        {/* Info del cliente */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{quote.customer.business_name}</Text>
            <Text style={styles.subtitle}>NIT: {quote.customer.nit}</Text>
            <Text style={styles.subtitle}>{quote.customer.contact?.full_name}</Text>
            <Text style={styles.subtitle}>{quote.customer.contact?.email}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>Condiciones</Text>
            <Text style={styles.value}>Forma de pago: {quote.payment_terms}</Text>
            <Text style={styles.subtitle}>Moneda: {quote.currency}</Text>
            <Text style={styles.subtitle}>Asesor: {quote.advisor.full_name}</Text>
          </View>
        </View>

        {/* Tabla de productos */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '8%' }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Código</Text>
            <Text style={[styles.tableHeaderCell, { width: '37%' }]}>Descripción</Text>
            <Text style={[styles.tableHeaderCell, { width: '8%', textAlign: 'center' }]}>Cant</Text>
            <Text style={[styles.tableHeaderCell, { width: '16%', textAlign: 'right' }]}>Vr. Unit</Text>
            <Text style={[styles.tableHeaderCell, { width: '16%', textAlign: 'right' }]}>Total</Text>
          </View>

          {quote.items.map((item: any, idx: number) => (
            <View key={item.id} style={[styles.tableRow, idx % 2 === 0 ? {} : { backgroundColor: '#fafafa' }]}>
              <Text style={[styles.tableCell, { width: '8%' }]}>{idx + 1}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{item.sku}</Text>
              <Text style={[styles.tableCell, { width: '37%' }]}>{item.description}</Text>
              <Text style={[styles.tableCell, { width: '8%', textAlign: 'center' }]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, { width: '16%', textAlign: 'right' }]}>
                {formatCurrencyPDF(item.unit_price, quote.currency)}
              </Text>
              <Text style={[styles.tableCell, { width: '16%', textAlign: 'right' }]}>
                {formatCurrencyPDF(item.subtotal, quote.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totales (transporte NO visible al cliente) */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrencyPDF(quote.subtotal, quote.currency)}</Text>
          </View>
          {quote.discount_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Descuento:</Text>
              <Text style={styles.totalValue}>-{formatCurrencyPDF(quote.discount_amount, quote.currency)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA (19%):</Text>
            <Text style={styles.totalValue}>{formatCurrencyPDF(quote.tax_amount, quote.currency)}</Text>
          </View>
          <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#2C3E2B', paddingTop: 5 }]}>
            <Text style={styles.grandTotal}>TOTAL:</Text>
            <Text style={styles.grandTotal}>{formatCurrencyPDF(quote.total, quote.currency)}</Text>
          </View>
        </View>

        {/* Condiciones */}
        <View style={styles.terms}>
          <Text style={[styles.label, { marginBottom: 5 }]}>Términos y Condiciones</Text>
          <Text style={styles.subtitle}>• Esta cotización es válida por {quote.validity_days} días.</Text>
          <Text style={styles.subtitle}>• Los precios están sujetos a disponibilidad.</Text>
          <Text style={styles.subtitle}>• Precios en {quote.currency}.</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {companyInfo.name} | NIT: {companyInfo.nit} | {companyInfo.phone} | {companyInfo.email}
        </Text>
      </Page>
    </Document>
  );
}
```

### 3.2 API Route para Generar PDF

```typescript
// api/pdf/quote/[id]/route.ts
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@kit/supabase/server';
import { QuotePDFTemplate } from '@/lib/pdf/templates/quote-template';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Obtener datos de la cotización con relaciones
  const { data: quote } = await supabase
    .from('quotes')
    .select(`
      *,
      customer:customers(*, contacts:customer_contacts(*)),
      advisor:profiles!advisor_id(full_name, email, phone),
      items:quote_items(*)
    `)
    .eq('id', id)
    .single();

  if (!quote) return new Response('Not found', { status: 404 });

  // 2. Obtener info de la empresa
  const { data: companySettings } = await supabase
    .from('system_settings')
    .select('value')
    .eq('organization_id', quote.organization_id)
    .eq('key', 'company_info')
    .single();

  const companyInfo = companySettings?.value || {};

  // 3. Renderizar PDF
  const pdfBuffer = await renderToBuffer(
    <QuotePDFTemplate quote={quote} companyInfo={companyInfo} />
  );

  // 4. Opcionalmente subir a Storage
  const fileName = `cotizacion-${quote.quote_number}.pdf`;
  const storagePath = `${quote.organization_id}/quotes/${fileName}`;

  await supabase.storage
    .from('generated-pdfs')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  // 5. Actualizar URL en la cotización
  const { data: signedUrl } = await supabase.storage
    .from('generated-pdfs')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 días

  await supabase
    .from('quotes')
    .update({
      proforma_url: signedUrl?.signedUrl,
      proforma_generated_at: new Date().toISOString(),
    })
    .eq('id', id);

  // 6. Retornar PDF como descarga
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
    },
  });
}
```

---

## 4. FORMATOS PDF REQUERIDOS

| Formato | Template | Datos Clave | No mostrar al cliente |
|---------|----------|-------------|----------------------|
| **Cotización** | QuotePDFTemplate | Cliente, productos, precios, IVA, condiciones | Transporte (si no incluido), margen, costo |
| **Proforma** | ProformaPDFTemplate | Igual que cotización + datos bancarios | Idem |
| **Orden/Pedido** | OrderPDFTemplate | Pedido, productos, info entrega, estado | Costos internos |

---

## 5. RESUMEN

| Métrica | Valor |
|---|---|
| **Librería** | @react-pdf/renderer |
| **Runtime** | Vercel Serverless (Node.js) |
| **Bundle size** | ~2MB |
| **Tiempo de generación** | <3s para cotización estándar |
| **Storage** | Supabase Storage (bucket: generated-pdfs) |
| **Formatos** | 3 (cotización, proforma, orden) |
| **Chromium** | NO requerido |
