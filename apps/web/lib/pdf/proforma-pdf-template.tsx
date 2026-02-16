import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { QuoteForPdf, OrgForPdf } from './pdf-types';
import { formatCurrencyForPdf, formatDateForPdf } from './format-currency';

const PRIMARY = '#00C8CF';
const DARK = '#1a1a2e';
const LIGHT_BG = '#f8f8f8';
const BORDER = '#e0e0e0';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: `2px solid ${PRIMARY}`,
    paddingBottom: 12,
  },
  headerLeft: { flex: 1 },
  headerRight: { width: 180, alignItems: 'flex-end' },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 4,
  },
  companyInfo: { fontSize: 8, color: '#666', marginBottom: 2 },
  docType: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    marginBottom: 4,
  },
  docNumber: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 4,
  },
  docDate: { fontSize: 9, color: '#666' },
  clientSection: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: LIGHT_BG,
    padding: 12,
    borderRadius: 4,
  },
  clientCol: { flex: 1 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  infoLabel: {
    fontSize: 7,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  infoValue: { fontSize: 9, marginBottom: 4 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: DARK,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 2,
  },
  tableHeaderText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: `1px solid ${BORDER}`,
  },
  tableRowAlt: { backgroundColor: LIGHT_BG },
  colNum: { width: '5%' },
  colSku: { width: '15%' },
  colDesc: { width: '37%' },
  colQty: { width: '8%', textAlign: 'center' },
  colPrice: { width: '17%', textAlign: 'right' },
  colTotal: { width: '18%', textAlign: 'right' },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  totalsBox: { width: 220 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  totalsLabel: { fontSize: 9, color: '#666' },
  totalsValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  totalsFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: PRIMARY,
    borderRadius: 2,
    marginTop: 4,
  },
  totalsFinalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#fff',
  },
  totalsFinalValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#fff',
  },
  bankingBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: LIGHT_BG,
    borderRadius: 4,
    borderLeft: `3px solid ${PRIMARY}`,
  },
  termsBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: LIGHT_BG,
    borderRadius: 4,
    borderLeft: `3px solid ${PRIMARY}`,
  },
  termsTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 6,
  },
  termsText: { fontSize: 8, color: '#666', lineHeight: 1.5 },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: `1px solid ${BORDER}`,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: '#999' },
});

interface ProformaPdfTemplateProps {
  quote: QuoteForPdf;
  org: OrgForPdf;
}

