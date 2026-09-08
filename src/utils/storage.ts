// LocalStorage-based data persistence layer
// In production, this would be replaced with API calls to PHP/MySQL backend

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  role: string;
  createdAt: string;
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

const KEYS = {
  users: 'tbb_users',
  settings: 'tbb_settings',
  bales: 'tbb_bales',
  products: 'tbb_products',
  customers: 'tbb_customers',
  orders: 'tbb_orders',
  expenses: 'tbb_expenses',
  activityLogs: 'tbb_activity_logs',
  session: 'tbb_session',
  counters: 'tbb_counters',
};

function get<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function set(key: string, value: any): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Initialize default data
export function initializeApp(): void {
  const users = get<User[]>(KEYS.users, []);
  if (users.length === 0) {
    // Create default admin - password: admin123
    const defaultAdmin: User = {
      id: 1,
      username: 'admin',
      passwordHash: hashPassword('admin123'),
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    set(KEYS.users, [defaultAdmin]);
  }

  const settings = get<Settings | null>(KEYS.settings, null);
  if (!settings) {
    set(KEYS.settings, {
      businessName: 'The Bra Boutique (Yangon)',
      phone: '09-xxxxxxxxx',
      facebook: 'The Bra Boutique (Yangon)',
      address: 'Yangon, Myanmar',
      voucherFooter: 'Thank You For Shopping With Us!',
      currency: 'MMK',
    });
  }

  if (!localStorage.getItem(KEYS.counters)) {
    set(KEYS.counters, { product: 0, order: 0, bale: 0 });
  }
}

// Simple hash for demo (in production, use bcrypt on server)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Session management
export function getSession(): { userId: number; username: string; loginTime: number } | null {
  const session = get<{ userId: number; username: string; loginTime: number } | null>(KEYS.session, null);
  if (!session) return null;
  // 8 hour timeout
  if (Date.now() - session.loginTime > 8 * 60 * 60 * 1000) {
    localStorage.removeItem(KEYS.session);
    return null;
  }
  return session;
}

export function setSession(userId: number, username: string): void {
  set(KEYS.session, { userId, username, loginTime: Date.now() });
}

export function clearSession(): void {
  localStorage.removeItem(KEYS.session);
}

// Settings
export function getSettings(): Settings {
  return get<Settings>(KEYS.settings, {
    businessName: 'The Bra Boutique (Yangon)',
    phone: '09-xxxxxxxxx',
    facebook: 'The Bra Boutique (Yangon)',
    address: 'Yangon, Myanmar',
    voucherFooter: 'Thank You For Shopping With Us!',
    currency: 'MMK',
  });
}

export function updateSettings(settings: Settings): void {
  set(KEYS.settings, settings);
}

// Users
export function getUsers(): User[] {
  return get<User[]>(KEYS.users, []);
}

export function updateUser(id: number, updates: Partial<User>): void {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updates };
    set(KEYS.users, users);
  }
}

// Bales
export function getBales(): Bale[] {
  return get<Bale[]>(KEYS.bales, []);
}

export function getBale(id: number): Bale | undefined {
  return getBales().find(b => b.id === id);
}

export function createBale(bale: Omit<Bale, 'id' | 'baleCode' | 'createdAt' | 'updatedAt'>): Bale {
  const bales = getBales();
  const counters = get<any>(KEYS.counters, { product: 0, order: 0, bale: 0 });
  counters.bale++;
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 4) + now.toISOString().slice(5, 7) + now.toISOString().slice(8, 10);
  const baleCode = `BAL-${dateStr}-${String(counters.bale).padStart(3, '0')}`;
  const newBale: Bale = {
    ...bale,
    id: Date.now(),
    baleCode,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  bales.push(newBale);
  set(KEYS.bales, bales);
  set(KEYS.counters, counters);
  return newBale;
}

export function updateBale(id: number, updates: Partial<Bale>): void {
  const bales = getBales();
  const idx = bales.findIndex(b => b.id === id);
  if (idx >= 0) {
    bales[idx] = { ...bales[idx], ...updates, updatedAt: new Date().toISOString() };
    set(KEYS.bales, bales);
  }
}

// Products
export function getProducts(): Product[] {
  return get<Product[]>(KEYS.products, []);
}

export function getProduct(id: number): Product | undefined {
  return getProducts().find(p => p.id === id);
}

