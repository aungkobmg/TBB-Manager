import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Button, Typography, message, Space, Row, Col, Statistic } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import { fetchOrder, formatCurrency, formatDate } from '../utils/storage';
import type { Order } from '../utils/storage';

const { Title, Text } = Typography;

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrder(Number(id))
        .then((res: any) => setOrder(res))
        .catch(() => message.error('Failed to load order'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <Card loading />;
  if (!order) return <Card>Order not found</Card>;

  const itemColumns = [
    { title: 'Product Code', dataIndex: 'productCodeSnapshot', key: 'code', render: (v: string) => <Text strong style={{ fontFamily: 'monospace' }}>{v}</Text> },
    { title: 'Qty', dataIndex: 'quantity', key: 'qty', align: 'center' as const },
    { title: 'Unit Price', dataIndex: 'unitPrice', key: 'price', align: 'right' as const, render: (v: number) => formatCurrency(v) },
    { title: 'Total', dataIndex: 'lineTotal', key: 'total', align: 'right' as const, render: (v: number) => formatCurrency(v) },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>Back</Button>
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => navigate(`/voucher/${order.id}`)}>View Voucher</Button>
      </Space>

      <Title level={3}>{order.voucherNumber}</Title>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="Order Items" style={{ marginBottom: 16 }}>
            <Table columns={itemColumns} dataSource={order.items} rowKey="id" pagination={false} size="small" />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space direction="vertical" size={4}>
                <div>Subtotal: <Text strong>{formatCurrency(order.subtotal)}</Text></div>
                <div>Delivery Fee: <Text strong>{formatCurrency(order.deliveryFee)}</Text></div>
                <div>Total: <Text strong style={{ fontSize: 18, color: '#0057B8' }}>{formatCurrency(order.totalAmount)}</Text></div>
              </Space>
            </div>
          </Card>

          <Card title="Customer Information">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Name">{order.customerNameSnapshot}</Descriptions.Item>
              <Descriptions.Item label="Phone">{order.phoneSnapshot}</Descriptions.Item>
              <Descriptions.Item label="Address">{order.shippingAddressSnapshot}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Order Details">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Date">{formatDate(order.orderDate)}</Descriptions.Item>
              <Descriptions.Item label="Payment">{order.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Tag color={order.paymentStatus === 'Paid' ? 'green' : 'orange'}>{order.paymentStatus}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Delivery">{order.deliveryCompany || '-'}</Descriptions.Item>
              <Descriptions.Item label="Tracking">{order.trackingNumber || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Status" style={{ marginTop: 16 }}>
            <Tag color={order.orderStatus === 'Delivered' ? 'green' : order.orderStatus === 'Cancelled' ? 'red' : 'gold'} style={{ fontSize: 16, padding: '8px 16px' }}>
              {order.orderStatus}
            </Tag>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
