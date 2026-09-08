import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Button, Space, Typography, Row, Col, Statistic, Divider, Breadcrumb, Empty } from 'antd';
import { ArrowLeftOutlined, EditOutlined, InboxOutlined, DollarOutlined, ShoppingOutlined } from '@ant-design/icons';
import { getBale, getProducts, formatCurrency, formatDate } from '../utils/storage';

const { Title, Text } = Typography;

export default function BaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bale, setBale] = useState(getBale(Number(id)));
  const [products, setProducts] = useState(getProducts().filter(p => p.baleId === Number(id)));

  useEffect(() => {
    setBale(getBale(Number(id)));
    setProducts(getProducts().filter(p => p.baleId === Number(id)));
  }, [id]);

  if (!bale) {
    return <Empty description="Bale not found" />;
  }

  const availableProducts = products.filter(p => p.status === 'Available');
  const soldProducts = products.filter(p => p.status === 'Sold');
  const reservedProducts = products.filter(p => p.status === 'Reserved');

  const totalRevenue = soldProducts.reduce((sum, p) => sum + p.sellingPrice, 0);
  const totalCost = products.reduce((sum, p) => sum + p.costPrice, 0);
  const profit = totalRevenue - totalCost;

  const statusColors: Record<string, string> = {
    Purchased: 'blue',
    Processing: 'orange',
    Completed: 'green',
    Closed: 'default',
  };

  const productColumns = [
    {
      title: 'Product Code',
      dataIndex: 'productCode',
      key: 'productCode',
      render: (code: string) => <Text strong style={{ color: '#0057B8', fontFamily: 'monospace' }}>{code}</Text>,
    },
    {
      title: 'Name',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      render: (cond: string) => <Tag>{cond}</Tag>,
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      align: 'right' as const,
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      align: 'right' as const,
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          Available: 'green',
          Reserved: 'orange',
          Sold: 'blue',
          Cancelled: 'red',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <Link to="/bales">Bales</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{bale.baleCode}</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bales')}>
            Back to Bales
          </Button>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/bales?edit=${bale.id}`)}>
            Edit Bale
          </Button>
        </Space>
      </div>

      <Title level={2}>{bale.baleCode}</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Bale Information" style={{ marginBottom: 16 }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Bale Code">
                <Text strong style={{ fontFamily: 'monospace' }}>{bale.baleCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Purchase Date">{formatDate(bale.purchaseDate)}</Descriptions.Item>
              <Descriptions.Item label="Supplier Name">{bale.supplierName}</Descriptions.Item>
              <Descriptions.Item label="Bale Cost">{formatCurrency(bale.baleCost)}</Descriptions.Item>
              <Descriptions.Item label="Expected Quantity">{bale.expectedQty}</Descriptions.Item>
              <Descriptions.Item label="Actual Quantity">{bale.actualQty}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[bale.status]}>{bale.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Notes">{bale.notes || '-'}</Descriptions.Item>
              <Descriptions.Item label="Created At">{formatDate(bale.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Updated At">{formatDate(bale.updatedAt)}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Products from this Bale">
            <Table
              dataSource={products}
              columns={productColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Summary" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text type="secondary">Total Products</Text>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{products.length}</div>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div>
                <Text type="secondary">Available</Text>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>{availableProducts.length}</div>
              </div>
              <div>
                <Text type="secondary">Reserved</Text>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#faad14' }}>{reservedProducts.length}</div>
              </div>
              <div>
                <Text type="secondary">Sold</Text>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#1890ff' }}>{soldProducts.length}</div>
              </div>
            </Space>
          </Card>

          <Card title="Financial Summary">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Statistic
                  title="Bale Cost"
                  value={bale.baleCost}
                  prefix={<DollarOutlined />}
                  suffix="MMK"
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title="Total Product Cost"
                  value={totalCost}
                  prefix={<InboxOutlined />}
                  suffix="MMK"
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title="Revenue (Sold)"
                  value={totalRevenue}
                  prefix={<ShoppingOutlined />}
                  suffix="MMK"
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title="Profit"
                  value={profit}
                  prefix={profit >= 0 ? '+' : '-'}
                  suffix="MMK"
                  formatter={(value) => formatCurrency(Math.abs(Number(value)))}
                  valueStyle={{ color: profit >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
