import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrderFilters } from './types';
import type {
  CreateOrderFormData,
  CreatePurchaseOrderFormData,
  CreateShipmentFormData,
  RegisterInvoiceFormData,
  CreateLicenseFormData,
  CreateSupplierFormData,
  CreatePendingTaskFormData,
} from './schemas';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters & { page?: number }) =>
    [...orderKeys.lists(), filters] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
  destinations: (id: string) => [...orderKeys.all, 'destinations', id] as const,
  billingSteps: (id: string) => [...orderKeys.all, 'billing-steps', id] as const,
  purchaseOrders: (orderId: string) => [...orderKeys.all, 'purchase-orders', orderId] as const,
  shipments: (orderId: string) => [...orderKeys.all, 'shipments', orderId] as const,
  invoices: (orderId: string) => [...orderKeys.all, 'invoices', orderId] as const,
  licenses: (orderId: string) => [...orderKeys.all, 'licenses', orderId] as const,
  pendingTasks: (orderId: string) => [...orderKeys.all, 'pending-tasks', orderId] as const,
  traceability: (orderId: string) => [...orderKeys.all, 'traceability', orderId] as const,
};

export const supplierKeys = {
  all: ['suppliers'] as const,
  list: (search?: string) => [...supplierKeys.all, 'list', search] as const,
};

async function fetchOrders(filters: OrderFilters & { page?: number; limit?: number }) {
  const params = new URLSearchParams();
  params.set('page', (filters.page || 1).toString());
  params.set('limit', (filters.limit || 20).toString());

  if (filters.status) params.set('status', filters.status);
  if (filters.customer_id) params.set('customer_id', filters.customer_id);
  if (filters.advisor_id) params.set('advisor_id', filters.advisor_id);
  if (filters.payment_status) params.set('payment_status', filters.payment_status);
  if (filters.search) params.set('search', filters.search);
  if (filters.from_date) params.set('from_date', filters.from_date);
  if (filters.to_date) params.set('to_date', filters.to_date);

  const response = await fetch(`/api/orders?${params.toString()}`);
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Error al cargar los pedidos');
  }
  return response.json();
}

async function fetchOrderDetail(orderId: string) {
  const response = await fetch(`/api/orders/${orderId}/status`);
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Error al cargar el pedido');
  }
  return response.json();
}

export function useOrders(filters: OrderFilters & { page?: number }, initialData?: unknown) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => fetchOrders(filters),
    initialData,
  });
}

export function useOrderDetail(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.detail(orderId || ''),
    queryFn: () => fetchOrderDetail(orderId!),
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderFormData) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al crear el pedido');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al actualizar el estado');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: string; notes?: string }) => {
      const response = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al confirmar el pago');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}

export function useUpdateBillingStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, step, value }: { orderId: string; step: string; value: string }) => {
      const response = await fetch(`/api/orders/${orderId}/billing-step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, value }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al actualizar facturación');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.billingSteps(variables.orderId) });
    },
  });
}

export function useBillingSteps(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.billingSteps(orderId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/billing-step`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar facturación');
      }
      return response.json();
    },
    enabled: !!orderId,
  });
}

export function useOrderDestinations(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.destinations(orderId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/destinations`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar destinos');
      }
      return response.json();
    },
    enabled: !!orderId,
  });
}

export function useAddDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, ...data }: { orderId: string; delivery_address: string; delivery_city?: string; delivery_contact?: string; delivery_phone?: string; delivery_schedule?: string; dispatch_type?: string; notes?: string }) => {
      const response = await fetch(`/api/orders/${orderId}/destinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al agregar destino');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.destinations(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}

export function useRemoveDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, destinationId }: { orderId: string; destinationId: string }) => {
      const response = await fetch(`/api/orders/${orderId}/destinations?destination_id=${destinationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al eliminar destino');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.destinations(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}

// --- Sprint 3: Suppliers ---

export function useSuppliers(search?: string) {
  return useQuery({
    queryKey: supplierKeys.list(search),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const response = await fetch(`/api/suppliers?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar proveedores');
      }
      return response.json();
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSupplierFormData) => {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al crear proveedor');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    },
  });
}

