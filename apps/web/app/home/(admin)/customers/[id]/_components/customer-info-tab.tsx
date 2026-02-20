'use client';

import { motion } from 'motion/react';
import { Building2, Mail, MapPin, Phone, CreditCard, User, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { useCustomerContacts } from '../../_lib/customer-queries';
import type { Customer } from '../../_lib/types';

interface CustomerInfoTabProps {
  customer: Customer;
}

export function CustomerInfoTab({ customer }: CustomerInfoTabProps) {
  const { data: contactsData } = useCustomerContacts(customer.id);
  const contacts = contactsData?.data || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Razón Social" value={customer.business_name} />
          <InfoRow label="NIT" value={customer.nit} mono />
          <InfoRow label="Industria" value={customer.notes} />
          <InfoRow
            label="Dirección"
            value={customer.address}
            icon={<MapPin className="h-3.5 w-3.5" />}
          />
          <InfoRow label="Ciudad" value={customer.city} />
          <InfoRow label="Departamento" value={customer.department} />
        </CardContent>
      </Card>

      {/* Contacto y Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Contacto y Condiciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow
            label="Teléfono"
            value={customer.phone}
            icon={<Phone className="h-3.5 w-3.5" />}
          />
          <InfoRow
            label="Email"
            value={customer.email}
            icon={<Mail className="h-3.5 w-3.5" />}
          />
          <InfoRow label="Forma de Pago" value={formatPaymentTerms(customer.payment_terms)} />
          <InfoRow
            label="Asesor Asignado"
            value={customer.assigned_advisor?.full_name || 'Sin asignar'}
            icon={<User className="h-3.5 w-3.5" />}
          />
          <InfoRow
            label="Última Interacción"
            value={customer.last_interaction_at
              ? new Date(customer.last_interaction_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
              : 'Sin registros'}
            icon={<Calendar className="h-3.5 w-3.5" />}
          />
          <InfoRow
            label="Fecha Creación"
            value={new Date(customer.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
          />
        </CardContent>
      </Card>

      {/* Contactos */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Contactos ({contacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay contactos registrados</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="rounded-lg border p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{contact.full_name}</p>
                    {contact.is_primary && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                  </div>
                  {contact.position && (
                    <p className="text-xs text-muted-foreground">{contact.position}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notas */}
      {customer.notes && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function InfoRow({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm text-right ${mono ? 'font-mono' : ''} ${!value ? 'text-muted-foreground' : ''}`}>
        {icon && value ? (
          <span className="flex items-center gap-1.5">
            {icon}
            {value}
          </span>
        ) : (
          value || '-'
        )}
      </span>
    </div>
  );
}

function formatPaymentTerms(terms?: string): string {
  const map: Record<string, string> = {
    contado: 'Contado',
    '15_dias': '15 días',
    '30_dias': '30 días',
    '45_dias': '45 días',
    '60_dias': '60 días',
    '90_dias': '90 días',
  };
  return terms ? map[terms] || terms : '-';
}
