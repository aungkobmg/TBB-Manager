import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Button, Space, Typography, Popconfirm, message, Divider, Row, Col } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, EditOutlined } from '@ant-design/icons';
import { useToast, useAuth } from '../App';
import { getOrder, updateOrder, formatCurrency, formatDate, logActivity } from '../utils/storage';

const { Title, Text } = Typography;

export default function OrderDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(getOrder(Number(id)));

  if (!order) return <div style={{ textAlign: 'center', padding: 48 }}><Text type="secondary">Order not found</Text></div>;

  const handleStatusChange = (status: any) => {
    updateOrder(order!.id, { orderStatus: status });
    logActivity(user!.userId, 'Order Updated', 'order', order!.id, `Status changed to ${status}`);
    setOrder(getOrder(order!.id));
    showToast(`Order status updated to ${status}`);
  };

  const handleCancel = () => {
    updateOrder(order!.id, { orderStatus: 'Cancelled' });
    logActivity(user!.userId, 'Order Cancelled', 'order', order!.id, `Order ${order!.voucherNumber} cancelled`);
    order!.items.forEach(item => {
      const products = JSON.parse(localStorage.getItem('tbb_products') || '[]');
      const idx = products.findIndex((p: any) => p.id === item.productId);
      if (idx >= 0) { products[idx].status = 'Available'; localStorage.setItem('tbb_products', JSON.stringify(products)); }
    });
    setOrder(getOrder(order!.id));
    showToast('Order cancelled. Products released.');
  };

  const statusColors: Record<string, string> = {
    Pending: 'gold',
    Confirmed: 'blue',
    Packed: 'purple',
    Shipped: 'geekblue',
    Delivered: 'green',
    Cancelled: 'red',
  };

  const itemColumns = [
    {
      title: 'Product Code',
      dataIndex: 'productCodeSnapshot',
      key: 'productCodeSnapshot',
      render: (text: string) => <span style={{ fontFamily: 'monospace', color: '#0057B8', fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center' as const,
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
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link to="/orders">
          <Button type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0, marginBottom: 8 }}>
            Back to Orders
          </Button>
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            {order.voucherNumber}
          </Title>
          <Space>
            <Link to={`/voucher/${order.id}`}>
              <Button type="primary" icon={<PrinterOutlined />}>
                View Voucher
              </Button>
            </Link>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
        {/* Left Column */}
        <div>
          {/* Order Items */}
          <Card title="Order Items" style={{ marginBottom: 16 }}>
            <Table
              columns={itemColumns}
              dataSource={order.items}
              rowKey="id"
              pagination={false}
              size="small"
              summary={() => (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <Text strong>Subtotal</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong>{formatCurrency(order.subtotal)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <Text>Delivery Fee</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text>{formatCurrency(order.deliveryFee)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <Text strong style={{ fontSize: 16 }}>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong style={{ fontSize: 16, color: '#0057B8' }}>{formatCurrency(order.totalAmount)}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              )}
            />
          </Card>

          {/* Customer Info */}
          <Card title="Customer Information">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Name">{order.customerNameSnapshot}</Descriptions.Item>
              <Descriptions.Item label="Phone">{order.phoneSnapshot}</Descriptions.Item>
              <Descriptions.Item label="Shipping Address">{order.shippingAddressSnapshot || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
        </Col>
        <Col xs={24} lg={8}>

        {/* Right Column */}
        <div>
          {/* Order Details */}
          <Card title="Order Details" style={{ marginBottom: 16 }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Date">{formatDate(order.orderDate)}</Descriptions.Item>
              <Descriptions.Item label="Payment Method">{order.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Tag color={order.paymentStatus === 'Paid' ? 'green' : order.paymentStatus === 'Partial' ? 'orange' : 'red'}>
                  {order.paymentStatus}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Delivery Company">{order.deliveryCompany || '-'}</Descriptions.Item>
              <Descriptions.Item label="Tracking Number">{order.trackingNumber || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Status Management */}
          <Card title="Order Status">
            <div style={{ marginBottom: 16 }}>
              <Tag color={statusColors[order.orderStatus]} style={{ fontSize: 14, padding: '4px 12px' }}>
                {order.orderStatus}
              </Tag>
            </div>
            <Space direction="vertical" style={{ width: '100%' }}>
              {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].map(status => (
                <Button
                  key={status}
                  type={order.orderStatus === status ? 'primary' : 'default'}
                  block
                  onClick={() => handleStatusChange(status)}
                  disabled={order.orderStatus === 'Cancelled'}
                >
                  {status}
                </Button>
              ))}
              {order.orderStatus !== 'Cancelled' && (
                <Popconfirm
                  title="Are you sure you want to cancel this order?"
                  description="Products will be released back to inventory."
                  onConfirm={handleCancel}
                  okText="Yes, Cancel"
                  cancelText="No"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger block>
                    Cancel Order
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Card>
        </div>
        </Col>
      </Row>
    </div>
  );
}
