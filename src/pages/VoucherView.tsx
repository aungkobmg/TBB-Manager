import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, message, Spin, Space } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import { fetchOrder, formatCurrency, formatDate } from '../utils/storage';
import { settingsApi } from '../api/services';
import type { Order } from '../utils/storage';
import type { Settings } from '../utils/storage';

const { Title, Text } = Typography;

export default function VoucherView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        fetchOrder(Number(id)),
        settingsApi.get()
      ])
        .then(([orderRes, settingsRes]) => {
          setOrder(orderRes);
          setSettings(settingsRes.data as unknown as Settings | null);
        })
        .catch(() => message.error('Failed to load voucher'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Card><Spin size="large" /></Card>;
  if (!order) return <Card>Voucher not found</Card>;

  return (
    <div>
      <div className="no-print" style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/orders/${order.id}`)}>Back to Order</Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>Print Voucher</Button>
        </Space>
      </div>

      <Card className="voucher-print" style={{ maxWidth: 300, margin: '0 auto', fontFamily: 'monospace', fontSize: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>{settings?.businessName || 'The Bra Boutique'}</Title>
          <Text type="secondary">(Yangon)</Text>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div><Text strong>Voucher No:</Text> <Text style={{ color: '#0057B8' }}>{order.voucherNumber}</Text></div>
          <div><Text strong>Date:</Text> {formatDate(order.orderDate)}</div>
          <div><Text strong>Time:</Text> {new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>

        <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '8px 0', marginBottom: 12 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>CUSTOMER</div>
          <div>Name: {order.customerNameSnapshot}</div>
          <div>Phone: {order.phoneSnapshot}</div>
          <div>Address: {order.shippingAddressSnapshot}</div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>ITEMS</div>
          <table style={{ width: '100%', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ccc' }}>
                <th style={{ textAlign: 'left', padding: '4px 0' }}>Code</th>
                <th style={{ textAlign: 'center', padding: '4px 0' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '4px 0' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '4px 0' }}>{item.productCodeSnapshot}</td>
                  <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '4px 0' }}>{formatCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ borderTop: '1px dashed #ccc', paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Subtotal</Text>
            <Text>{formatCurrency(order.subtotal)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text>Delivery Fee</Text>
            <Text>{formatCurrency(order.deliveryFee)}</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 14, marginTop: 8, borderTop: '1px solid #ccc', paddingTop: 8 }}>
            <Text>TOTAL</Text>
            <Text style={{ color: '#0057B8' }}>{formatCurrency(order.totalAmount)}</Text>
          </div>
        </div>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <div><Text strong>Payment:</Text> {order.paymentMethod}</div>
          <div style={{ marginTop: 16, fontSize: 11 }}>
            <div>Facebook: {settings?.facebook || 'The Bra Boutique (Yangon)'}</div>
            <div>Phone: {settings?.phone || '09-xxxxxxxxx'}</div>
            <div style={{ marginTop: 8, fontWeight: 'bold' }}>{settings?.voucherFooter || 'Thank You For Shopping!'}</div>
          </div>
        </div>
      </Card>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .voucher-print {
            box-shadow: none !important;
            border: none !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body { margin: 0; padding: 0; }
          @page { size: 80mm auto; margin: 0; }
        }
      `}</style>
    </div>
  );
}
