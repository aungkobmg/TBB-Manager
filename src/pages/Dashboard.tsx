import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, getProducts, getExpenses, getCustomers, getBales, formatCurrency, formatDate } from '../utils/storage';

export default function Dashboard() {
  const orders = getOrders();
  const products = getProducts();
  const expenses = getExpenses();
  const customers = getCustomers();
  const bales = getBales();

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const todayOrders = orders.filter(o => o.orderDate?.slice(0, 10) === today && o.orderStatus !== 'Cancelled');
  const monthOrders = orders.filter(o => o.orderDate?.slice(0, 7) === thisMonth && o.orderStatus !== 'Cancelled');
  const pendingOrders = orders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed');
  const availableProducts = products.filter(p => p.status === 'Available');
  const todayExpenses = expenses.filter(e => e.expenseDate?.slice(0, 10) === today);

  const revenueToday = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
  const revenueMonth = monthOrders.reduce((s, o) => s + o.totalAmount, 0);
  const inventoryCostValue = availableProducts.reduce((s, p) => s + p.costPrice, 0);
  const inventorySellingValue = availableProducts.reduce((s, p) => s + p.sellingPrice, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRevenue = orders.filter(o => o.orderStatus !== 'Cancelled').reduce((s, o) => s + o.totalAmount, 0);
  const totalProductCost = orders.filter(o => o.orderStatus !== 'Cancelled').reduce((s, o) =>
    s + o.items.reduce((is, i) => {
      const product = products.find(p => p.id === i.productId);
      return is + (product?.costPrice || 0) * i.quantity;
    }, 0), 0);
  const grossProfit = totalRevenue - totalProductCost;
  const netProfit = grossProfit - totalExpenses;

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentExpenses = [...expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const metrics = [
    { label: 'Revenue Today', value: formatCurrency(revenueToday), icon: 'fa-coins', color: 'text-green-600' },
    { label: 'Revenue This Month', value: formatCurrency(revenueMonth), icon: 'fa-chart-line', color: 'text-blue-600' },
    { label: 'Orders Today', value: todayOrders.length.toString(), icon: 'fa-clipboard-list', color: 'text-purple-600' },
    { label: 'Pending Orders', value: pendingOrders.length.toString(), icon: 'fa-clock', color: 'text-orange-600' },
    { label: 'Available Products', value: availableProducts.length.toString(), icon: 'fa-tags', color: 'text-teal-600' },
    { label: 'Inventory Cost Value', value: formatCurrency(inventoryCostValue), icon: 'fa-warehouse', color: 'text-indigo-600' },
    { label: 'Total Expenses', value: formatCurrency(totalExpenses), icon: 'fa-receipt', color: 'text-red-600' },
    { label: 'Gross Profit', value: formatCurrency(grossProfit), icon: 'fa-arrow-trend-up', color: 'text-emerald-600' },
    { label: 'Net Profit', value: formatCurrency(netProfit), icon: 'fa-sack-dollar', color: 'text-green-700' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{formatDate(new Date().toISOString())}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center ${m.color}`}>
                <i className={`fas ${m.icon}`}></i>
              </div>
              <div>
                <p className="text-xs text-gray-500">{m.label}</p>
                <p className="text-lg font-bold text-gray-900">{m.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/orders" className="text-sm text-[#0057B8] hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">No orders yet</p>
            ) : recentOrders.map(o => (
              <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{o.voucherNumber}</p>
                  <p className="text-xs text-gray-500">{o.customerNameSnapshot}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(o.totalAmount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    o.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                    o.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{o.orderStatus}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Expenses</h2>
            <Link to="/finance" className="text-sm text-[#0057B8] hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentExpenses.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">No expenses yet</p>
            ) : recentExpenses.map(e => (
              <div key={e.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.category}</p>
                  <p className="text-xs text-gray-500">{formatDate(e.expenseDate)}</p>
                </div>
                <p className="text-sm font-medium text-red-600">{formatCurrency(e.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{bales.length}</p>
          <p className="text-xs text-gray-500">Total Bales</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          <p className="text-xs text-gray-500">Total Products</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
          <p className="text-xs text-gray-500">Total Customers</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          <p className="text-xs text-gray-500">Total Orders</p>
        </div>
      </div>
    </div>
  );
}
