export interface Lead {
  id: string;
  organization_id: string;
  lead_number: number;
  business_name: string;
  nit: string | null;
  contact_name: string;
  phone: string;
  email: string;
  requirement: string;
  channel: 'whatsapp' | 'web' | 'manual';
  status: 'created' | 'pending_assignment' | 'assigned' | 'converted' | 'rejected' | 'pending_info';
  rejection_reason_id: string | null;
  rejection_notes: string | null;
  customer_id: string | null;
  assigned_to: string | null;
  assigned_at: string | null;
  assigned_by: string | null;
  converted_at: string | null;
  lead_date: string;
  source_conversation_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  assigned_user?: {
    id: string;
    display_name: string;
    email: string;
  };
}

export interface LeadFilters {
  status?: string;
  search?: string;
  assigned_to?: string;
  channel?: string;
}

export interface LeadFormData {
  business_name: string;
  nit?: string;
  contact_name: string;
  phone: string;
  email: string;
  requirement: string;
  channel: 'whatsapp' | 'web' | 'manual';
}