// --- Sprint 3: Purchase Orders ---

export function useOrderPurchaseOrders(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.purchaseOrders(orderId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/purchase-orders?order_id=${orderId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar órdenes de compra');
      }
      return response.json();
    },
    enabled: !!orderId,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePurchaseOrderFormData) => {
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al crear orden de compra');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.purchaseOrders(variables.order_id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.order_id) });
    },
  });
}

export function useReceivePurchaseOrderItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poId, orderId, items }: { poId: string; orderId: string; items: { po_item_id: string; quantity_received: number }[] }) => {
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'receive_items', items }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al registrar recepción');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.purchaseOrders(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poId, orderId, status }: { poId: string; orderId: string; status: string }) => {
      const response = await fetch(`/api/purchase-orders/${poId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', status }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al actualizar estado de OC');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.purchaseOrders(variables.orderId) });
    },
  });
}

// --- Sprint 3: Shipments ---

export function useOrderShipments(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.shipments(orderId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/shipments?order_id=${orderId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar despachos');
      }
      return response.json();
    },
    enabled: !!orderId,
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateShipmentFormData) => {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al crear despacho');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.shipments(variables.order_id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.order_id) });
    },
  });
}

export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shipmentId, orderId, action, ...data }: { shipmentId: string; orderId: string; action: 'dispatch' | 'deliver'; received_by_name?: string; reception_notes?: string }) => {
      const response = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al actualizar despacho');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.shipments(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}

// --- Sprint 3: Invoices ---

export function useOrderInvoices(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.invoices(orderId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/invoices?order_id=${orderId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar facturas');
      }
      return response.json();
    },
    enabled: !!orderId,
  });
}

export function useRegisterInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegisterInvoiceFormData) => {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al registrar factura');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.invoices(variables.order_id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.order_id) });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, orderId, ...data }: { invoiceId: string; orderId: string; status?: string; payment_date?: string; payment_method?: string; payment_reference?: string }) => {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al actualizar factura');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.invoices(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}

// --- Sprint 3: Licenses ---

export function useOrderLicenses(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.licenses(orderId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/licenses?order_id=${orderId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar licencias');
      }
      return response.json();
    },
    enabled: !!orderId,
  });
}

export function useCreateLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLicenseFormData) => {
      const response = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al crear licencia');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.licenses(variables.order_id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.order_id) });
    },
  });
}

export function useUpdateLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ licenseId, orderId, ...data }: { licenseId: string; orderId: string; status?: string; license_key?: string; activation_date?: string; expiry_date?: string; end_user_name?: string; end_user_email?: string; activation_notes?: string }) => {
      const response = await fetch(`/api/licenses/${licenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al actualizar licencia');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.licenses(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}

// --- Sprint 3: Pending Tasks ---

export function useOrderPendingTasks(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.pendingTasks(orderId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/pending-tasks`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar tareas pendientes');
      }
      return response.json();
    },
    enabled: !!orderId,
  });
}

export function useCreatePendingTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePendingTaskFormData) => {
      const response = await fetch(`/api/orders/${data.order_id}/pending-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al crear tarea');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.pendingTasks(variables.order_id) });
    },
  });
}

export function useUpdatePendingTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, orderId, ...data }: { taskId: string; orderId: string; status?: string; priority?: string; assigned_to?: string }) => {
      const response = await fetch(`/api/orders/${orderId}/pending-tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, ...data }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al actualizar tarea');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.pendingTasks(variables.orderId) });
    },
  });
}

// --- Sprint 3: Traceability ---

export function useOrderTraceability(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.traceability(orderId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/traceability`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar trazabilidad');
      }
      return response.json();
    },
    enabled: !!orderId,
  });
}
