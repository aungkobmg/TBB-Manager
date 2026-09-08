import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Typography, Row, Col, Statistic, Divider, Breadcrumb, Empty, Table, Timeline } from 'antd';
import { ArrowLeftOutlined, EditOutlined, HistoryOutlined, DollarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { getProduct, getOrders, getBale, formatCurrency, formatDate } from '../utils/storage';

const { Title, Text } = Typography;

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(getProduct(Number(id)));

  useEffect(() => {
    setProduct(getProduct(Number(id)));
  }, [id]);

  if (!product) {
    return <Empty description="Product not found" />;
  }

  const bale = product.baleId ? getBale(product.baleId) : null;
  const orders = getOrders().filter(o =>
    o.items.some(i => i.productId === product.id)
  );

  const statusColors: Record<string, string> = {
    Available: 'green',
    Reserved: 'orange',
    Sold: 'blue',
    Cancelled: 'red',
  };

  const conditionColors: Record<string, string> = {
    'A+': 'green',
    'A': 'blue',
    'B': 'orange',
  };

  // Build timeline
  const timeline = [
    {
      color: 'green',
      children: (
        <div>
          <Text strong>Product Created</Text>
          <br />
          <Text type="secondary">{formatDate(product.createdAt)}</Text>
        </div>
      ),
    },
  ];

  if (product.status === 'Reserved') {
    timeline.push({
      color: 'orange',
      children: (
        <div>
          <Text strong>Reserved</Text>
          <br />
          <Text type="secondary">{formatDate(product.updatedAt)}</Text>
        </div>
      ),
    });
  }

  if (product.status === 'Sold' && orders.length > 0) {
    const saleOrder = orders[0];
    timeline.push({
      color: 'blue',
      children: (
        <div>
          <Text strong>Sold</Text>
          <br />
          <Text>Voucher: <Link to={`/voucher/${saleOrder.id}`}>{saleOrder.voucherNumber}</Link></Text>
          <br />
          <Text type="secondary">{formatDate(saleOrder.createdAt)}</Text>
        </div>
      ),
    });
  }

  if (product.status === 'Cancelled') {
    timeline.push({
      color: 'red',
      children: (
        <div>
          <Text strong>Cancelled</Text>
          <br />
          <Text type="secondary">{formatDate(product.updatedAt)}</Text>
        </div>
      ),
    });
  }

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <Link to="/inventory">Inventory</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{product.productCode}</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory')}>
            Back to Inventory
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/inventory?edit=${product.id}`)}>
            Edit Product
          </Button>
        </Space>
      </div>

      <Space align="center" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>{product.productCode}</Title>
        <Tag color={statusColors[product.status]}>{product.status}</Tag>
        <Tag color={conditionColors[product.condition]}>{product.condition}</Tag>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Product Information" style={{ marginBottom: 16 }}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Product Code">
                <Text strong style={{ fontFamily: 'monospace' }}>{product.productCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Product Name">{product.productName}</Descriptions.Item>
              <Descriptions.Item label="Brand">{product.brand || '-'}</Descriptions.Item>
              <Descriptions.Item label="Category">{product.category || '-'}</Descriptions.Item>
              <Descriptions.Item label="Size">{product.size || '-'}</Descriptions.Item>
              <Descriptions.Item label="Color">{product.color || '-'}</Descriptions.Item>
              <Descriptions.Item label="Condition">
                <Tag color={conditionColors[product.condition]}>{product.condition}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[product.status]}>{product.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Cost Price">{formatCurrency(product.costPrice)}</Descriptions.Item>
              <Descriptions.Item label="Selling Price">
                <Text strong>{formatCurrency(product.sellingPrice)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Source Bale">
                {bale ? (
                  <Link to={`/bales/${bale.id}`}>
                    <Tag color="blue">{bale.baleCode}</Tag>
                    <Text type="secondary"> - {bale.supplierName}</Text>
                  </Link>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">{formatDate(product.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Updated At">{formatDate(product.updatedAt)}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Sales History */}
          {orders.length > 0 && (
            <Card title="Sales History">
              <Table
                dataSource={orders}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Voucher',
                    dataIndex: 'voucherNumber',
                    key: 'voucherNumber',
                    render: (v: string, record: any) => (
                      <Link to={`/voucher/${record.id}`}>
                        <Text strong style={{ color: '#0057B8' }}>{v}</Text>
                      </Link>
                    ),
                  },
                  {
                    title: 'Customer',
                    dataIndex: 'customerNameSnapshot',
                    key: 'customer',
                  },
                  {
                    title: 'Date',
                    dataIndex: 'orderDate',
                    key: 'date',
                    render: (d: string) => formatDate(d),
                  },
                  {
                    title: 'Amount',
                    dataIndex: 'totalAmount',
                    key: 'amount',
                    align: 'right' as const,
                    render: (a: number) => formatCurrency(a),
                  },
                  {
                    title: 'Status',
                    dataIndex: 'orderStatus',
                    key: 'status',
                    render: (s: string) => {
                      const colors: Record<string, string> = {
                        Pending: 'gold',
                        Confirmed: 'blue',
                        Packed: 'purple',
                        Shipped: 'cyan',
                        Delivered: 'green',
                        Cancelled: 'red',
                      };
                      return <Tag color={colors[s]}>{s}</Tag>;
                    },
                  },
                ]}
              />
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Pricing" style={{ marginBottom: 16 }}>
            <Statistic
              title="Selling Price"
              value={product.sellingPrice}
              prefix="MMK"
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#0057B8' }}
            />
            <Divider />
            <Statistic
              title="Cost Price"
              value={product.costPrice}
              prefix="MMK"
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Divider />
            <Statistic
              title="Margin"
              value={product.sellingPrice - product.costPrice}
              prefix="MMK"
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>

          <Card title={<><HistoryOutlined /> History</>}>
            <Timeline items={timeline} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
