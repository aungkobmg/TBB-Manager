/**
 * TBB OS — Storage Compatibility Layer
 * This provides the same API as the old localStorage-based storage
 * but uses the REST API backend instead.
 *
 * This allows existing pages to work with minimal changes while
 * the backend handles all business logic and data persistence.
 */

import { api, ApiError } from '../api/client';
import { message } from 'antd';

// ============================================================
// Types (same as before for compatibility)
// ============================================================

export interface User {
  id: number;
  username: string;
  passwordHash?: string;
  role: string;
  createdAt?: string;
}

export interface Settings {
  businessName: string;
  phone: string;
  facebook: string;
  address: string;
  voucherFooter: string;
  currency: string;
}

export interface Bale {
  id: number;
  baleCode: string;
  purchaseDate: string;
  supplierName: string;
  baleCost: number;
  expectedQty: number;
  actualQty: number;
  status: 'Purchased' | 'Processing' | 'Completed' | 'Closed';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  productCode: string;
  productName: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  condition: 'A+' | 'A' | 'B';
  costPrice: number;
  sellingPrice: number;
  baleId: number | null;
  status: 'Available' | 'Reserved' | 'Sold' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  facebookName: string;
  address: string;
  township: string;
  city: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productCodeSnapshot: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  voucherNumber: string;
  orderDate: string;
  customerId: number;
  customerNameSnapshot: string;
  phoneSnapshot: string;
  shippingAddressSnapshot: string;
  deliveryCompany: string;
  trackingNumber: string;
  paymentMethod: string;
  deliveryFee: number;
  subtotal: number;
  totalAmount: number;
  orderStatus: 'Pending' | 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  expenseDate: string;
  category: string;
  amount: number;
  description: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: number | null;
  description: string;
  ipAddress: string;
  createdAt: string;
}

// ============================================================
// Session Management (uses cookies via API)
// ============================================================

export function initializeApp(): void {
  // No-op - backend handles initialization
}

export function getSession(): { userId: number; username: string; loginTime: number } | null {
  // Session is managed by PHP sessions via cookies
  // We check via the /auth/me endpoint in App.tsx
  const stored = localStorage.getItem('tbb_session_cache');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch { return null; }
  }
  return null;
}

