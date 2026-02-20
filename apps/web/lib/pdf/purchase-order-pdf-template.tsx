import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { PurchaseOrderForPdf, OrgForPdf } from './pdf-types';
import { formatCurrencyForPdf, formatDateForPdf } from './format-currency';

const PRIMARY = '#00C8CF';
const DARK = '#1a1a2e';
const LIGHT_BG = '#f8f8f8';

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
  supplierSection: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: LIGHT_BG,
    padding: 12,
    borderRadius: 4,
  },
  supplierCol: { flex: 1 },
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
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: '0.5px solid #e0e0e0',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  colSku: { width: '15%' },
  colDesc: { width: '35%' },
  colQty: { width: '15%', textAlign: 'center' },
  colUnitCost: { width: '17%', textAlign: 'right' },
  colSubtotal: { width: '18%', textAlign: 'right' },
  totalSection: {
    marginTop: 10,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 3,
  },
  totalLabel: { fontSize: 9, color: '#666', width: 100, textAlign: 'right', marginRight: 12 },
  totalValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', width: 100, textAlign: 'right' },
  grandTotalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: DARK, width: 100, textAlign: 'right', marginRight: 12 },
  grandTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: PRIMARY, width: 100, textAlign: 'right' },
  notesSection: {
    marginTop: 16,
    padding: 10,
    backgroundColor: LIGHT_BG,
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: `1px solid ${PRIMARY}`,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: '#999' },
});

interface Props {
  po: PurchaseOrderForPdf;
  org: OrgForPdf;
}

export function PurchaseOrderPdfTemplate({ po, org }: Props) {
  const currency = po.currency || 'COP';

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
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docType}>ORDEN DE COMPRA</Text>
            <Text style={styles.docNumber}>OC-{po.po_number}</Text>
            <Text style={styles.docDate}>Fecha: {formatDateForPdf(po.created_at)}</Text>
            <Text style={styles.docDate}>Pedido #{po.order_number}</Text>
            {po.expected_delivery_date && (
              <Text style={styles.docDate}>
                Entrega esperada: {formatDateForPdf(po.expected_delivery_date)}
              </Text>
            )}
          </View>
        </View>

        {/* Supplier Info */}
        <View style={styles.supplierSection}>
          <View style={styles.supplierCol}>
            <Text style={styles.sectionTitle}>Proveedor</Text>
            <Text style={styles.infoLabel}>Razón Social</Text>
            <Text style={styles.infoValue}>{po.supplier.name}</Text>
            {po.supplier.nit && (
              <>
                <Text style={styles.infoLabel}>NIT</Text>
                <Text style={styles.infoValue}>{po.supplier.nit}</Text>
              </>
            )}
          </View>
          <View style={styles.supplierCol}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            {po.supplier.address && (
              <>
                <Text style={styles.infoLabel}>Dirección</Text>
                <Text style={styles.infoValue}>{po.supplier.address}</Text>
              </>
            )}
            {po.supplier.city && (
              <>
                <Text style={styles.infoLabel}>Ciudad</Text>
                <Text style={styles.infoValue}>{po.supplier.city}</Text>
              </>
            )}
            {po.supplier.phone && (
              <>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{po.supplier.phone}</Text>
              </>
            )}
            {po.supplier.email && (
              <>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{po.supplier.email}</Text>
              </>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colSku]}>Código</Text>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Descripción</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Cantidad</Text>
          <Text style={[styles.tableHeaderText, styles.colUnitCost]}>Costo Unit.</Text>
          <Text style={[styles.tableHeaderText, styles.colSubtotal]}>Subtotal</Text>
        </View>

        {po.items.map((item, idx) => (
          <View
            key={idx}
            style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
          >
            <Text style={[{ fontSize: 8 }, styles.colSku]}>{item.sku}</Text>
            <Text style={[{ fontSize: 8 }, styles.colDesc]}>{item.description}</Text>
            <Text style={[{ fontSize: 8 }, styles.colQty]}>{item.quantity_ordered}</Text>
            <Text style={[{ fontSize: 8 }, styles.colUnitCost]}>
              {formatCurrencyForPdf(item.unit_cost, currency)}
            </Text>
            <Text style={[{ fontSize: 8 }, styles.colSubtotal]}>
              {formatCurrencyForPdf(item.subtotal, currency)}
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrencyForPdf(po.subtotal, currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA (19%)</Text>
            <Text style={styles.totalValue}>{formatCurrencyForPdf(po.tax_amount, currency)}</Text>
          </View>
          <View style={[styles.totalRow, { borderTop: '1px solid #333', paddingTop: 4 }]}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>{formatCurrencyForPdf(po.total, currency)}</Text>
          </View>
        </View>

        {/* Notes */}
        {po.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <Text style={{ fontSize: 8 }}>{po.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{org.name}</Text>
          <Text style={styles.footerText}>
            Generado el {formatDateForPdf(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
