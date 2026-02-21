import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { ShipmentForPdf, OrgForPdf } from './pdf-types';
import { formatDateForPdf } from './format-currency';

const PRIMARY = '#00C8CF';
const DARK = '#1a1a2e';
const LIGHT_BG = '#f8f8f8';

const DISPATCH_TYPE_LABELS: Record<string, string> = {
  envio: 'Envío',
  retiro: 'Retiro en Bodega',
  mensajeria: 'Mensajería',
};

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
  metaLabel: { fontSize: 8, color: '#999', marginBottom: 1 },
  metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 6 },

  // Info sections
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infoBox: {
    flex: 1,
    border: '1px solid #e0e0e0',
    borderRadius: 4,
    padding: 10,
  },
  infoTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoLabel: { width: 80, fontSize: 8, color: '#666' },
  infoValue: { flex: 1, fontSize: 9 },

  // Table
  table: { marginBottom: 16 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: DARK,
    borderRadius: 4,
    padding: 6,
    marginBottom: 2,
  },
  tableHeaderText: {
    color: 'white',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1px solid #eee',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1px solid #eee',
    backgroundColor: LIGHT_BG,
  },
  colSeq: { width: 30 },
  colSku: { width: 80 },
  colDesc: { flex: 1 },
  colQty: { width: 60, textAlign: 'right' },
  colSerial: { width: 120 },

  // Notes
  notesBox: {
    border: '1px solid #e0e0e0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#666',
    marginBottom: 4,
  },
  notesText: { fontSize: 9, color: '#444', lineHeight: 1.4 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: `1px solid ${PRIMARY}`,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: '#999' },

  // Signature area
  signatureArea: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 40,
  },
  signatureBox: {
    flex: 1,
    borderTop: '1px solid #333',
    paddingTop: 6,
    alignItems: 'center',
  },
  signatureLabel: { fontSize: 8, color: '#666' },
});

interface ShipmentPdfProps {
  shipment: ShipmentForPdf;
  org: OrgForPdf;
}

export function ShipmentPdfTemplate({ shipment, org }: ShipmentPdfProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{org.name}</Text>
            {org.tax_id && (
              <Text style={styles.companyInfo}>NIT: {org.tax_id}</Text>
            )}
            {org.address && (
              <Text style={styles.companyInfo}>{org.address}</Text>
            )}
            {org.city && (
              <Text style={styles.companyInfo}>{org.city}</Text>
            )}
            {org.phone && (
              <Text style={styles.companyInfo}>Tel: {org.phone}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docType}>REMISIÓN</Text>
            <Text style={styles.docNumber}>REM-{shipment.shipment_number}</Text>
            <Text style={styles.metaLabel}>Fecha</Text>
            <Text style={styles.metaValue}>
              {formatDateForPdf(shipment.created_at)}
            </Text>
            <Text style={styles.metaLabel}>Pedido #</Text>
            <Text style={styles.metaValue}>{shipment.order_number}</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          {/* Customer */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Cliente</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Razón Social:</Text>
              <Text style={styles.infoValue}>
                {shipment.customer.business_name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>NIT:</Text>
              <Text style={styles.infoValue}>{shipment.customer.nit}</Text>
            </View>
            {shipment.customer.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValue}>
                  {shipment.customer.phone}
                </Text>
              </View>
            )}
          </View>

          {/* Delivery Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Datos de Entrega</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dirección:</Text>
              <Text style={styles.infoValue}>
                {shipment.delivery_address}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ciudad:</Text>
              <Text style={styles.infoValue}>{shipment.delivery_city}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contacto:</Text>
              <Text style={styles.infoValue}>
                {shipment.delivery_contact}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>
                {shipment.delivery_phone}
              </Text>
            </View>
          </View>
        </View>

        {/* Transport Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Transporte</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo despacho:</Text>
              <Text style={styles.infoValue}>
                {DISPATCH_TYPE_LABELS[shipment.dispatch_type] ||
                  shipment.dispatch_type}
              </Text>
            </View>
            {shipment.carrier && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Transportadora:</Text>
                <Text style={styles.infoValue}>{shipment.carrier}</Text>
              </View>
            )}
            {shipment.tracking_number && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>N° Guía:</Text>
                <Text style={styles.infoValue}>
                  {shipment.tracking_number}
                </Text>
              </View>
            )}
            {shipment.estimated_delivery && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Entrega est.:</Text>
                <Text style={styles.infoValue}>
                  {formatDateForPdf(shipment.estimated_delivery)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colSeq]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.colSku]}>Código</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>
              Descripción
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>
              Cantidad
            </Text>
            <Text style={[styles.tableHeaderText, styles.colSerial]}>
              Seriales
            </Text>
          </View>

          {shipment.items.map((item, idx) => (
            <View
              key={idx}
              style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.colSeq}>{idx + 1}</Text>
              <Text style={styles.colSku}>{item.sku}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity_shipped}</Text>
              <Text style={styles.colSerial}>
                {item.serial_numbers?.join(', ') || '—'}
              </Text>
            </View>
          ))}
        </View>

        {/* Notes */}
        {shipment.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Observaciones</Text>
            <Text style={styles.notesText}>{shipment.notes}</Text>
          </View>
        )}

        {/* Signature Area */}
        <View style={styles.signatureArea}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Entregado por</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Recibido por</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>
              Cédula / Nombre Receptor
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {org.name} — Remisión REM-{shipment.shipment_number}
          </Text>
          <Text style={styles.footerText}>
            Generado el {formatDateForPdf(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