export function getProductByCode(code: string): Product | undefined {
  return getProducts().find(p => p.productCode === code);
}

export function createProduct(product: Omit<Product, 'id' | 'productCode' | 'createdAt' | 'updatedAt'>): Product {
  const products = getProducts();
  const counters = get<any>(KEYS.counters, { product: 0, order: 0, bale: 0 });
  counters.product++;
  const now = new Date();
  const newProduct: Product = {
    ...product,
    id: Date.now() + Math.random(),
    productCode: `TBB-${String(counters.product).padStart(6, '0')}`,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  products.push(newProduct);
  set(KEYS.products, products);
  set(KEYS.counters, counters);
  return newProduct;
}

export function updateProduct(id: number, updates: Partial<Product>): void {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx >= 0) {
    products[idx] = { ...products[idx], ...updates, updatedAt: new Date().toISOString() };
    set(KEYS.products, products);
  }
}

// Customers
export function getCustomers(): Customer[] {
  return get<Customer[]>(KEYS.customers, []);
}

export function getCustomer(id: number): Customer | undefined {
  return getCustomers().find(c => c.id === id);
}

export function createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
  const customers = getCustomers();
  const now = new Date();
  const newCustomer: Customer = {
    ...customer,
    id: Date.now() + Math.random(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  customers.push(newCustomer);
  set(KEYS.customers, customers);
  return newCustomer;
}

export function updateCustomer(id: number, updates: Partial<Customer>): void {
  const customers = getCustomers();
  const idx = customers.findIndex(c => c.id === id);
  if (idx >= 0) {
    customers[idx] = { ...customers[idx], ...updates, updatedAt: new Date().toISOString() };
    set(KEYS.customers, customers);
  }
}

// Orders
export function getOrders(): Order[] {
  return get<Order[]>(KEYS.orders, []);
}

export function getOrder(id: number): Order | undefined {
  return getOrders().find(o => o.id === id);
}

export function generateVoucherNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 4) + now.toISOString().slice(5, 7) + now.toISOString().slice(8, 10);
  const orders = getOrders();
  const todayOrders = orders.filter(o => o.voucherNumber.includes(dateStr));
  const nextNum = todayOrders.length + 1;
  return `TBB-${dateStr}-${String(nextNum).padStart(4, '0')}`;
}

export function createOrder(order: Omit<Order, 'id' | 'voucherNumber' | 'createdAt' | 'updatedAt'>): Order {
  const orders = getOrders();
  const now = new Date();
  const voucherNumber = generateVoucherNumber();
  const newOrder: Order = {
    ...order,
    id: Date.now() + Math.random(),
    voucherNumber,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  orders.push(newOrder);
  set(KEYS.orders, orders);

  // Update product statuses
  order.items.forEach(item => {
    updateProduct(item.productId, { status: 'Sold' });
  });

  return newOrder;
}

export function updateOrder(id: number, updates: Partial<Order>): void {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx >= 0) {
    orders[idx] = { ...orders[idx], ...updates, updatedAt: new Date().toISOString() };
    set(KEYS.orders, orders);
  }
}

// Expenses
export function getExpenses(): Expense[] {
  return get<Expense[]>(KEYS.expenses, []);
}

export function createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Expense {
  const expenses = getExpenses();
  const now = new Date();
  const newExpense: Expense = {
    ...expense,
    id: Date.now() + Math.random(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  expenses.push(newExpense);
  set(KEYS.expenses, expenses);
  return newExpense;
}

export function updateExpense(id: number, updates: Partial<Expense>): void {
  const expenses = getExpenses();
  const idx = expenses.findIndex(e => e.id === id);
  if (idx >= 0) {
    expenses[idx] = { ...expenses[idx], ...updates, updatedAt: new Date().toISOString() };
    set(KEYS.expenses, expenses);
  }
}

// Activity Logs
export function getActivityLogs(): ActivityLog[] {
  return get<ActivityLog[]>(KEYS.activityLogs, []);
}

export function logActivity(userId: number, action: string, entityType: string, entityId: number | null, description: string): void {
  const logs = getActivityLogs();
  logs.push({
    id: Date.now() + Math.random(),
    userId,
    action,
    entityType,
    entityId,
    description,
    ipAddress: '',
    createdAt: new Date().toISOString(),
  });
  set(KEYS.activityLogs, logs);
}

// Format currency
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US') + ' MMK';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
