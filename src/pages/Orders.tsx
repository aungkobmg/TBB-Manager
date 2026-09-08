import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, formatCurrency, formatDate } from '../utils/storage';

export default function Orders() {
  const [orders, setOrders] = useState(getOrders());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  const filtered = orders.filter(o => {
    const s = search.toLowerCase();
    const matchSearch = !s || o.voucherNumber.toLowerCase().includes(s) || o.customerNameSnapshot.toLowerCase().includes(s) || o.phoneSnapshot.includes(s);
    const matchStatus = !filterStatus || o.orderStatus === filterStatus;
    const matchPayment = !filterPayment || o.paymentMethod === filterPayment;
    return matchSearch && matchStatus && matchPayment;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Confirmed: 'bg-blue-100 text-blue-700',
    Packed: 'bg-purple-100 text-purple-700',
    Shipped: 'bg-indigo-100 text-indigo-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Link to="/quick-order" className="bg-[#0057B8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#003d82]">
          <i className="fas fa-bolt mr-2"></i>New Order
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Search voucher, customer, phone..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0057B8] outline-none" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Packed">Packed</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">All Payment</option>
          <option value="COD">COD</option>
          <option value="KBZ Pay">KBZ Pay</option>
          <option value="Wave Pay">Wave Pay</option>
          <option value="AYA Pay">AYA Pay</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Voucher</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Payment</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No orders found</td></tr>
            ) : filtered.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-medium text-[#0057B8]">{o.voucherNumber}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(o.orderDate)}</td>
                <td className="px-4 py-3 text-gray-900">{o.customerNameSnapshot}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.totalAmount)}</td>
                <td className="px-4 py-3 text-center text-gray-600">{o.paymentMethod}</td>
                <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[o.orderStatus]}`}>{o.orderStatus}</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link to={`/orders/${o.id}`} className="text-[#0057B8] hover:underline text-xs">View</Link>
                  <Link to={`/voucher/${o.id}`} className="text-gray-600 hover:underline text-xs">Voucher</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
