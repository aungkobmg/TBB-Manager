import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, AutoComplete, Table, Button, Select, InputNumber, Space, Typography, Row, Col, Statistic, Tag, Divider, Alert } from 'antd';
import { PlusOutlined, UserOutlined, ShoppingCartOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useToast, useAuth } from '../App';
import { getProducts, getProductByCode, getCustomers, createCustomer, createOrder, formatCurrency, logActivity } from '../utils/storage';

const { Title, Text } = Typography;

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
  const codeInputRef = useRef<any>(null);

  // Customer state
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', address: '', township: '', city: '' });
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);

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
    if (customerSearch.length >= 1 && !selectedCustomer) {
      const s = customerSearch.toLowerCase();
      const customers = getCustomers().filter(c =>
        c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.facebookName.toLowerCase().includes(s)
      ).slice(0, 8);
      setCustomerOptions(customers.map(c => ({
        value: c.name,
        label: (
          <div>
            <div style={{ fontWeight: 500 }}>{c.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{c.phone} {c.facebookName && `• ${c.facebookName}`}</Text>
          </div>
        ),
        customer: c,
      })));
    } else {
      setCustomerOptions([]);
    }
  }, [customerSearch, selectedCustomer]);

  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShippingAddress([customer.address, customer.township, customer.city].filter(Boolean).join(', '));
    setCustomerOptions([]);
    setShowNewCustomer(false);
    setTimeout(() => codeInputRef.current?.focus(), 100);
  };

  const handleCreateCustomer = () => {
    if (!newCustomerForm.name) {
      showToast('Customer name is required', 'error');
      return;
    }
    const c = createCustomer({ ...newCustomerForm, facebookName: '', notes: '' });
    logActivity(user!.userId, 'Customer Created', 'customer', c.id, `Created from Quick Order: ${c.name}`);
    selectCustomer(c);
    setNewCustomerForm({ name: '', phone: '', address: '', township: '', city: '' });
    showToast('Customer created');
  };

  const handleAddProduct = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const code = productCode.trim().toUpperCase();
    if (!code) return;

    if (cart.find(item => item.productCode === code)) {
      showToast('Product already in cart', 'error');
      setProductCode('');
      return;
    }

    const product = getProductByCode(code);
    if (!product) {
      showToast('Product not found', 'error');
      setProductCode('');
      return;
    }

    if (product.status === 'Sold') {
      showToast('This product is already sold', 'error');
      setProductCode('');
      return;
    }

    if (product.status === 'Reserved') {
      showToast('This product is currently reserved', 'error');
      setProductCode('');
      return;
    }

    if (product.status === 'Cancelled') {
      showToast('This product is cancelled', 'error');
      setProductCode('');
      return;
    }

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
    if (!selectedCustomer) {
      showToast('Please select or create a customer', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('Please add at least one product', 'error');
      return;
    }

    for (const item of cart) {
      const product = getProductByCode(item.productCode);
      if (!product || product.status !== 'Available') {
        showToast(`${item.productCode} is no longer available`, 'error');
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
        orderId: 0,
        productId: item.productId,
        productCodeSnapshot: item.productCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
    });

    logActivity(user!.userId, 'Order Created', 'order', order.id, `Order ${order.voucherNumber} created for ${selectedCustomer.name}`);
    showToast(`Order ${order.voucherNumber} created!`);
    navigate(`/voucher/${order.id}`);
  };

  const cartColumns = [
    {
      title: 'Product Code',
      dataIndex: 'productCode',
      key: 'productCode',
      render: (text: string) => <span style={{ fontFamily: 'monospace', color: '#0057B8', fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center' as const,
      width: 80,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right' as const,
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Total',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      align: 'right' as const,
      render: (total: number) => <span style={{ fontWeight: 500 }}>{formatCurrency(total)}</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: CartItem) => (
        <Button type="text" size="small" danger onClick={() => removeFromCart(record.productId)}>
          ✕
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <ThunderboltOutlined style={{ color: '#0057B8', marginRight: 8 }} />
          Quick Order
        </Title>
      </div>

      <Row gutter={[16, 16]}>
        {/* Left Column - Customer & Products */}
        <Col xs={24} lg={16}>
          {/* Customer Selection */}
          <Card title={<><UserOutlined style={{ marginRight: 8 }} />Customer</>} style={{ marginBottom: 16 }}>
            {selectedCustomer ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                <div>
                  <Text strong>{selectedCustomer.name}</Text>
                  <div><Text type="secondary">{selectedCustomer.phone}</Text></div>
                </div>
                <Button type="link" danger onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}>
                  Change
                </Button>
              </div>
            ) : (
              <>
                <AutoComplete
                  style={{ width: '100%' }}
                  options={customerOptions}
                  onSelect={(value, option) => selectCustomer(option.customer)}
                  onSearch={setCustomerSearch}
                  value={customerSearch}
                >
                  <Input.Search
                    size="large"
                    placeholder="Search customer by name, phone, or Facebook..."
                    enterButton={false}
                  />
                </AutoComplete>
                <Button type="link" icon={<PlusOutlined />} onClick={() => setShowNewCustomer(!showNewCustomer)} style={{ marginTop: 8, padding: 0 }}>
                  Create New Customer
                </Button>
              </>
            )}

            {showNewCustomer && !selectedCustomer && (
              <Card size="small" style={{ marginTop: 12, background: '#fafafa' }}>
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Input
                      placeholder="Name *"
                      value={newCustomerForm.name}
                      onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                    />
                  </Col>
                  <Col span={12}>
                    <Input
                      placeholder="Phone"
                      value={newCustomerForm.phone}
                      onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    />
                  </Col>
                  <Col span={24}>
                    <Input
                      placeholder="Address"
                      value={newCustomerForm.address}
                      onChange={e => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                    />
                  </Col>
                  <Col span={12}>
                    <Input
                      placeholder="Township"
                      value={newCustomerForm.township}
                      onChange={e => setNewCustomerForm({ ...newCustomerForm, township: e.target.value })}
                    />
                  </Col>
                  <Col span={12}>
                    <Input
                      placeholder="City"
                      value={newCustomerForm.city}
                      onChange={e => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                    />
                  </Col>
                  <Col span={24}>
                    <Button type="primary" onClick={handleCreateCustomer} block>
                      Create & Select Customer
                    </Button>
                  </Col>
                </Row>
              </Card>
            )}

            {selectedCustomer && (
              <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Shipping Address</Text>
                <Input.TextArea
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  rows={2}
                  placeholder="Full shipping address..."
                  style={{ marginTop: 4 }}
                />
              </div>
            )}
          </Card>

          {/* Product Code Input */}
          <Card title={<><ShoppingCartOutlined style={{ marginRight: 8 }} />Add Products</>} style={{ marginBottom: 16 }}>
            <Input
              ref={codeInputRef}
              size="large"
              value={productCode}
              onChange={e => setProductCode(e.target.value.toUpperCase())}
              onKeyDown={handleAddProduct}
              placeholder="Enter Product Code (e.g. TBB-000001) and press Enter"
              style={{ fontFamily: 'monospace' }}
              prefix={<span style={{ color: '#0057B8', fontWeight: 600 }}>→</span>}
            />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              Press Enter to add product to order
            </Text>
          </Card>

          {/* Cart */}
          <Card title={`Order Items (${cart.length})`}>
            <Table
              columns={cartColumns}
              dataSource={cart}
              rowKey="productId"
              pagination={false}
              size="small"
              locale={{ emptyText: 'No items added yet. Enter a product code above.' }}
            />
          </Card>
        </Col>

        {/* Right Column - Order Summary */}
        <Col xs={24} lg={8}>
          <Card
            title="Order Summary"
            style={{ position: 'sticky', top: 80 }}
          >
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Delivery Company</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={deliveryCompany || undefined}
                onChange={setDeliveryCompany}
                placeholder="Select delivery company"
                allowClear
              >
                <Select.Option value="Royal Express">Royal Express</Select.Option>
                <Select.Option value="BeeXpress">BeeXpress</Select.Option>
                <Select.Option value="Ninja Van">Ninja Van</Select.Option>
                <Select.Option value="Wepost">Wepost</Select.Option>
              </Select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Delivery Fee (MMK)</Text>
              <InputNumber
                style={{ width: '100%', marginTop: 4 }}
                value={deliveryFee}
                onChange={v => setDeliveryFee(v || 0)}
                min={0}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Payment Method</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={paymentMethod}
                onChange={setPaymentMethod}
              >
                <Select.Option value="COD">COD</Select.Option>
                <Select.Option value="KBZ Pay">KBZ Pay</Select.Option>
                <Select.Option value="Wave Pay">Wave Pay</Select.Option>
                <Select.Option value="AYA Pay">AYA Pay</Select.Option>
              </Select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Payment Status</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={paymentStatus}
                onChange={setPaymentStatus}
              >
                <Select.Option value="Unpaid">Unpaid</Select.Option>
                <Select.Option value="Paid">Paid</Select.Option>
                <Select.Option value="Partial">Partial</Select.Option>
              </Select>
            </div>

            <Divider />

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text>Subtotal</Text>
                <Text strong>{formatCurrency(subtotal)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text>Delivery Fee</Text>
                <Text strong>{formatCurrency(deliveryFee)}</Text>
              </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text strong style={{ fontSize: 18 }}>Total</Text>
              <Text strong style={{ fontSize: 18, color: '#0057B8' }}>{formatCurrency(total)}</Text>
            </div>

            <Button
              type="primary"
              size="large"
              block
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || !selectedCustomer}
              icon={<ThunderboltOutlined />}
            >
              Place Order & Generate Voucher
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
