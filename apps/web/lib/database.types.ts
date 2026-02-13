export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          email: string | null;
          id: string;
          name: string;
          picture_url: string | null;
          public_data: Json;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          picture_url?: string | null;
          public_data?: Json;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          picture_url?: string | null;
          public_data?: Json;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          changes: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          changes?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          changes?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          organization_id: string;
          entity_type: string;
          entity_id: string;
          author_id: string;
          content: string;
          mentions: string[] | null;
          parent_id: string | null;
          is_internal: boolean;
          attachments: Json | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          entity_type: string;
          entity_id: string;
          author_id: string;
          content: string;
          mentions?: string[] | null;
          parent_id?: string | null;
          is_internal?: boolean;
          attachments?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          entity_type?: string;
          entity_id?: string;
          author_id?: string;
          content?: string;
          mentions?: string[] | null;
          parent_id?: string | null;
          is_internal?: boolean;
          attachments?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'comments';
            referencedColumns: ['id'];
          },
        ];
      };
      consecutive_counters: {
        Row: {
          id: string;
          organization_id: string;
          entity_type: string;
          prefix: string | null;
          current_value: number;
          start_value: number;
          increment: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          entity_type: string;
          prefix?: string | null;
          current_value: number;
          start_value: number;
          increment?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          entity_type?: string;
          prefix?: string | null;
          current_value?: number;
          start_value?: number;
          increment?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'consecutive_counters_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      customer_contacts: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          position: string | null;
          is_primary: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          position?: string | null;
          is_primary?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          position?: string | null;
          is_primary?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_contacts_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customer_contacts_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          organization_id: string;
          business_name: string;
          nit: string;
          industry: string | null;
          address: string | null;
          city: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          credit_limit: number;
          credit_available: number;
          credit_status: string;
          payment_terms: string | null;
          outstanding_balance: number;
          is_blocked: boolean;
          block_reason: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          business_name: string;
          nit: string;
          industry?: string | null;
          address?: string | null;
          city?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          credit_limit?: number;
          credit_available?: number;
          credit_status?: string;
          payment_terms?: string | null;
          outstanding_balance?: number;
          is_blocked?: boolean;
          block_reason?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          business_name?: string;
          nit?: string;
          industry?: string | null;
          address?: string | null;
          city?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          credit_limit?: number;
          credit_available?: number;
          credit_status?: string;
          payment_terms?: string | null;
          outstanding_balance?: number;
          is_blocked?: boolean;
          block_reason?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      dashboard_widgets: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          widget_type: string;
          position: number;
          config: Json;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          widget_type: string;
          position?: number;
          config?: Json;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          widget_type?: string;
          position?: number;
          config?: Json;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dashboard_widgets_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dashboard_widgets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      email_logs: {
        Row: {
          id: string;
          organization_id: string;
          to_email: string;
          to_name: string | null;
          from_email: string;
          subject: string;
          template_id: string | null;
          entity_type: string | null;
          entity_id: string | null;
          status: string;
          sendgrid_message_id: string | null;
          error_message: string | null;
          metadata: Json | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          to_email: string;
          to_name?: string | null;
          from_email: string;
          subject: string;
          template_id?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          status?: string;
          sendgrid_message_id?: string | null;
          error_message?: string | null;
          metadata?: Json | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          to_email?: string;
          to_name?: string | null;
          from_email?: string;
          subject?: string;
          template_id?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          status?: string;
          sendgrid_message_id?: string | null;
          error_message?: string | null;
          metadata?: Json | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'email_logs_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          order_item_id: string | null;
          sku: string;
          description: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          tax_amount: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          order_item_id?: string | null;
          sku: string;
          description: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          tax_amount?: number;
          total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          order_item_id?: string | null;
          sku?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invoice_items_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoice_items_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          organization_id: string;
          invoice_number: string;
          order_id: string;
          customer_id: string;
          invoice_date: string;
          due_date: string | null;
          currency: string;
          subtotal: number;
          tax_amount: number;
          total: number;
          status: string;
          payment_date: string | null;
          payment_method: string | null;
          payment_reference: string | null;
          document_url: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          invoice_number: string;
          order_id: string;
          customer_id: string;
          invoice_date: string;
          due_date?: string | null;
          currency?: string;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          status?: string;
          payment_date?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          document_url?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          invoice_number?: string;
          order_id?: string;
          customer_id?: string;
          invoice_date?: string;
          due_date?: string | null;
          currency?: string;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          status?: string;
          payment_date?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          document_url?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
        ];
      };
      lead_assignments_log: {
        Row: {
          id: string;
          organization_id: string;
          lead_id: string;
          from_user_id: string | null;
          to_user_id: string;
          assignment_type: string;
          reason: string | null;
          performed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_id: string;
          from_user_id?: string | null;
          to_user_id: string;
          assignment_type: string;
          reason?: string | null;
          performed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_id?: string;
          from_user_id?: string | null;
          to_user_id?: string;
          assignment_type?: string;
          reason?: string | null;
          performed_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_assignments_log_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_assignments_log_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_assignments_log_from_user_id_fkey';
            columns: ['from_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_assignments_log_to_user_id_fkey';
            columns: ['to_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      lead_contacts: {
        Row: {
          id: string;
          lead_id: string;
          organization_id: string;
          contact_name: string;
          position: string | null;
          phone: string | null;
          email: string | null;
          is_primary: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          organization_id: string;
          contact_name: string;
          position?: string | null;
          phone?: string | null;
          email?: string | null;
          is_primary?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          organization_id?: string;
          contact_name?: string;
          position?: string | null;
          phone?: string | null;
          email?: string | null;
          is_primary?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_contacts_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_contacts_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          organization_id: string;
          lead_number: number;
          business_name: string;
          nit: string | null;
          contact_name: string;
          phone: string;
          email: string;
          requirement: string;
          channel: string;
          status: string;
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
        };
        Insert: {
          id?: string;
          organization_id: string;
          lead_number: number;
          business_name: string;
          nit?: string | null;
          contact_name: string;
          phone: string;
          email: string;
          requirement: string;
          channel: string;
          status?: string;
          rejection_reason_id?: string | null;
          rejection_notes?: string | null;
          customer_id?: string | null;
          assigned_to?: string | null;
          assigned_at?: string | null;
          assigned_by?: string | null;
          converted_at?: string | null;
          lead_date?: string;
          source_conversation_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lead_number?: number;
          business_name?: string;
          nit?: string | null;
          contact_name?: string;
          phone?: string;
          email?: string;
          requirement?: string;
          channel?: string;
          status?: string;
          rejection_reason_id?: string | null;
          rejection_notes?: string | null;
          customer_id?: string | null;
          assigned_to?: string | null;
          assigned_at?: string | null;
          assigned_by?: string | null;
          converted_at?: string | null;
          lead_date?: string;
          source_conversation_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'leads_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_leads_rejection_reason';
            columns: ['rejection_reason_id'];
            isOneToOne: false;
            referencedRelation: 'rejection_reasons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'leads_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'leads_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_leads_source_conversation';
            columns: ['source_conversation_id'];
            isOneToOne: false;
            referencedRelation: 'whatsapp_conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      license_records: {
        Row: {
          id: string;
          organization_id: string;
          order_id: string;
          order_item_id: string;
          product_id: string | null;
          license_type: string;
          license_key: string | null;
          vendor: string | null;
          activation_date: string | null;
          expiry_date: string | null;
          renewal_date: string | null;
          seats: number | null;
          status: string;
          activation_notes: string | null;
          end_user_name: string | null;
          end_user_email: string | null;
          document_url: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          order_id: string;
          order_item_id: string;
          product_id?: string | null;
          license_type: string;
          license_key?: string | null;
          vendor?: string | null;
          activation_date?: string | null;
          expiry_date?: string | null;
          renewal_date?: string | null;
          seats?: number | null;
          status?: string;
          activation_notes?: string | null;
          end_user_name?: string | null;
          end_user_email?: string | null;
          document_url?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          order_id?: string;
          order_item_id?: string;
          product_id?: string | null;
          license_type?: string;
          license_key?: string | null;
          vendor?: string | null;
          activation_date?: string | null;
          expiry_date?: string | null;
          renewal_date?: string | null;
          seats?: number | null;
          status?: string;
          activation_notes?: string | null;
          end_user_name?: string | null;
          end_user_email?: string | null;
          document_url?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'license_records_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'license_records_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'license_records_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'license_records_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      margin_rules: {
        Row: {
          id: string;
          organization_id: string;
          category_id: string | null;
          payment_type: string;
          min_margin_pct: number;
          target_margin_pct: number;
          max_discount_pct: number;
          requires_approval_below: number;
          approval_role_slug: string;
          is_active: boolean;
          effective_from: string;
          effective_until: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          category_id?: string | null;
          payment_type: string;
          min_margin_pct: number;
          target_margin_pct: number;
          max_discount_pct?: number;
          requires_approval_below: number;
          approval_role_slug?: string;
          is_active?: boolean;
          effective_from?: string;
          effective_until?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          category_id?: string | null;
          payment_type?: string;
          min_margin_pct?: number;
          target_margin_pct?: number;
          max_discount_pct?: number;
          requires_approval_below?: number;
          approval_role_slug?: string;
          is_active?: boolean;
          effective_from?: string;
          effective_until?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'margin_rules_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'margin_rules_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'product_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          action_url: string | null;
          entity_type: string | null;
          entity_id: string | null;
          is_read: boolean;
          read_at: string | null;
          priority: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          action_url?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          priority?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          action_url?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          priority?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      order_documents: {
        Row: {
          id: string;
          organization_id: string;
          order_id: string;
          document_type: string;
          file_name: string;
          file_url: string;
          file_size: number | null;
          mime_type: string | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          order_id: string;
          document_type: string;
          file_name: string;
          file_url: string;
          file_size?: number | null;
          mime_type?: string | null;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          order_id?: string;
          document_type?: string;
          file_name?: string;
          file_url?: string;
          file_size?: number | null;
          mime_type?: string | null;
          uploaded_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_documents_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_documents_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          quote_item_id: string | null;
          product_id: string | null;
          sku: string;
          description: string;
          quantity: number;
          quantity_purchased: number;
          quantity_received: number;
          quantity_dispatched: number;
          quantity_delivered: number;
          unit_price: number;
          subtotal: number;
          tax_amount: number;
          total: number;
          item_status: string;
          is_license: boolean;
          license_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          quote_item_id?: string | null;
          product_id?: string | null;
          sku: string;
          description: string;
          quantity: number;
          quantity_purchased?: number;
          quantity_received?: number;
          quantity_dispatched?: number;
          quantity_delivered?: number;
          unit_price: number;
          subtotal: number;
          tax_amount?: number;
          total: number;
          item_status?: string;
          is_license?: boolean;
          license_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          quote_item_id?: string | null;
          product_id?: string | null;
          sku?: string;
          description?: string;
          quantity?: number;
          quantity_purchased?: number;
          quantity_received?: number;
          quantity_dispatched?: number;
          quantity_delivered?: number;
          unit_price?: number;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          item_status?: string;
          is_license?: boolean;
          license_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_order_items_quote_item';
            columns: ['quote_item_id'];
            isOneToOne: false;
            referencedRelation: 'quote_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      order_pending_tasks: {
        Row: {
          id: string;
          organization_id: string;
          order_id: string;
          order_item_id: string | null;
          task_type: string;
          title: string;
          description: string | null;
          priority: string;
          traffic_light: string;
          due_date: string | null;
          assigned_to: string | null;
          status: string;
          completed_at: string | null;
          completed_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          order_id: string;
          order_item_id?: string | null;
          task_type: string;
          title: string;
          description?: string | null;
          priority?: string;
          traffic_light?: string;
          due_date?: string | null;
          assigned_to?: string | null;
          status?: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          order_id?: string;
          order_item_id?: string | null;
          task_type?: string;
          title?: string;
          description?: string | null;
          priority?: string;
          traffic_light?: string;
          due_date?: string | null;
          assigned_to?: string | null;
          status?: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_pending_tasks_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_pending_tasks_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_pending_tasks_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_pending_tasks_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string;
          notes: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          from_status?: string | null;
          to_status: string;
          changed_by: string;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          from_status?: string | null;
          to_status?: string;
          changed_by?: string;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_status_history_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          organization_id: string;
          order_number: number;
          quote_id: string;
          customer_id: string;
          advisor_id: string;
          status: string;
          payment_status: string;
          payment_terms: string;
          requires_advance_billing: boolean;
          currency: string;
          subtotal: number;
          tax_amount: number;
          total: number;
          delivery_date: string | null;
          delivery_address: string | null;
          delivery_city: string | null;
          delivery_contact: string | null;
          delivery_phone: string | null;
          delivery_schedule: string | null;
          dispatch_type: string | null;
          notes: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          order_number: number;
          quote_id: string;
          customer_id: string;
          advisor_id: string;
          status?: string;
          payment_status?: string;
          payment_terms: string;
          requires_advance_billing?: boolean;
          currency?: string;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          delivery_date?: string | null;
          delivery_address?: string | null;
          delivery_city?: string | null;
          delivery_contact?: string | null;
          delivery_phone?: string | null;
          delivery_schedule?: string | null;
          dispatch_type?: string | null;
          notes?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          order_number?: number;
          quote_id?: string;
          customer_id?: string;
          advisor_id?: string;
          status?: string;
          payment_status?: string;
          payment_terms?: string;
          requires_advance_billing?: boolean;
          currency?: string;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          delivery_date?: string | null;
          delivery_address?: string | null;
          delivery_city?: string | null;
          delivery_contact?: string | null;
          delivery_phone?: string | null;
          delivery_schedule?: string | null;
          dispatch_type?: string | null;
          notes?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_quote_id_fkey';
            columns: ['quote_id'];
            isOneToOne: false;
            referencedRelation: 'quotes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_advisor_id_fkey';
            columns: ['advisor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          nit: string;
          logo_url: string | null;
          domain: string | null;
          plan: string;
          settings: Json;
          max_users: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          nit: string;
          logo_url?: string | null;
          domain?: string | null;
          plan?: string;
          settings?: Json;
          max_users?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          nit?: string;
          logo_url?: string | null;
          domain?: string | null;
          plan?: string;
          settings?: Json;
          max_users?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          id: string;
          module: string;
          action: string;
          slug: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          module: string;
          action: string;
          slug: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          module?: string;
          action?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      product_categories: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          level: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          parent_id?: string | null;
          level?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          parent_id?: string | null;
          level?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_categories_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'product_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      product_route_events: {
        Row: {
          id: string;
          organization_id: string;
          order_id: string;
          order_item_id: string;
          event_type: string;
          event_date: string;
          location: string | null;
          quantity: number | null;
          performed_by: string | null;
          reference_type: string | null;
          reference_id: string | null;
          notes: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          order_id: string;
          order_item_id: string;
          event_type: string;
          event_date?: string;
          location?: string | null;
          quantity?: number | null;
          performed_by?: string | null;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          order_id?: string;
          order_item_id?: string;
          event_type?: string;
          event_date?: string;
          location?: string | null;
          quantity?: number | null;
          performed_by?: string | null;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_route_events_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_route_events_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'product_route_events_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          organization_id: string;
          sku: string;
          name: string;
          description: string | null;
          category_id: string | null;
          brand: string | null;
          unit_cost_usd: number;
          unit_cost_cop: number;
          suggested_price_cop: number | null;
          currency: string;
          is_service: boolean;
          is_license: boolean;
          requires_activation: boolean;
          warranty_months: number | null;
          is_active: boolean;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          sku: string;
          name: string;
          description?: string | null;
          category_id?: string | null;
          brand?: string | null;
          unit_cost_usd?: number;
          unit_cost_cop?: number;
          suggested_price_cop?: number | null;
          currency?: string;
          is_service?: boolean;
          is_license?: boolean;
          requires_activation?: boolean;
          warranty_months?: number | null;
          is_active?: boolean;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          sku?: string;
          name?: string;
          description?: string | null;
          category_id?: string | null;
          brand?: string | null;
          unit_cost_usd?: number;
          unit_cost_cop?: number;
          suggested_price_cop?: number | null;
          currency?: string;
          is_service?: boolean;
          is_license?: boolean;
          requires_activation?: boolean;
          warranty_months?: number | null;
          is_active?: boolean;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'product_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          area: string | null;
          position: string | null;
          is_active: boolean;
          is_available: boolean;
          max_pending_leads: number;
          preferences: Json;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          area?: string | null;
          position?: string | null;
          is_active?: boolean;
          is_available?: boolean;
          max_pending_leads?: number;
          preferences?: Json;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          area?: string | null;
          position?: string | null;
          is_active?: boolean;
          is_available?: boolean;
          max_pending_leads?: number;
          preferences?: Json;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      purchase_order_items: {
        Row: {
          id: string;
          purchase_order_id: string;
          order_item_id: string;
          product_id: string | null;
          sku: string;
          description: string;
          quantity_ordered: number;
          quantity_received: number;
          unit_cost: number;
          subtotal: number;
          status: string;
          received_at: string | null;
          received_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          order_item_id: string;
          product_id?: string | null;
          sku: string;
          description: string;
          quantity_ordered: number;
          quantity_received?: number;
          unit_cost: number;
          subtotal: number;
          status?: string;
          received_at?: string | null;
          received_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          purchase_order_id?: string;
          order_item_id?: string;
          product_id?: string | null;
          sku?: string;
          description?: string;
          quantity_ordered?: number;
          quantity_received?: number;
          unit_cost?: number;
          subtotal?: number;
          status?: string;
          received_at?: string | null;
          received_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'purchase_order_items_purchase_order_id_fkey';
            columns: ['purchase_order_id'];
            isOneToOne: false;
            referencedRelation: 'purchase_orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_order_items_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      purchase_orders: {
        Row: {
          id: string;
          organization_id: string;
          po_number: number;
          order_id: string;
          supplier_id: string;
          status: string;
          currency: string;
          trm_applied: number | null;
          subtotal: number;
          tax_amount: number;
          total: number;
          expected_delivery_date: string | null;
          actual_delivery_date: string | null;
          notes: string | null;
          document_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          po_number: number;
          order_id: string;
          supplier_id: string;
          status?: string;
          currency?: string;
          trm_applied?: number | null;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          expected_delivery_date?: string | null;
          actual_delivery_date?: string | null;
          notes?: string | null;
          document_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          po_number?: number;
          order_id?: string;
          supplier_id?: string;
          status?: string;
          currency?: string;
          trm_applied?: number | null;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          expected_delivery_date?: string | null;
          actual_delivery_date?: string | null;
          notes?: string | null;
          document_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'purchase_orders_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_orders_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchase_orders_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'suppliers';
            referencedColumns: ['id'];
          },
        ];
      };
      quote_approvals: {
        Row: {
          id: string;
          organization_id: string;
          quote_id: string;
          requested_by: string;
          requested_at: string;
          current_margin_pct: number;
          min_margin_required: number;
          justification: string | null;
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          quote_id: string;
          requested_by: string;
          requested_at?: string;
          current_margin_pct: number;
          min_margin_required: number;
          justification?: string | null;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          quote_id?: string;
          requested_by?: string;
          requested_at?: string;
          current_margin_pct?: number;
          min_margin_required?: number;
          justification?: string | null;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quote_approvals_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quote_approvals_quote_id_fkey';
            columns: ['quote_id'];
            isOneToOne: false;
            referencedRelation: 'quotes';
            referencedColumns: ['id'];
          },
        ];
      };
      quote_follow_ups: {
        Row: {
          id: string;
          organization_id: string;
          quote_id: string;
          follow_up_type: string;
          scheduled_at: string;
          executed_at: string | null;
          channel: string;
          message: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          quote_id: string;
          follow_up_type: string;
          scheduled_at: string;
          executed_at?: string | null;
          channel?: string;
          message?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          quote_id?: string;
          follow_up_type?: string;
          scheduled_at?: string;
          executed_at?: string | null;
          channel?: string;
          message?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quote_follow_ups_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quote_follow_ups_quote_id_fkey';
            columns: ['quote_id'];
            isOneToOne: false;
            referencedRelation: 'quotes';
            referencedColumns: ['id'];
          },
        ];
      };
      quote_items: {
        Row: {
          id: string;
          quote_id: string;
          product_id: string | null;
          sort_order: number;
          sku: string;
          description: string;
          quantity: number;
          unit_price: number;
          discount_pct: number;
          discount_amount: number;
          tax_pct: number;
          tax_amount: number;
          subtotal: number;
          total: number;
          cost_price: number;
          margin_pct: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          product_id?: string | null;
          sort_order?: number;
          sku: string;
          description: string;
          quantity?: number;
          unit_price: number;
          discount_pct?: number;
          discount_amount?: number;
          tax_pct?: number;
          tax_amount?: number;
          subtotal?: number;
          total?: number;
          cost_price?: number;
          margin_pct?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          product_id?: string | null;
          sort_order?: number;
          sku?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          discount_pct?: number;
          discount_amount?: number;
          tax_pct?: number;
          tax_amount?: number;
          subtotal?: number;
          total?: number;
          cost_price?: number;
          margin_pct?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'quote_items_quote_id_fkey';
            columns: ['quote_id'];
            isOneToOne: false;
            referencedRelation: 'quotes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quote_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      quotes: {
        Row: {
          id: string;
          organization_id: string;
          quote_number: number;
          lead_id: string | null;
          customer_id: string;
          contact_id: string | null;
          advisor_id: string;
          quote_date: string;
          validity_days: number;
          expires_at: string;
          status: string;
          currency: string;
          trm_applied: number | null;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          transport_cost: number;
          transport_included: boolean;
          total: number;
          margin_pct: number | null;
          margin_approved: boolean;
          margin_approved_by: string | null;
          margin_approved_at: string | null;
          payment_terms: string;
          credit_validated: boolean;
          credit_validation_result: Json | null;
          proforma_url: string | null;
          proforma_generated_at: string | null;
          sent_to_client: boolean;
          sent_at: string | null;
          sent_via: string | null;
          loss_reason: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          quote_number: number;
          lead_id?: string | null;
          customer_id: string;
          contact_id?: string | null;
          advisor_id: string;
          quote_date?: string;
          validity_days?: number;
          expires_at: string;
          status?: string;
          currency?: string;
          trm_applied?: number | null;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          transport_cost?: number;
          transport_included?: boolean;
          total?: number;
          margin_pct?: number | null;
          margin_approved?: boolean;
          margin_approved_by?: string | null;
          margin_approved_at?: string | null;
          payment_terms: string;
          credit_validated?: boolean;
          credit_validation_result?: Json | null;
          proforma_url?: string | null;
          proforma_generated_at?: string | null;
          sent_to_client?: boolean;
          sent_at?: string | null;
          sent_via?: string | null;
          loss_reason?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          quote_number?: number;
          lead_id?: string | null;
          customer_id?: string;
          contact_id?: string | null;
          advisor_id?: string;
          quote_date?: string;
          validity_days?: number;
          expires_at?: string;
          status?: string;
          currency?: string;
          trm_applied?: number | null;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          transport_cost?: number;
          transport_included?: boolean;
          total?: number;
          margin_pct?: number | null;
          margin_approved?: boolean;
          margin_approved_by?: string | null;
          margin_approved_at?: string | null;
          payment_terms?: string;
          credit_validated?: boolean;
          credit_validation_result?: Json | null;
          proforma_url?: string | null;
          proforma_generated_at?: string | null;
          sent_to_client?: boolean;
          sent_at?: string | null;
          sent_via?: string | null;
          loss_reason?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'quotes_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quotes_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quotes_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'fk_quotes_contact';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'customer_contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quotes_advisor_id_fkey';
            columns: ['advisor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      rejection_reasons: {
        Row: {
          id: string;
          organization_id: string;
          entity_type: string;
          label: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          entity_type: string;
          label: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          entity_type?: string;
          label?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rejection_reasons_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      role_permissions: {
        Row: {
          id: string;
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          permission_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          role_id?: string;
          permission_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'role_permissions_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'role_permissions_permission_id_fkey';
            columns: ['permission_id'];
            isOneToOne: false;
            referencedRelation: 'permissions';
            referencedColumns: ['id'];
          },
        ];
      };
      roles: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          description: string | null;
          is_system: boolean;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          description?: string | null;
          is_system?: boolean;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          is_system?: boolean;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'roles_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_reports: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          name: string;
          report_type: string;
          filters: Json;
          columns: Json | null;
          is_shared: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          name: string;
          report_type: string;
          filters?: Json;
          columns?: Json | null;
          is_shared?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          name?: string;
          report_type?: string;
          filters?: Json;
          columns?: Json | null;
          is_shared?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_reports_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_reports_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      shipment_items: {
        Row: {
          id: string;
          shipment_id: string;
          order_item_id: string;
          quantity_shipped: number;
          serial_numbers: string[] | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          order_item_id: string;
          quantity_shipped: number;
          serial_numbers?: string[] | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shipment_id?: string;
          order_item_id?: string;
          quantity_shipped?: number;
          serial_numbers?: string[] | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shipment_items_shipment_id_fkey';
            columns: ['shipment_id'];
            isOneToOne: false;
            referencedRelation: 'shipments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipment_items_order_item_id_fkey';
            columns: ['order_item_id'];
            isOneToOne: false;
            referencedRelation: 'order_items';
            referencedColumns: ['id'];
          },
        ];
      };
      shipments: {
        Row: {
          id: string;
          organization_id: string;
          shipment_number: number;
          order_id: string;
          status: string;
          dispatch_type: string;
          carrier: string | null;
          tracking_number: string | null;
          tracking_url: string | null;
          delivery_address: string;
          delivery_city: string;
          delivery_contact: string;
          delivery_phone: string;
          estimated_delivery: string | null;
          actual_delivery: string | null;
          dispatched_at: string | null;
          dispatched_by: string | null;
          received_by_name: string | null;
          reception_notes: string | null;
          proof_of_delivery_url: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          shipment_number: number;
          order_id: string;
          status?: string;
          dispatch_type: string;
          carrier?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          delivery_address: string;
          delivery_city: string;
          delivery_contact: string;
          delivery_phone: string;
          estimated_delivery?: string | null;
          actual_delivery?: string | null;
          dispatched_at?: string | null;
          dispatched_by?: string | null;
          received_by_name?: string | null;
          reception_notes?: string | null;
          proof_of_delivery_url?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          shipment_number?: number;
          order_id?: string;
          status?: string;
          dispatch_type?: string;
          carrier?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          delivery_address?: string;
          delivery_city?: string;
          delivery_contact?: string;
          delivery_phone?: string;
          estimated_delivery?: string | null;
          actual_delivery?: string | null;
          dispatched_at?: string | null;
          dispatched_by?: string | null;
          received_by_name?: string | null;
          reception_notes?: string | null;
          proof_of_delivery_url?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shipments_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipments_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      suppliers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          nit: string | null;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          country: string;
          payment_terms: string | null;
          lead_time_days: number | null;
          rating: number | null;
          is_active: boolean;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          nit?: string | null;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string;
          payment_terms?: string | null;
          lead_time_days?: number | null;
          rating?: number | null;
          is_active?: boolean;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          nit?: string | null;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string;
          payment_terms?: string | null;
          lead_time_days?: number | null;
          rating?: number | null;
          is_active?: boolean;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'suppliers_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      system_settings: {
        Row: {
          id: string;
          organization_id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          key: string;
          value: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'system_settings_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      trm_rates: {
        Row: {
          id: string;
          organization_id: string;
          rate_date: string;
          rate_value: number;
          source: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          rate_date: string;
          rate_value: number;
          source?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          rate_date?: string;
          rate_value?: number;
          source?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trm_rates_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_roles_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['id'];
          },
        ];
      };
      whatsapp_accounts: {
        Row: {
          id: string;
          organization_id: string;
          waba_id: string;
          phone_number_id: string;
          display_phone: string;
          business_name: string;
          access_token: string;
          token_expires_at: string | null;
          webhook_verify_token: string;
          status: string;
          quality_rating: string | null;
          messaging_limit: string | null;
          setup_completed_at: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          waba_id: string;
          phone_number_id: string;
          display_phone: string;
          business_name: string;
          access_token: string;
          token_expires_at?: string | null;
          webhook_verify_token: string;
          status?: string;
          quality_rating?: string | null;
          messaging_limit?: string | null;
          setup_completed_at?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          waba_id?: string;
          phone_number_id?: string;
          display_phone?: string;
          business_name?: string;
          access_token?: string;
          token_expires_at?: string | null;
          webhook_verify_token?: string;
          status?: string;
          quality_rating?: string | null;
          messaging_limit?: string | null;
          setup_completed_at?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'whatsapp_accounts_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      whatsapp_conversations: {
        Row: {
          id: string;
          organization_id: string;
          whatsapp_account_id: string;
          wa_conversation_id: string | null;
          customer_phone: string;
          customer_name: string | null;
          customer_id: string | null;
          lead_id: string | null;
          assigned_agent_id: string | null;
          status: string;
          conversation_type: string;
          intent: string | null;
          last_message_at: string | null;
          closed_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          whatsapp_account_id: string;
          wa_conversation_id?: string | null;
          customer_phone: string;
          customer_name?: string | null;
          customer_id?: string | null;
          lead_id?: string | null;
          assigned_agent_id?: string | null;
          status?: string;
          conversation_type?: string;
          intent?: string | null;
          last_message_at?: string | null;
          closed_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          whatsapp_account_id?: string;
          wa_conversation_id?: string | null;
          customer_phone?: string;
          customer_name?: string | null;
          customer_id?: string | null;
          lead_id?: string | null;
          assigned_agent_id?: string | null;
          status?: string;
          conversation_type?: string;
          intent?: string | null;
          last_message_at?: string | null;
          closed_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'whatsapp_conversations_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'whatsapp_conversations_whatsapp_account_id_fkey';
            columns: ['whatsapp_account_id'];
            isOneToOne: false;
            referencedRelation: 'whatsapp_accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'whatsapp_conversations_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'whatsapp_conversations_lead_id_fkey';
            columns: ['lead_id'];
            isOneToOne: false;
            referencedRelation: 'leads';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'whatsapp_conversations_assigned_agent_id_fkey';
            columns: ['assigned_agent_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      whatsapp_messages: {
        Row: {
          id: string;
          organization_id: string;
          conversation_id: string;
          wa_message_id: string | null;
          direction: string;
          sender_type: string;
          sender_id: string | null;
          message_type: string;
          content: string | null;
          media_url: string | null;
          template_name: string | null;
          template_params: Json | null;
          status: string;
          error_code: string | null;
          error_message: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          conversation_id: string;
          wa_message_id?: string | null;
          direction: string;
          sender_type: string;
          sender_id?: string | null;
          message_type?: string;
          content?: string | null;
          media_url?: string | null;
          template_name?: string | null;
          template_params?: Json | null;
          status?: string;
          error_code?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          conversation_id?: string;
          wa_message_id?: string | null;
          direction?: string;
          sender_type?: string;
          sender_id?: string | null;
          message_type?: string;
          content?: string | null;
          media_url?: string | null;
          template_name?: string | null;
          template_params?: Json | null;
          status?: string;
          error_code?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'whatsapp_messages_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'whatsapp_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'whatsapp_conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'whatsapp_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      whatsapp_templates: {
        Row: {
          id: string;
          organization_id: string;
          whatsapp_account_id: string;
          meta_template_id: string;
          name: string;
          language: string;
          category: string;
          status: string;
          components: Json;
          purpose: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          whatsapp_account_id: string;
          meta_template_id: string;
          name: string;
          language?: string;
          category: string;
          status: string;
          components: Json;
          purpose?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          whatsapp_account_id?: string;
          meta_template_id?: string;
          name?: string;
          language?: string;
          category?: string;
          status?: string;
          components?: Json;
          purpose?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'whatsapp_templates_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'whatsapp_templates_whatsapp_account_id_fkey';
            columns: ['whatsapp_account_id'];
            isOneToOne: false;
            referencedRelation: 'whatsapp_accounts';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      auto_assign_lead: {
        Args: {
          lead_uuid: string;
        };
        Returns: string;
      };
      reassign_lead: {
        Args: {
          lead_uuid: string;
          new_advisor_id: string;
          performed_by_id: string;
          reassignment_reason?: string;
        };
        Returns: boolean;
      };
      get_user_permissions: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          permission_slug: string;
          module: string;
          action: string;
        }[];
      };
      has_permission: {
        Args: {
          p_user_id: string;
          p_permission_slug: string;
        };
        Returns: boolean;
      };
      get_user_roles: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          role_id: string;
          role_name: string;
          role_slug: string;
        }[];
      };
      assign_role_to_user: {
        Args: {
          p_user_id: string;
          p_role_id: string;
          p_assigned_by: string;
        };
        Returns: {
          id: string;
          user_id: string;
          role_id: string;
          assigned_by: string;
          assigned_at: string;
        }[];
      };
      remove_role_from_user: {
        Args: {
          p_user_id: string;
          p_role_id: string;
          p_removed_by?: string;
        };
        Returns: undefined;
      };
      get_user_primary_role: {
        Args: {
          p_user_id: string;
        };
        Returns: string;
      };
      get_next_consecutive: {
        Args: {
          p_org_id: string;
          p_entity_type: string;
        };
        Returns: string;
      };
      generate_consecutive: {
        Args: {
          org_uuid: string;
          entity_type: string;
        };
        Returns: number;
      };
      seed_organization_roles: {
        Args: {
          p_org_id: string;
        };
        Returns: undefined;
      };
      get_leads_for_user: {
        Args: {
          p_user_id: string;
          p_org_id: string;
          p_status?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          organization_id: string;
          lead_number: number;
          business_name: string;
          nit: string | null;
          contact_name: string;
          phone: string;
          email: string;
          requirement: string;
          channel: string;
          status: string;
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
        }[];
      };
      get_current_trm: {
        Args: {
          org_uuid: string;
        };
        Returns: number;
      };
      get_current_trm_date: {
        Args: {
          org_uuid: string;
        };
        Returns: string;
      };
      upsert_trm_rate: {
        Args: {
          org_uuid: string;
          p_rate_date: string;
          p_rate_value: number;
          p_source?: string;
          p_user_id?: string;
        };
        Returns: string;
      };
      create_quote_from_lead: {
        Args: {
          lead_uuid: string;
        };
        Returns: string;
      };
      calculate_quote_totals: {
        Args: {
          quote_uuid: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'objects_bucketId_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          owner_id: string | null;
          upload_signature: string;
          user_metadata: Json | null;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          owner_id?: string | null;
          upload_signature: string;
          user_metadata?: Json | null;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          owner_id?: string | null;
          upload_signature?: string;
          user_metadata?: Json | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_parts_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 's3_multipart_uploads_parts_upload_id_fkey';
            columns: ['upload_id'];
            isOneToOne: false;
            referencedRelation: 's3_multipart_uploads';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string;
          name: string;
          owner: string;
          metadata: Json;
        };
        Returns: undefined;
      };
      extension: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      filename: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      foldername: {
        Args: {
          name: string;
        };
        Returns: string[];
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          prefix_param: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
        };
        Returns: {
          key: string;
          id: string;
          created_at: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string;
          prefix_param: string;
          delimiter_param: string;
          max_keys?: number;
          start_after?: string;
          next_token?: string;
        };
        Returns: {
          name: string;
          id: string;
          metadata: Json;
          updated_at: string;
        }[];
      };
      operation: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
