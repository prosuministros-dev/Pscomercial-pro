import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { OrderForPdf, OrgForPdf } from './pdf-types';
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
  colDesc: { width: '40%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
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
  destSection: {
    marginTop: 16,
  },
  destCard: {
    padding: 10,
    backgroundColor: LIGHT_BG,
    borderRadius: 4,
    marginBottom: 6,
    borderLeft: `3px solid ${PRIMARY}`,
  },
  destHeader: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 4,
  },
  destRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  destLabel: {
    fontSize: 7,
    color: '#999',
    width: 80,
    textTransform: 'uppercase',
  },
  destValue: { fontSize: 8, color: '#333', flex: 1 },
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

const BILLING_TYPE_LABELS: Record<string, string> = {
  total: 'Facturación Total',
  parcial: 'Facturación Parcial',
};

interface OrderPdfTemplateProps {
  order: OrderForPdf;
  org: OrgForPdf;
}

export function OrderPdfTemplate({ order, org }: OrderPdfTemplateProps) {
  const currency = order.currency;

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
            <Text style={styles.docType}>PEDIDO</Text>
            <Text style={styles.docNumber}>#{order.order_number}</Text>
            <Text style={styles.docDate}>
              Fecha: {formatDateForPdf(order.created_at)}
            </Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.clientSection}>
          <View style={styles.clientCol}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <Text style={styles.infoLabel}>Razón Social</Text>
            <Text style={styles.infoValue}>{order.customer.business_name}</Text>
            <Text style={styles.infoLabel}>NIT</Text>
            <Text style={styles.infoValue}>{order.customer.nit}</Text>
            {order.customer.city && (
              <>
                <Text style={styles.infoLabel}>Ciudad</Text>
                <Text style={styles.infoValue}>{order.customer.city}</Text>
              </>
            )}
          </View>
          <View style={styles.clientCol}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            {order.customer.address && (
              <>
                <Text style={styles.infoLabel}>Dirección</Text>
                <Text style={styles.infoValue}>{order.customer.address}</Text>
              </>
            )}
            {order.customer.phone && (
              <>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{order.customer.phone}</Text>
              </>
            )}
            {order.customer.email && (
              <>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{order.customer.email}</Text>
              </>
            )}
          </View>
          <View style={styles.clientCol}>
            <Text style={styles.sectionTitle}>Asesor Comercial</Text>
            <Text style={styles.infoValue}>{order.advisor.full_name}</Text>
            <Text style={styles.infoValue}>{order.advisor.email}</Text>
            {order.advisor.phone && (
              <Text style={styles.infoValue}>Tel: {order.advisor.phone}</Text>
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
          {order.items.map((item, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={styles.colNum}>{idx + 1}</Text>
              <Text style={styles.colSku}>{item.sku}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={[styles.colQty, { textAlign: 'center' }]}>
                {item.quantity}
              </Text>
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
                {formatCurrencyForPdf(order.subtotal, currency)}
              </Text>
            </View>
            {order.tax_amount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>IVA</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrencyForPdf(order.tax_amount, currency)}
                </Text>
              </View>
            )}
            <View style={styles.totalsFinal}>
              <Text style={styles.totalsFinalLabel}>TOTAL</Text>
              <Text style={styles.totalsFinalValue}>
                {formatCurrencyForPdf(order.total, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Destinations */}
        {order.destinations.length > 0 && (
          <View style={styles.destSection}>
            <Text style={styles.sectionTitle}>Destinos de Entrega</Text>
            {order.destinations.map((dest, idx) => (
              <View key={idx} style={styles.destCard}>
                <Text style={styles.destHeader}>
                  Destino {dest.sort_order}
                </Text>
                <View style={styles.destRow}>
                  <Text style={styles.destLabel}>Dirección</Text>
                  <Text style={styles.destValue}>{dest.delivery_address}</Text>
                </View>
                {dest.delivery_city && (
                  <View style={styles.destRow}>
                    <Text style={styles.destLabel}>Ciudad</Text>
                    <Text style={styles.destValue}>{dest.delivery_city}</Text>
                  </View>
                )}
                {dest.delivery_contact && (
                  <View style={styles.destRow}>
                    <Text style={styles.destLabel}>Contacto</Text>
                    <Text style={styles.destValue}>{dest.delivery_contact}</Text>
                  </View>
                )}
                {dest.delivery_phone && (
                  <View style={styles.destRow}>
                    <Text style={styles.destLabel}>Teléfono</Text>
                    <Text style={styles.destValue}>{dest.delivery_phone}</Text>
                  </View>
                )}
                {dest.delivery_schedule && (
                  <View style={styles.destRow}>
                    <Text style={styles.destLabel}>Horario</Text>
                    <Text style={styles.destValue}>{dest.delivery_schedule}</Text>
                  </View>
                )}
                {dest.dispatch_type && (
                  <View style={styles.destRow}>
                    <Text style={styles.destLabel}>Despacho</Text>
                    <Text style={styles.destValue}>{dest.dispatch_type}</Text>
                  </View>
                )}
                {dest.notes && (
                  <View style={styles.destRow}>
                    <Text style={styles.destLabel}>Notas</Text>
                    <Text style={styles.destValue}>{dest.notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Terms */}
        <View style={styles.termsBox}>
          <Text style={styles.termsTitle}>Condiciones del Pedido</Text>
          <Text style={styles.termsText}>
            {order.payment_terms ? `• Forma de pago: ${order.payment_terms}\n` : ''}
            {`• Tipo de facturación: ${BILLING_TYPE_LABELS[order.billing_type] || order.billing_type}\n`}
            {`• Moneda: ${currency}\n`}
            {order.notes ? `\nObservaciones: ${order.notes}` : ''}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {org.name} - Pedido #{order.order_number}
          </Text>
          <Text style={styles.footerText}>
            Generado el {formatDateForPdf(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
