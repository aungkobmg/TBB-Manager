/**
 * TBB OS — API Services
 * All API endpoints organized by module
 */

import { api } from './client';

// ============================================================
// Types
// ============================================================

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Settings {
  business_name: string;
  phone: string;
  facebook: string;
  address: string;
  voucher_footer: string;
  currency: string;
  currency_symbol: string;
  tax_rate: string;
}

export interface Bale {
  id: number;
  bale_code: string;
  purchase_date: string;
  supplier_name: string;
  bale_cost: number;
  expected_qty: number;
  actual_qty: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  summary?: {
    total_products: number;
    available_count: number;
    reserved_count: number;
    sold_count: number;
    cancelled_count: number;
    total_cost: number;
    total_revenue: number;
    profit: number;
  };
}

export interface Product {
  id: number;
  product_code: string;
  product_name: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  condition_grade: string;
  cost_price: number;
  selling_price: number;
  bale_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  bale_code?: string;
  sales_history?: any[];
  movements?: any[];
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  facebook_name: string;
  address: string;
  township: string;
  city: string;
  notes: string;
  order_count?: number;
  total_spent?: number;
  stats?: {
    order_count: number;
    total_spent: number;
    last_order_date: string;
  };
  recent_orders?: any[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_code_snapshot: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product_name?: string;
  cost_price?: number;
}

export interface Order {
  id: number;
  voucher_number: string;
  order_date: string;
  order_time: string;
  customer_id: number;
  customer_name_snapshot: string;
  phone_snapshot: string;
  shipping_address_snapshot: string;
  delivery_company: string;
  tracking_number: string;
  payment_method: string;
  payment_status: string;
  delivery_fee: number;
  subtotal: number;
  total_amount: number;
  order_status: string;
  cancel_reason: string;
  cancelled_at: string;
  notes: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  business?: {
    name: string;
    phone: string;
    facebook: string;
    voucher_footer: string;
  };
  item_count?: number;
}

export interface Expense {
  id: number;
  expense_date: string;
  category: string;
  amount: number;
  description: string;
  reference: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  description: string;
  ip_address: string;
  user_agent: string;
  username: string;
  created_at: string;
}

export interface DashboardData {
  revenue_today: number;
  orders_today: number;
  revenue_month: number;
  orders_month: number;
  pending_orders: number;
  available_products: number;
  inventory_cost_value: number;
  inventory_selling_value: number;
  total_expenses: number;
  total_revenue: number;
  gross_profit: number;
  net_profit: number;
  total_bales: number;
  total_products: number;
  total_customers: number;
  total_orders: number;
  recent_orders: any[];
  recent_expenses: any[];
  today: string;
}

// ============================================================
// Auth API
// ============================================================

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ user: User }>('/login', { username, password }),

  logout: () => api.post('/logout'),

  me: () => api.get<User>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }),
};

// ============================================================
// Dashboard API
// ============================================================

export const dashboardApi = {
  summary: () => api.get<DashboardData>('/dashboard/summary'),
};

// ============================================================
// Bales API
// ============================================================

export const baleApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<{ data: Bale[]; pagination: any }>('/bales', params),

  get: (id: number) => api.get<Bale>(`/bales/${id}`),

  create: (data: Partial<Bale>) => api.post<Bale>('/bales', data),

  update: (id: number, data: Partial<Bale>) => api.put<Bale>(`/bales/${id}`, data),
};

// ============================================================
// Products API
// ============================================================

export const productApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; condition?: string; bale_id?: number }) =>
    api.get<{ data: Product[]; pagination: any }>('/products', params),

  get: (id: number) => api.get<Product>(`/products/${id}`),

  searchByCode: (code: string) => api.get<Product>(`/products/search/${encodeURIComponent(code)}`),

  create: (data: Partial<Product>) => api.post<Product>('/products', data),

  update: (id: number, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
};

// ============================================================
// Customers API
// ============================================================

export const customerApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<{ data: Customer[]; pagination: any }>('/customers', params),

  get: (id: number) => api.get<Customer>(`/customers/${id}`),

  search: (q: string) => api.get<Customer[]>('/customers/search', { q }),

  create: (data: Partial<Customer>) => api.post<Customer>('/customers', data),

  update: (id: number, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, data),
};

// ============================================================
// Orders API
// ============================================================

export const orderApi = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string; payment_method?: string; date_from?: string; date_to?: string }) =>
    api.get<{ data: Order[]; pagination: any }>('/orders', params),

  get: (id: number) => api.get<Order>(`/orders/${id}`),

  create: (data: {
    customerId: number;
    productCodes: string[];
    deliveryFee: number;
    deliveryCompany?: string;
    trackingNumber?: string;
    paymentMethod: string;
    paymentStatus: string;
    shippingAddress?: string;
  }) => api.post<Order>('/orders', data),

  update: (id: number, data: Partial<Order>) => api.put<Order>(`/orders/${id}`, data),

  updateStatus: (id: number, status: string) =>
    api.put(`/orders/${id}/status`, { status }),

  cancel: (id: number, reason: string) =>
    api.put(`/orders/${id}/cancel`, { reason }),
};

// ============================================================
// Vouchers API
// ============================================================

export const voucherApi = {
  get: (id: number) => api.get<Order>(`/vouchers/${id}`),
};

// ============================================================
// Finance API
// ============================================================

export const financeApi = {
  summary: (params?: { date_from?: string; date_to?: string }) =>
    api.get('/finance/summary', params),

  expenses: (params?: { page?: number; limit?: number; category?: string; date_from?: string; date_to?: string }) =>
    api.get<{ data: Expense[]; pagination: any }>('/expenses', params),

  createExpense: (data: Partial<Expense>) => api.post<Expense>('/expenses', data),

  updateExpense: (id: number, data: Partial<Expense>) => api.put<Expense>(`/expenses/${id}`, data),
};

// ============================================================
// Reports API
// ============================================================

export const reportApi = {
  dailySales: (params?: { date_from?: string; date_to?: string }) =>
    api.get('/reports/daily-sales', params),

  monthlySales: (params?: { date_from?: string; date_to?: string }) =>
    api.get('/reports/monthly-sales', params),

  inventory: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/reports/inventory', params),

  balePerformance: () => api.get('/reports/bale-performance'),

  profitLoss: (params?: { date_from?: string; date_to?: string }) =>
    api.get('/reports/profit-loss', params),

  customerHistory: () => api.get('/reports/customer-history'),

  voucherHistory: (params?: { page?: number; limit?: number; search?: string; date_from?: string; date_to?: string }) =>
    api.get('/reports/voucher-history', params),
};

// ============================================================
// Settings API
// ============================================================

export const settingsApi = {
  get: () => api.get<Settings>('/settings'),

  update: (data: Partial<Settings>) => api.put('/settings', data),

  backup: () => {
    // Direct download link
    window.open(`${import.meta.env.VITE_API_URL || '/api'}/settings/backup`, '_blank');
  },
};

// ============================================================
// Activity Logs API
// ============================================================

export const activityApi = {
  list: (params?: { page?: number; limit?: number; search?: string; action?: string }) =>
    api.get<{ data: ActivityLog[]; pagination: any }>('/activity-logs', params),
};

// ============================================================
// Utility
// ============================================================

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US') + ' MMK';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
