import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useToast, useAuth } from '../App';
import { getOrder, updateOrder, formatCurrency, formatDate, logActivity } from '../utils/storage';

export default function OrderDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(getOrder(Number(id)));

  if (!order) return <div className="text-center py-12 text-gray-400">Order not found</div>;

  const handleStatusChange = (status: any) => {
    updateOrder(order!.id, { orderStatus: status });
    logActivity(user!.userId, 'Order Updated', 'order', order!.id, `Status changed to ${status}`);
    setOrder(getOrder(order!.id));
    showToast(`Order status updated to ${status}.`);
  };

  const handleCancel = () => {
    if (!confirm('Are you sure you want to cancel this order? Products will be released.')) return;
    updateOrder(order!.id, { orderStatus: 'Cancelled' });
    logActivity(user!.userId, 'Order Cancelled', 'order', order!.id, `Order ${order!.voucherNumber} cancelled`);
    // Release products
    order!.items.forEach(item => {
      const products = JSON.parse(localStorage.getItem('tbb_products') || '[]');
      const idx = products.findIndex((p: any) => p.id === item.productId);
      if (idx >= 0) { products[idx].status = 'Available'; localStorage.setItem('tbb_products', JSON.stringify(products)); }
    });
    setOrder(getOrder(order!.id));
    showToast('Order cancelled. Products released.');
  };

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/orders" className="text-sm text-gray-500 hover:text-gray-700"><i className="fas fa-arrow-left mr-1"></i>Back to Orders</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{order.voucherNumber}</h1>
        </div>
        <div className="flex gap-2">
          <Link to={`/voucher/${order.id}`} className="bg-[#0057B8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#003d82]">
            <i className="fas fa-print mr-2"></i>View Voucher
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Order Items</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-600">Product Code</th>
                  <th className="text-right py-2 font-medium text-gray-600">Qty</th>
                  <th className="text-right py-2 font-medium text-gray-600">Unit Price</th>
                  <th className="text-right py-2 font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-2 font-mono text-[#0057B8]">{item.productCodeSnapshot}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-gray-200 mt-3 pt-3 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Delivery Fee</span><span>{formatCurrency(order.deliveryFee)}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Total</span><span className="text-[#0057B8]">{formatCurrency(order.totalAmount)}</span></div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Customer Information</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Name:</span> <span className="font-medium">{order.customerNameSnapshot}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{order.phoneSnapshot}</span></div>
              <div className="col-span-2"><span className="text-gray-500">Address:</span> <span className="font-medium">{order.shippingAddressSnapshot}</span></div>
            </div>
          </div>
        </div>

        {/* Right - Order Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Order Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{formatDate(order.orderDate)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment</span><span>{order.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment Status</span><span>{order.paymentStatus}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span>{order.deliveryCompany || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tracking</span><span>{order.trackingNumber || '-'}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Status</h2>
            <div className="mb-3">
              <span className={`px-3 py-1 rounded-full text-sm ${statusColors[order.orderStatus]}`}>{order.orderStatus}</span>
            </div>
            <div className="space-y-2">
              {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].map(s => (
                <button key={s} onClick={() => handleStatusChange(s)} disabled={order.orderStatus === 'Cancelled'} className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${order.orderStatus === s ? 'border-[#0057B8] bg-blue-50 text-[#0057B8]' : 'border-gray-200 hover:bg-gray-50'} disabled:opacity-50`}>
                  {s}
                </button>
              ))}
              {order.orderStatus !== 'Cancelled' && (
                <button onClick={handleCancel} className="w-full text-left px-3 py-2 rounded-lg text-sm border border-red-200 text-red-600 hover:bg-red-50">
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
