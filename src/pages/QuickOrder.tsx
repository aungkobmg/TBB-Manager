import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, AutoComplete, Button, Table, Select, InputNumber, Typography, message, Space, Row, Col, Divider, Alert } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { searchProductByCode, searchCustomers, createCustomer, createOrder, formatCurrency } from '../utils/storage';
import type { Product, Customer } from '../utils/storage';

const { Title, Text } = Typography;

interface OrderItem {
  product: Product;
  quantity: number;
}

export default function QuickOrder() {
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [productCode, setProductCode] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [deliveryCompany, setDeliveryCompany] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid' | 'Partial'>('Unpaid');
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Search customers
  const handleCustomerSearch = async (value: string) => {
    setCustomerSearch(value);
    if (value.length < 2) { setCustomerOptions([]); return; }
    try {
      const results = await searchCustomers(value);
      setCustomerOptions(results.map(c => ({ value: c.id, label: `${c.name} - ${c.phone || ''}` })));
    } catch {}
  };

  const handleCustomerSelect = async (value: any) => {
    // Fetch full customer data
    const results = await searchCustomers('');
    const customer = results.find(c => c.id === value);
    if (customer) {
      setSelectedCustomer(customer);
      setShippingAddress(customer.address || '');
    }
  };

  // Add product by code
  const handleAddProduct = async () => {
    if (!productCode.trim()) return;
    try {
      const product = await searchProductByCode(productCode.trim());
      if (!product) {
        message.error('Product not found');
        setProductCode('');
        return;
      }
      if (product.status === 'Sold') {
        message.error('This product is already sold');
        setProductCode('');
        return;
      }
      if (product.status === 'Reserved') {
        message.error('This product is currently reserved');
        setProductCode('');
        return;
      }
      if (orderItems.find(i => i.product.id === product.id)) {
        message.error('Product already in order');
        setProductCode('');
        return;
      }
      setOrderItems([...orderItems, { product, quantity: 1 }]);
      setProductCode('');
      message.success(`Added ${product.productCode}`);
    } catch (err) {
      message.error('Product not found');
    }
  };

  const removeItem = (productId: number) => {
    setOrderItems(orderItems.filter(i => i.product.id !== productId));
  };

  const subtotal = orderItems.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0);
  const total = subtotal + deliveryFee;

  const handleSubmit = async () => {
    if (!selectedCustomer) { message.error('Please select a customer'); return; }
    if (orderItems.length === 0) { message.error('Please add at least one product'); return; }

    setLoading(true);
    try {
      const order = await createOrder({
        customerId: selectedCustomer.id,
        productCodes: orderItems.map(i => i.product.productCode),
        deliveryFee,
        deliveryCompany: deliveryCompany || undefined,
        paymentMethod,
        paymentStatus,
        shippingAddress,
      });
      message.success(`Order created: ${order.voucherNumber}`);
      navigate(`/voucher/${order.id}`);
    } catch (err: any) {
      message.error(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>Quick Order</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {/* Customer Selection */}
          <Card title="Customer" style={{ marginBottom: 16 }}>
            <AutoComplete
              style={{ width: '100%' }}
              options={customerOptions}
              onSelect={handleCustomerSelect}
              onSearch={handleCustomerSearch}
              placeholder="Search customer by name, phone, or Facebook..."
            >
              <Input.Search size="large" enterButton={<SearchOutlined />} />
            </AutoComplete>
            {selectedCustomer && (
              <div style={{ marginTop: 12, padding: 12, background: '#f6ffed', borderRadius: 6 }}>
                <Text strong>{selectedCustomer.name}</Text>
                <br />
                <Text type="secondary">{selectedCustomer.phone} | {selectedCustomer.facebookName}</Text>
              </div>
            )}
            <Input.TextArea
              style={{ marginTop: 12 }}
              placeholder="Shipping Address"
              value={shippingAddress}
              onChange={e => setShippingAddress(e.target.value)}
              rows={2}
            />
          </Card>

          {/* Product Code Entry */}
          <Card title="Add Products" style={{ marginBottom: 16 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                size="large"
                placeholder="Enter Product Code (e.g., TBB-000001)"
                value={productCode}
                onChange={e => setProductCode(e.target.value.toUpperCase())}
                onPressEnter={handleAddProduct}
                style={{ fontFamily: 'monospace' }}
              />
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAddProduct}>Add</Button>
            </Space.Compact>
          </Card>

          {/* Order Items */}
          <Card title={`Order Items (${orderItems.length})`}>
            <Table
              dataSource={orderItems}
              rowKey={i => i.product.id}
              pagination={false}
              size="small"
              locale={{ emptyText: 'No products added yet' }}
              columns={[
                { title: 'Code', render: (_, i) => <Text strong style={{ fontFamily: 'monospace', color: '#0057B8' }}>{i.product.productCode}</Text> },
                { title: 'Name', render: (_, i) => i.product.productName },
                { title: 'Qty', dataIndex: 'quantity', align: 'center' },
                { title: 'Price', align: 'right', render: (_, i) => formatCurrency(i.product.sellingPrice) },
                { title: 'Total', align: 'right', render: (_, i) => formatCurrency(i.product.sellingPrice * i.quantity) },
                { title: '', render: (_, i) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeItem(i.product.id)} /> },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* Delivery & Payment */}
          <Card title="Delivery" style={{ marginBottom: 16 }}>
            <Select style={{ width: '100%', marginBottom: 12 }} placeholder="Delivery Company" value={deliveryCompany || undefined} onChange={setDeliveryCompany} allowClear>
              <Select.Option value="Royal Express">Royal Express</Select.Option>
              <Select.Option value="BeeXpress">BeeXpress</Select.Option>
              <Select.Option value="Ninja Van">Ninja Van</Select.Option>
              <Select.Option value="Wepost">Wepost</Select.Option>
            </Select>
            <InputNumber style={{ width: '100%' }} placeholder="Delivery Fee" value={deliveryFee} onChange={v => setDeliveryFee(v || 0)} min={0} addonAfter="MMK" />
          </Card>

          <Card title="Payment" style={{ marginBottom: 16 }}>
            <Select style={{ width: '100%', marginBottom: 12 }} value={paymentMethod} onChange={setPaymentMethod}>
              <Select.Option value="COD">COD</Select.Option>
              <Select.Option value="KBZ Pay">KBZ Pay</Select.Option>
              <Select.Option value="Wave Pay">Wave Pay</Select.Option>
              <Select.Option value="AYA Pay">AYA Pay</Select.Option>
            </Select>
            <Select style={{ width: '100%' }} value={paymentStatus} onChange={setPaymentStatus}>
              <Select.Option value="Unpaid">Unpaid</Select.Option>
              <Select.Option value="Paid">Paid</Select.Option>
              <Select.Option value="Partial">Partial</Select.Option>
            </Select>
          </Card>

          {/* Summary */}
          <Card>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <Text>Subtotal</Text><Text>{formatCurrency(subtotal)}</Text>
            </div>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <Text>Delivery Fee</Text><Text>{formatCurrency(deliveryFee)}</Text>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold' }}>
              <Text strong>Total</Text><Text strong style={{ color: '#0057B8' }}>{formatCurrency(total)}</Text>
            </div>
            <Button type="primary" size="large" block style={{ marginTop: 16 }} onClick={handleSubmit} loading={loading} disabled={!selectedCustomer || orderItems.length === 0}>
              Place Order & Generate Voucher
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
