import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Tag, Typography, Spin, Button, Row, Col, Statistic, Divider, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { fetchProduct, formatCurrency, formatDate } from '../utils/storage';
import type { Product } from '../utils/storage';

const { Title, Text } = Typography;

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProduct(Number(id));
        setProduct(data);
      } catch (err) {
        message.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!product) return <div style={{ textAlign: 'center', padding: 100 }}><Text type="secondary">Product not found</Text></div>;

  return (
    <div>
      <Link to="/inventory"><Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 16 }}>Back to Inventory</Button></Link>
      <Title level={2}>{product.productCode}</Title>
      <Tag color={product.status === 'Available' ? 'green' : product.status === 'Sold' ? 'blue' : 'orange'}>{product.status}</Tag>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Product Information">
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Code"><Text strong style={{ fontFamily: 'monospace' }}>{product.productCode}</Text></Descriptions.Item>
              <Descriptions.Item label="Name">{product.productName}</Descriptions.Item>
              <Descriptions.Item label="Brand">{product.brand || '-'}</Descriptions.Item>
              <Descriptions.Item label="Category">{product.category || '-'}</Descriptions.Item>
              <Descriptions.Item label="Size">{product.size || '-'}</Descriptions.Item>
              <Descriptions.Item label="Color">{product.color || '-'}</Descriptions.Item>
              <Descriptions.Item label="Condition"><Tag>{product.condition}</Tag></Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={product.status === 'Available' ? 'green' : 'blue'}>{product.status}</Tag></Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Pricing">
            <Statistic title="Selling Price" value={product.sellingPrice} formatter={(v) => formatCurrency(Number(v))} valueStyle={{ color: '#0057B8' }} />
            <Divider />
            <Statistic title="Cost Price" value={product.costPrice} formatter={(v) => formatCurrency(Number(v))} />
            <Divider />
            <Statistic title="Margin" value={product.sellingPrice - product.costPrice} formatter={(v) => formatCurrency(Number(v))} valueStyle={{ color: '#389e0d' }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
