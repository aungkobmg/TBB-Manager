import { useParams, Link } from 'react-router-dom';
import { getOrder, getSettings, formatCurrency, formatDate } from '../utils/storage';

export default function VoucherView() {
  const { id } = useParams();
  const order = getOrder(Number(id));
  const settings = getSettings();

  if (!order) return <div className="text-center py-12 text-gray-400">Voucher not found</div>;

  const handlePrint = () => { window.print(); };

  const now = new Date(order.createdAt);
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      {/* Screen controls - hidden on print */}
      <div className="no-print flex items-center justify-between mb-6">
        <div>
          <Link to={`/orders/${order.id}`} className="text-sm text-gray-500 hover:text-gray-700"><i className="fas fa-arrow-left mr-1"></i>Back to Order</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Voucher: {order.voucherNumber}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-[#0057B8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#003d82]">
            <i className="fas fa-print mr-2"></i>Print Receipt
          </button>
        </div>
      </div>

      {/* Thermal Receipt - Print Area */}
      <div className="print-area receipt mx-auto bg-white border border-gray-200 rounded-lg p-6 max-w-xs" id="thermal-receipt">
        {/* Header */}
        <div className="receipt-header text-center mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">{settings.businessName}</h2>
        </div>

        <div className="receipt-divider"></div>

        {/* Voucher Info */}
        <div className="text-center mb-2">
          <p className="text-xs text-gray-600">Voucher No:</p>
          <p className="font-bold text-sm">{order.voucherNumber}</p>
          <p className="text-xs mt-1">Date: {formatDate(order.orderDate)}</p>
          <p className="text-xs">Time: {timeStr}</p>
        </div>

        <div className="receipt-divider"></div>

        {/* Customer */}
        <div className="mb-2">
          <p className="text-xs font-bold mb-1">CUSTOMER</p>
          <p className="text-xs">Name: {order.customerNameSnapshot}</p>
          <p className="text-xs">Phone: {order.phoneSnapshot}</p>
          {order.shippingAddressSnapshot && (
            <div className="text-xs">
              <span>Address: </span>
              <span>{order.shippingAddressSnapshot}</span>
            </div>
          )}
        </div>

        <div className="receipt-divider"></div>

        {/* Items */}
        <div className="mb-2">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span>Code</span>
            <span>Qty</span>
            <span>Amount</span>
          </div>
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-xs py-0.5">
              <span className="font-mono">{item.productCodeSnapshot}</span>
              <span>{item.quantity}</span>
              <span>{item.lineTotal.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="receipt-divider"></div>

        {/* Summary */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Subtotal</span>
            <span>{order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Delivery Fee</span>
            <span>{order.deliveryFee.toLocaleString()}</span>
          </div>
          <div className="receipt-divider"></div>
          <div className="flex justify-between text-sm font-bold">
            <span>TOTAL</span>
            <span>{order.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Payment */}
        <div className="text-xs mb-2">
          <p>Payment: {order.paymentMethod}</p>
        </div>

        <div className="receipt-divider"></div>

        {/* Footer */}
        <div className="text-center text-xs mt-2 space-y-1">
          <p>Facebook: {settings.facebook}</p>
          <p>Phone: {settings.phone}</p>
          <p className="mt-2 font-medium">{settings.voucherFooter}</p>
        </div>
      </div>

      {/* Preview on screen (wider version) */}
      <div className="no-print mt-8 max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-center font-bold text-lg mb-1">{settings.businessName}</h2>
        <p className="text-center text-sm text-gray-500 mb-4">Voucher: {order.voucherNumber}</p>

        <div className="space-y-3 text-sm">
          <div className="border-b pb-2">
            <p className="font-medium">{order.customerNameSnapshot}</p>
            <p className="text-gray-600">{order.phoneSnapshot}</p>
            <p className="text-gray-600 text-xs">{order.shippingAddressSnapshot}</p>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 text-xs text-gray-500">Code</th>
                <th className="text-center py-1 text-xs text-gray-500">Qty</th>
                <th className="text-right py-1 text-xs text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="py-1 font-mono text-[#0057B8]">{item.productCodeSnapshot}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Delivery Fee</span><span>{formatCurrency(order.deliveryFee)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span className="text-[#0057B8]">{formatCurrency(order.totalAmount)}</span></div>
          </div>

          <div className="text-center text-sm text-gray-500 border-t pt-3">
            <p>Payment: {order.paymentMethod}</p>
            <p className="mt-2">Facebook: {settings.facebook}</p>
            <p>Phone: {settings.phone}</p>
            <p className="mt-2 font-medium">{settings.voucherFooter}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