export function ProformaPdfTemplate({ quote, org }: ProformaPdfTemplateProps) {
  const currency = quote.currency;
  const banking = org.banking;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{org.name}</Text>
            {org.tax_id && <Text style={styles.companyInfo}>NIT: {org.tax_id}</Text>}
            {org.address && <Text style={styles.companyInfo}>{org.address}</Text>}
            {org.city && <Text style={styles.companyInfo}>{org.city}</Text>}
            {org.phone && <Text style={styles.companyInfo}>Tel: {org.phone}</Text>}
            {org.email && <Text style={styles.companyInfo}>{org.email}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docType}>PROFORMA</Text>
            <Text style={styles.docNumber}>#{quote.quote_number}</Text>
            <Text style={styles.docDate}>Fecha: {formatDateForPdf(quote.quote_date)}</Text>
            <Text style={styles.docDate}>Válida hasta: {formatDateForPdf(quote.expires_at)}</Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.clientSection}>
          <View style={styles.clientCol}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <Text style={styles.infoLabel}>Razón Social</Text>
            <Text style={styles.infoValue}>{quote.customer.business_name}</Text>
            <Text style={styles.infoLabel}>NIT</Text>
            <Text style={styles.infoValue}>{quote.customer.nit}</Text>
            {quote.customer.city && (
              <>
                <Text style={styles.infoLabel}>Ciudad</Text>
                <Text style={styles.infoValue}>{quote.customer.city}</Text>
              </>
            )}
          </View>
          <View style={styles.clientCol}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            {quote.customer.address && (
              <>
                <Text style={styles.infoLabel}>Dirección</Text>
                <Text style={styles.infoValue}>{quote.customer.address}</Text>
              </>
            )}
            {quote.customer.phone && (
              <>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{quote.customer.phone}</Text>
              </>
            )}
            {quote.customer.email && (
              <>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{quote.customer.email}</Text>
              </>
            )}
          </View>
          <View style={styles.clientCol}>
            <Text style={styles.sectionTitle}>Asesor Comercial</Text>
            <Text style={styles.infoValue}>{quote.advisor.display_name}</Text>
            <Text style={styles.infoValue}>{quote.advisor.email}</Text>
            {quote.advisor.phone && (
              <Text style={styles.infoValue}>Tel: {quote.advisor.phone}</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colNum]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.colSku]}>Código</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Descripción</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Vr. Unit.</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>
          {quote.items.map((item, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={styles.colNum}>{idx + 1}</Text>
              <Text style={styles.colSku}>{item.sku}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={[styles.colQty, { textAlign: 'center' }]}>{item.quantity}</Text>
              <Text style={[styles.colPrice, { textAlign: 'right' }]}>
                {formatCurrencyForPdf(item.unit_price, currency)}
              </Text>
              <Text style={[styles.colTotal, { textAlign: 'right' }]}>
                {formatCurrencyForPdf(item.total, currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatCurrencyForPdf(quote.subtotal, currency)}
              </Text>
            </View>
            {quote.discount_amount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Descuento</Text>
                <Text style={[styles.totalsValue, { color: 'red' }]}>
                  -{formatCurrencyForPdf(quote.discount_amount, currency)}
                </Text>
              </View>
            )}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>IVA (19%)</Text>
              <Text style={styles.totalsValue}>
                {formatCurrencyForPdf(quote.tax_amount, currency)}
              </Text>
            </View>
            {!quote.transport_included && quote.transport_cost > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Transporte</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrencyForPdf(quote.transport_cost, currency)}
                </Text>
              </View>
            )}
            <View style={styles.totalsFinal}>
              <Text style={styles.totalsFinalLabel}>TOTAL</Text>
              <Text style={styles.totalsFinalValue}>
                {formatCurrencyForPdf(quote.total, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Banking Info */}
        {banking && banking.bank_name && (
          <View style={styles.bankingBox}>
            <Text style={styles.termsTitle}>Datos Bancarios para Pago</Text>
            <Text style={styles.termsText}>
              {`• Banco: ${banking.bank_name}\n`}
              {banking.account_type ? `• Tipo de cuenta: ${banking.account_type}\n` : ''}
              {banking.account_number ? `• No. de cuenta: ${banking.account_number}\n` : ''}
              {banking.account_holder ? `• Titular: ${banking.account_holder}\n` : ''}
              {banking.account_holder_nit ? `• NIT Titular: ${banking.account_holder_nit}\n` : ''}
            </Text>
          </View>
        )}

        {/* Terms */}
        <View style={styles.termsBox}>
          <Text style={styles.termsTitle}>Condiciones Comerciales</Text>
          <Text style={styles.termsText}>
            {`• Forma de pago: ${quote.payment_terms}\n`}
            {`• Moneda: ${currency}\n`}
            {`• Validez de la oferta: ${quote.validity_days} días\n`}
            {`• Tiempo de entrega: Según disponibilidad de inventario\n`}
            {quote.transport_included
              ? '• Transporte incluido en los precios unitarios\n'
              : quote.transport_cost > 0
                ? `• Transporte no incluido (${formatCurrencyForPdf(quote.transport_cost, currency)})\n`
                : '• Transporte: Por cuenta del cliente\n'}
            {quote.notes ? `\nObservaciones: ${quote.notes}` : ''}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {org.name} - Proforma #{quote.quote_number}
          </Text>
          <Text style={styles.footerText}>
            Generado el {formatDateForPdf(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
