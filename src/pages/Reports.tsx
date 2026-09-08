import { useState } from 'react';
import { getOrders, getProducts, getExpenses, getBales, getCustomers, formatCurrency, formatDate } from '../utils/storage';

export default function Reports() {
  const [activeReport, setActiveReport] = useState('daily-sales');
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  const orders = getOrders();
  const products = getProducts();
  const expenses = getExpenses();
  const bales = getBales();
  const customers = getCustomers();

  const filterByDate = (dateStr: string) => dateStr >= dateFrom && dateStr <= dateTo;

  const filteredOrders = orders.filter(o => filterByDate(o.orderDate?.slice(0, 10) || '') && o.orderStatus !== 'Cancelled');
  const filteredExpenses = expenses.filter(e => filterByDate(e.expenseDate?.slice(0, 10) || ''));

  const reports = [
    { id: 'daily-sales', label: 'Daily Sales', icon: 'fa-calendar-day' },
    { id: 'monthly-sales', label: 'Monthly Sales', icon: 'fa-calendar' },
    { id: 'inventory', label: 'Inventory Report', icon: 'fa-boxes-stacked' },
    { id: 'bale-performance', label: 'Bale Performance', icon: 'fa-box' },
    { id: 'profit-loss', label: 'Profit & Loss', icon: 'fa-chart-line' },
    { id: 'customer-history', label: 'Customer History', icon: 'fa-users' },
  ];

  const renderReport = () => {
    switch (activeReport) {
      case 'daily-sales': {
        const byDate: Record<string, { orders: number; revenue: number }> = {};
        filteredOrders.forEach(o => {
          const d = o.orderDate?.slice(0, 10) || '';
          if (!byDate[d]) byDate[d] = { orders: 0, revenue: 0 };
          byDate[d].orders++;
          byDate[d].revenue += o.totalAmount;
        });
        const sorted = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0]));
        return (
          <div>
            <h3 className="font-semibold mb-3">Daily Sales ({formatDate(dateFrom)} - {formatDate(dateTo)})</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">Date</th><th className="text-right py-2">Orders</th><th className="text-right py-2">Revenue</th></tr></thead>
              <tbody>
                {sorted.length === 0 ? <tr><td colSpan={3} className="text-center py-4 text-gray-400">No data</td></tr> :
                  sorted.map(([date, data]) => (
                    <tr key={date} className="border-b border-gray-50"><td className="py-2">{formatDate(date)}</td><td className="py-2 text-right">{data.orders}</td><td className="py-2 text-right font-medium">{formatCurrency(data.revenue)}</td></tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        );
      }
      case 'monthly-sales': {
        const byMonth: Record<string, { orders: number; revenue: number }> = {};
        filteredOrders.forEach(o => {
          const m = o.orderDate?.slice(0, 7) || '';
          if (!byMonth[m]) byMonth[m] = { orders: 0, revenue: 0 };
          byMonth[m].orders++;
          byMonth[m].revenue += o.totalAmount;
        });
        const sorted = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]));
        return (
          <div>
            <h3 className="font-semibold mb-3">Monthly Sales</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">Month</th><th className="text-right py-2">Orders</th><th className="text-right py-2">Revenue</th></tr></thead>
              <tbody>
                {sorted.length === 0 ? <tr><td colSpan={3} className="text-center py-4 text-gray-400">No data</td></tr> :
                  sorted.map(([month, data]) => (
                    <tr key={month} className="border-b border-gray-50"><td className="py-2">{month}</td><td className="py-2 text-right">{data.orders}</td><td className="py-2 text-right font-medium">{formatCurrency(data.revenue)}</td></tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        );
      }
      case 'inventory': {
        const available = products.filter(p => p.status === 'Available');
        const costValue = available.reduce((s, p) => s + p.costPrice, 0);
        const sellValue = available.reduce((s, p) => s + p.sellingPrice, 0);
        return (
          <div>
            <h3 className="font-semibold mb-3">Inventory Report</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center"><p className="text-lg font-bold">{available.length}</p><p className="text-xs text-gray-500">Available</p></div>
              <div className="bg-gray-50 p-3 rounded-lg text-center"><p className="text-lg font-bold">{formatCurrency(costValue)}</p><p className="text-xs text-gray-500">Cost Value</p></div>
              <div className="bg-gray-50 p-3 rounded-lg text-center"><p className="text-lg font-bold">{formatCurrency(sellValue)}</p><p className="text-xs text-gray-500">Selling Value</p></div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">Code</th><th className="text-left py-2">Name</th><th className="text-right py-2">Cost</th><th className="text-right py-2">Sell</th><th className="text-center py-2">Status</th></tr></thead>
              <tbody>
                {products.slice(0, 50).map(p => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-2 font-mono text-xs">{p.productCode}</td>
                    <td className="py-2">{p.productName}</td>
                    <td className="py-2 text-right">{formatCurrency(p.costPrice)}</td>
                    <td className="py-2 text-right">{formatCurrency(p.sellingPrice)}</td>
                    <td className="py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded ${p.status === 'Available' ? 'bg-green-100 text-green-700' : p.status === 'Sold' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case 'bale-performance': {
        return (
          <div>
            <h3 className="font-semibold mb-3">Bale Performance</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">Bale</th><th className="text-right py-2">Cost</th><th className="text-center py-2">Products</th><th className="text-center py-2">Sold</th><th className="text-right py-2">Revenue</th><th className="text-right py-2">Profit</th></tr></thead>
              <tbody>
                {bales.length === 0 ? <tr><td colSpan={6} className="text-center py-4 text-gray-400">No bales</td></tr> :
                  bales.map(b => {
                    const bProducts = products.filter(p => p.baleId === b.id);
                    const soldProducts = bProducts.filter(p => p.status === 'Sold');
                    const revenue = orders.filter(o => o.orderStatus !== 'Cancelled').reduce((s, o) =>
                      s + o.items.filter(i => bProducts.find(p => p.id === i.productId)).reduce((is, i) => is + i.lineTotal, 0), 0);
                    const cost = soldProducts.reduce((s, p) => s + p.costPrice, 0);
                    return (
                      <tr key={b.id} className="border-b border-gray-50">
                        <td className="py-2 font-medium">{b.baleCode}</td>
                        <td className="py-2 text-right">{formatCurrency(b.baleCost)}</td>
                        <td className="py-2 text-center">{bProducts.length}</td>
                        <td className="py-2 text-center">{soldProducts.length}</td>
                        <td className="py-2 text-right">{formatCurrency(revenue)}</td>
                        <td className="py-2 text-right font-medium text-green-600">{formatCurrency(revenue - cost)}</td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        );
      }
      case 'profit-loss': {
        const revenue = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);
        const productCost = filteredOrders.reduce((s, o) =>
          s + o.items.reduce((is, i) => {
            const p = products.find(pr => pr.id === i.productId);
            return is + (p?.costPrice || 0) * i.quantity;
          }, 0), 0);
        const grossProfit = revenue - productCost;
        const expTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);
        const netProfit = grossProfit - expTotal;
        return (
          <div>
            <h3 className="font-semibold mb-3">Profit & Loss ({formatDate(dateFrom)} - {formatDate(dateTo)})</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b"><span>Revenue</span><span className="font-medium text-green-600">{formatCurrency(revenue)}</span></div>
              <div className="flex justify-between py-2 border-b"><span>Product Cost</span><span className="font-medium text-orange-600">-{formatCurrency(productCost)}</span></div>
              <div className="flex justify-between py-2 border-b font-medium"><span>Gross Profit</span><span className="text-blue-600">{formatCurrency(grossProfit)}</span></div>
              <div className="flex justify-between py-2 border-b"><span>Operating Expenses</span><span className="font-medium text-red-600">-{formatCurrency(expTotal)}</span></div>
              <div className="flex justify-between py-3 text-lg font-bold border-t-2"><span>Net Profit</span><span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(netProfit)}</span></div>
            </div>
          </div>
        );
      }
      case 'customer-history': {
        return (
          <div>
            <h3 className="font-semibold mb-3">Customer Purchase History</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">Customer</th><th className="text-right py-2">Orders</th><th className="text-right py-2">Total Spent</th></tr></thead>
              <tbody>
                {customers.map(c => {
                  const cOrders = orders.filter(o => o.customerId === c.id && o.orderStatus !== 'Cancelled');
                  const total = cOrders.reduce((s, o) => s + o.totalAmount, 0);
                  if (cOrders.length === 0) return null;
                  return (
                    <tr key={c.id} className="border-b border-gray-50">
                      <td className="py-2">{c.name}</td>
                      <td className="py-2 text-right">{cOrders.length}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(total)}</td>
                    </tr>
                  );
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
        );
      }
      default: return null;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      {/* Date Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">To:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" />
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {reports.map(r => (
          <button key={r.id} onClick={() => setActiveReport(r.id)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeReport === r.id ? 'bg-[#0057B8] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <i className={`fas ${r.icon} mr-1`}></i>{r.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {renderReport()}
      </div>
    </div>
  );
}