export function setSession(userId: number, username: string): void {
  const session = { userId, username, loginTime: Date.now() };
  localStorage.setItem('tbb_session_cache', JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem('tbb_session_cache');
}

// ============================================================
// Auth
// ============================================================

export function verifyPassword(_password: string, _hash: string): boolean {
  // Password verification is done server-side
  return false;
}

// ============================================================
// Settings
// ============================================================

let settingsCache: Settings | null = null;

export function getSettings(): Settings {
  if (settingsCache) return settingsCache;
  // Return defaults while loading
  return {
    businessName: 'The Bra Boutique (Yangon)',
    phone: '09-xxxxxxxxx',
    facebook: 'The Bra Boutique (Yangon)',
    address: 'Yangon, Myanmar',
    voucherFooter: 'Thank You For Shopping With Us!',
    currency: 'MMK',
  };
}

export async function fetchSettings(): Promise<Settings> {
  try {
    const res = await api.get<any>('/settings');
    if (res.data) {
      settingsCache = {
        businessName: res.data.business_name || 'The Bra Boutique (Yangon)',
        phone: res.data.phone || '',
        facebook: res.data.facebook || '',
        address: res.data.address || '',
        voucherFooter: res.data.voucher_footer || 'Thank You For Shopping With Us!',
        currency: res.data.currency || 'MMK',
      };
      return settingsCache;
    }
  } catch (err) {
    // Use defaults
  }
  return getSettings();
}

export async function updateSettings(settings: Settings): Promise<void> {
  await api.put('/settings', {
    business_name: settings.businessName,
    phone: settings.phone,
    facebook: settings.facebook,
    address: settings.address,
    voucher_footer: settings.voucherFooter,
    currency: settings.currency,
  });
  settingsCache = settings;
}

// ============================================================
// Bales
// ============================================================

export function getBales(): Bale[] {
  // Sync fallback - returns empty, pages should use async version
  return [];
}

export async function fetchBales(params?: any): Promise<{ data: Bale[]; total: number }> {
  const res = await api.get<any>('/bales', params);
  const data = (res.data?.data || []).map(mapBale);
  return { data, total: res.data?.pagination?.total || data.length };
}

export function getBale(id: number): Bale | undefined {
  return undefined; // Use fetchBale instead
}

export async function fetchBale(id: number): Promise<Bale | null> {
  try {
    const res = await api.get<any>(`/bales/${id}`);
    return res.data ? mapBale(res.data) : null;
  } catch { return null; }
}

export async function createBale(bale: Partial<Bale>): Promise<Bale> {
  const res = await api.post<any>('/bales', {
    supplierName: bale.supplierName,
    purchaseDate: bale.purchaseDate,
    baleCost: bale.baleCost,
    expectedQty: bale.expectedQty,
    actualQty: bale.actualQty,
    status: bale.status,
    notes: bale.notes,
  });
  return mapBale(res.data);
}

export async function updateBale(id: number, updates: Partial<Bale>): Promise<void> {
  await api.put(`/bales/${id}`, {
    supplierName: updates.supplierName,
    purchaseDate: updates.purchaseDate,
    baleCost: updates.baleCost,
    expectedQty: updates.expectedQty,
    actualQty: updates.actualQty,
    status: updates.status,
    notes: updates.notes,
  });
}

function mapBale(b: any): Bale {
  return {
    id: b.id,
    baleCode: b.bale_code,
    purchaseDate: b.purchase_date,
    supplierName: b.supplier_name,
    baleCost: b.bale_cost,
    expectedQty: b.expected_qty,
    actualQty: b.actual_qty,
    status: b.status,
    notes: b.notes || '',
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

// ============================================================
// Products
// ============================================================

export function getProducts(): Product[] {
  return [];
}

export async function fetchProducts(params?: any): Promise<{ data: Product[]; total: number }> {
  const res = await api.get<any>('/products', params);
  const data = (res.data?.data || []).map(mapProduct);
  return { data, total: res.data?.pagination?.total || data.length };
}

export function getProduct(id: number): Product | undefined {
  return undefined;
}

export async function fetchProduct(id: number): Promise<Product | null> {
  try {
    const res = await api.get<any>(`/products/${id}`);
    return res.data ? mapProduct(res.data) : null;
  } catch { return null; }
}

export function getProductByCode(code: string): Product | undefined {
  return undefined;
}

export async function searchProductByCode(code: string): Promise<Product | null> {
  try {
    const res = await api.get<any>(`/products/search/${encodeURIComponent(code)}`);
    return res.data ? mapProduct(res.data) : null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
  const res = await api.post<any>('/products', {
    productName: product.productName,
    brand: product.brand,
    category: product.category,
    size: product.size,
    color: product.color,
    condition: product.condition,
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice,
    baleId: product.baleId,
  });
  return mapProduct(res.data);
}

export async function updateProduct(id: number, updates: Partial<Product>): Promise<void> {
  await api.put(`/products/${id}`, {
    productName: updates.productName,
    brand: updates.brand,
    category: updates.category,
    size: updates.size,
    color: updates.color,
    condition: updates.condition,
    costPrice: updates.costPrice,
    sellingPrice: updates.sellingPrice,
    baleId: updates.baleId,
  });
}

function mapProduct(p: any): Product {
  return {
    id: p.id,
    productCode: p.product_code,
    productName: p.product_name,
    brand: p.brand || '',
    category: p.category || '',
    size: p.size || '',
    color: p.color || '',
    condition: p.condition_grade || 'A',
    costPrice: p.cost_price,
    sellingPrice: p.selling_price,
    baleId: p.bale_id,
    status: p.status,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

// ============================================================
// Customers
// ============================================================

export function getCustomers(): Customer[] {
  return [];
}

export async function fetchCustomers(params?: any): Promise<{ data: Customer[]; total: number }> {
  const res = await api.get<any>('/customers', params);
  const data = (res.data?.data || []).map(mapCustomer);
  return { data, total: res.data?.pagination?.total || data.length };
}

export function getCustomer(id: number): Customer | undefined {
  return undefined;
}

export async function fetchCustomer(id: number): Promise<Customer | null> {
  try {
    const res = await api.get<any>(`/customers/${id}`);
    return res.data ? mapCustomer(res.data) : null;
  } catch { return null; }
}

export async function searchCustomers(q: string): Promise<Customer[]> {
  const res = await api.get<any[]>('/customers/search', { q });
  return (res.data || []).map(mapCustomer);
}

export async function createCustomer(customer: Partial<Customer>): Promise<Customer> {
  const res = await api.post<any>('/customers', {
    name: customer.name,
    phone: customer.phone,
    facebookName: customer.facebookName,
    address: customer.address,
    township: customer.township,
    city: customer.city,
    notes: customer.notes,
  });
  return mapCustomer(res.data);
}

export async function updateCustomer(id: number, updates: Partial<Customer>): Promise<void> {
  await api.put(`/customers/${id}`, {
    name: updates.name,
    phone: updates.phone,
    facebookName: updates.facebookName,
    address: updates.address,
    township: updates.township,
    city: updates.city,
    notes: updates.notes,
  });
}

function mapCustomer(c: any): Customer {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone || '',
    facebookName: c.facebook_name || '',
    address: c.address || '',
    township: c.township || '',
    city: c.city || '',
    notes: c.notes || '',
    createdAt: c.created_at || '',
    updatedAt: c.updated_at || '',
  };
}

// ============================================================
// Orders
// ============================================================

export function getOrders(): Order[] {
  return [];
}

export async function fetchOrders(params?: any): Promise<{ data: Order[]; total: number }> {
  const res = await api.get<any>('/orders', params);
  const data = (res.data?.data || []).map(mapOrder);
  return { data, total: res.data?.pagination?.total || data.length };
}

export function getOrder(id: number): Order | undefined {
  return undefined;
}

export async function fetchOrder(id: number): Promise<Order | null> {
  try {
    const res = await api.get<any>(`/orders/${id}`);
    return res.data ? mapOrder(res.data) : null;
  } catch { return null; }
}

export async function createOrder(orderData: {
  customerId: number;
  productCodes: string[];
  deliveryFee: number;
  deliveryCompany?: string;
  trackingNumber?: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress?: string;
}): Promise<Order> {
  const res = await api.post<any>('/orders', orderData);
  return mapOrder(res.data);
}

export async function updateOrderStatus(id: number, status: string): Promise<void> {
  await api.put(`/orders/${id}/status`, { status });
}

export async function cancelOrder(id: number, reason: string): Promise<void> {
  await api.put(`/orders/${id}/cancel`, { reason });
}

function mapOrder(o: any): Order {
  return {
    id: o.id,
    voucherNumber: o.voucher_number,
    orderDate: o.order_date,
    customerId: o.customer_id,
    customerNameSnapshot: o.customer_name_snapshot,
    phoneSnapshot: o.phone_snapshot,
    shippingAddressSnapshot: o.shipping_address_snapshot || '',
    deliveryCompany: o.delivery_company || '',
    trackingNumber: o.tracking_number || '',
    paymentMethod: o.payment_method,
    deliveryFee: o.delivery_fee,
    subtotal: o.subtotal,
    totalAmount: o.total_amount,
    orderStatus: o.order_status,
    paymentStatus: o.payment_status,
    items: (o.items || []).map((i: any) => ({
      id: i.id,
      orderId: i.order_id,
      productId: i.product_id,
      productCodeSnapshot: i.product_code_snapshot,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      lineTotal: i.line_total,
    })),
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

// ============================================================
// Vouchers
// ============================================================

export async function fetchVoucher(id: number): Promise<Order | null> {
  try {
    const res = await api.get<any>(`/vouchers/${id}`);
    if (!res.data) return null;
    const order = mapOrder(res.data);
    order.items = (res.data.items || []).map((i: any) => ({
      id: i.id || 0,
      orderId: order.id,
      productId: 0,
      productCodeSnapshot: i.product_code_snapshot,
      quantity: i.quantity,
      unitPrice: i.unit_price,
      lineTotal: i.line_total,
    }));
    // Attach business info
    if (res.data.business) {
      (order as any).business = res.data.business;
    }
    return order;
  } catch { return null; }
}

// ============================================================
// Expenses
// ============================================================

export function getExpenses(): Expense[] {
  return [];
}

export async function fetchExpenses(params?: any): Promise<{ data: Expense[]; total: number }> {
  const res = await api.get<any>('/expenses', params);
  const data = (res.data?.data || []).map(mapExpense);
  return { data, total: res.data?.pagination?.total || data.length };
}

export async function createExpense(expense: Partial<Expense>): Promise<Expense> {
  const res = await api.post<any>('/expenses', {
    expenseDate: expense.expenseDate,
    category: expense.category,
    amount: expense.amount,
    description: expense.description,
    reference: expense.reference,
  });
  return mapExpense(res.data);
}

function mapExpense(e: any): Expense {
  return {
    id: e.id,
    expenseDate: e.expense_date,
    category: e.category,
    amount: e.amount,
    description: e.description || '',
    reference: e.reference || '',
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  };
}

// ============================================================
// Activity Logs
// ============================================================

export function getActivityLogs(): ActivityLog[] {
  return [];
}

export async function fetchActivityLogs(params?: any): Promise<{ data: ActivityLog[]; total: number }> {
  const res = await api.get<any>('/activity-logs', params);
  const data = (res.data?.data || []).map((l: any) => ({
    id: l.id,
    userId: l.user_id,
    action: l.action,
    entityType: l.entity_type,
    entityId: l.entity_id,
    description: l.description,
    ipAddress: l.ip_address || '',
    createdAt: l.created_at,
  }));
  return { data, total: res.data?.pagination?.total || data.length };
}

export function logActivity(_userId: number, _action: string, _entityType: string, _entityId: number | null, _description: string): void {
  // Activity logging is done server-side
}

// ============================================================
// Users
// ============================================================

export function getUsers(): User[] {
  return [];
}

export function updateUser(_id: number, _updates: Partial<User>): void {
  // Handled via auth API
}

// ============================================================
// Voucher Number (server-generated)
// ============================================================

export function generateVoucherNumber(): string {
  // Voucher numbers are generated server-side
  return '';
}

// ============================================================
// Formatting utilities
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
