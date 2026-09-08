import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast, useAuth } from '../App';
import { getProducts, getProductByCode, getCustomers, createCustomer, createOrder, formatCurrency, logActivity } from '../utils/storage';

interface CartItem {
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export default function QuickOrder() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Customer state
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', facebookName: '', address: '', township: '', city: '', notes: '' });
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);

  // Product state
  const [productCode, setProductCode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Order details
  const [deliveryCompany, setDeliveryCompany] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid' | 'Partial'>('Unpaid');
  const [shippingAddress, setShippingAddress] = useState('');

  // Search customers
  useEffect(() => {
    if (customerSearch.length >= 2) {
      const s = customerSearch.toLowerCase();
      const customers = getCustomers().filter(c =>
        c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.facebookName.toLowerCase().includes(s)
      ).slice(0, 5);
      setCustomerSuggestions(customers);
    } else {
      setCustomerSuggestions([]);
    }
  }, [customerSearch]);

  const selectCustomer = (c: any) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setShippingAddress([c.address, c.township, c.city].filter(Boolean).join(', '));
    setCustomerSuggestions([]);
    codeInputRef.current?.focus();
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name) { showToast('Customer name is required.', 'error'); return; }
    const c = createCustomer({ ...newCustomer, notes: '' });
    logActivity(user!.userId, 'Customer Created', 'customer', c.id, `Created from Quick Order: ${c.name}`);
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setShippingAddress([c.address, c.township, c.city].filter(Boolean).join(', '));
    setShowCustomerForm(false);
    setNewCustomer({ name: '', phone: '', facebookName: '', address: '', township: '', city: '', notes: '' });
    showToast('Customer created.');
    codeInputRef.current?.focus();
  };

  const handleAddProduct = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const code = productCode.trim().toUpperCase();
    if (!code) return;

    // Check if already in cart
    if (cart.find(item => item.productCode === code)) {
      showToast('Product already in cart.', 'error');
      setProductCode('');
      return;
    }

    const product = getProductByCode(code);
    if (!product) {
      showToast('Product not found.', 'error');
      setProductCode('');
      return;
    }

    if (product.status === 'Sold') {
      showToast('This product is already sold.', 'error');
      setProductCode('');
      return;
    }

    if (product.status === 'Reserved') {
      showToast('This product is currently reserved.', 'error');
      setProductCode('');
      return;
    }

    if (product.status === 'Cancelled') {
      showToast('This product is cancelled.', 'error');
      setProductCode('');
      return;
    }

    // Add to cart
    const item: CartItem = {
      productId: product.id,
      productCode: product.productCode,
      productName: product.productName,
      quantity: 1,
      unitPrice: product.sellingPrice,
      lineTotal: product.sellingPrice,
    };
    setCart(prev => [...prev, item]);
    setProductCode('');
    showToast(`Added ${product.productCode}`);
    codeInputRef.current?.focus();
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((s, item) => s + item.lineTotal, 0);
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = () => {
    if (!selectedCustomer) { showToast('Please select or create a customer.', 'error'); return; }
    if (cart.length === 0) { showToast('Please add at least one product.', 'error'); return; }

    // Final verification that all products are still available
    for (const item of cart) {
      const product = getProductByCode(item.productCode);
      if (!product || product.status !== 'Available') {
        showToast(`${item.productCode} is no longer available. Please remove it and try again.`, 'error');
        return;
      }
    }

    const order = createOrder({
      orderDate: new Date().toISOString(),
      customerId: selectedCustomer.id,
      customerNameSnapshot: selectedCustomer.name,
      phoneSnapshot: selectedCustomer.phone,
      shippingAddressSnapshot: shippingAddress || selectedCustomer.address,
      deliveryCompany,
      trackingNumber: '',
      paymentMethod,
      deliveryFee,
      subtotal,
      totalAmount: total,
      orderStatus: 'Pending',
      paymentStatus,
      items: cart.map((item, idx) => ({
        id: Date.now() + idx,
        orderId: 0, // Will be set by createOrder
        productId: item.productId,
        productCodeSnapshot: item.productCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
    });

    logActivity(user!.userId, 'Order Created', 'order', order.id, `Order ${order.voucherNumber} created for ${selectedCustomer.name}`);
    showToast(`Order ${order.voucherNumber} created!`);

    // Navigate to voucher
    navigate(`/voucher/${order.id}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        <i className="fas fa-bolt text-[#0057B8] mr-2"></i>Quick Order
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Customer & Products */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3"><i className="fas fa-user mr-2 text-[#0057B8]"></i>Customer</h2>
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                </div>
                <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="text-sm text-red-500 hover:underline">Change</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Search customer by name, phone, or Facebook..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0057B8] outline-none"
                  autoFocus
                />
                {customerSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10">
                    {customerSuggestions.map(c => (
                      <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone} {c.facebookName ? `• ${c.facebookName}` : ''}</p>
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowCustomerForm(!showCustomerForm)} className="mt-2 text-sm text-[#0057B8] hover:underline">
                  <i className="fas fa-plus mr-1"></i>New Customer
                </button>
              </div>
            )}

            {showCustomerForm && !selectedCustomer && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Name *" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="text" placeholder="Phone" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                </div>
                <input type="text" placeholder="Address" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Township" value={newCustomer.township} onChange={e => setNewCustomer({...newCustomer, township: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="text" placeholder="City" value={newCustomer.city} onChange={e => setNewCustomer({...newCustomer, city: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                </div>
                <button onClick={handleCreateCustomer} className="bg-[#0057B8] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#003d82]">Create & Select</button>
              </div>
            )}

            {selectedCustomer && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Shipping Address</label>
                <textarea value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="Full shipping address..." />
              </div>
            )}
          </div>

          {/* Product Code Input */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3"><i className="fas fa-tags mr-2 text-[#0057B8]"></i>Products</h2>
            <div className="flex gap-2">
              <input
                ref={codeInputRef}
                type="text"
                value={productCode}
                onChange={e => setProductCode(e.target.value.toUpperCase())}
                onKeyDown={handleAddProduct}
                placeholder="Enter Product Code (e.g. TBB-000001) and press Enter"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#0057B8] outline-none"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Press Enter to add product to order</p>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3"><i className="fas fa-shopping-cart mr-2 text-[#0057B8]"></i>Order Items ({cart.length})</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No items added yet. Enter a product code above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-600">Code</th>
                      <th className="text-right py-2 font-medium text-gray-600">Qty</th>
                      <th className="text-right py-2 font-medium text-gray-600">Price</th>
                      <th className="text-right py-2 font-medium text-gray-600">Total</th>
                      <th className="py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.productId} className="border-b border-gray-50">
                        <td className="py-2 font-mono text-[#0057B8]">{item.productCode}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(item.lineTotal)}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600"><i className="fas fa-times"></i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right - Order Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
            <h2 className="font-semibold text-gray-900 mb-4"><i className="fas fa-receipt mr-2 text-[#0057B8]"></i>Order Summary</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Company</label>
                <select value={deliveryCompany} onChange={e => setDeliveryCompany(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select...</option>
                  <option value="Royal Express">Royal Express</option>
                  <option value="BeeXpress">BeeXpress</option>
                  <option value="Ninja Van">Ninja Van</option>
                  <option value="Wepost">Wepost</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Fee (MMK)</label>
                <input type="number" value={deliveryFee} onChange={e => setDeliveryFee(+e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="COD">COD</option>
                  <option value="KBZ Pay">KBZ Pay</option>
                  <option value="Wave Pay">Wave Pay</option>
                  <option value="AYA Pay">AYA Pay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
                <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total</span>
                <span className="text-[#0057B8]">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || !selectedCustomer}
              className="w-full mt-4 bg-[#0057B8] text-white py-3 rounded-lg font-medium hover:bg-[#003d82] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i className="fas fa-check mr-2"></i>Place Order & Generate Voucher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
