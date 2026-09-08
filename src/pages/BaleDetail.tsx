import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Typography, Spin, Button, Row, Col, Statistic, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { fetchBale, formatCurrency, formatDate } from '../utils/storage';
import type { Bale } from '../utils/storage';

const { Title, Text } = Typography;

export default function BaleDetail() {
  const { id } = useParams();
  const [bale, setBale] = useState<Bale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBale(Number(id));
        setBale(data);
      } catch (err) {
        message.error('Failed to load bale');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!bale) return <div style={{ textAlign: 'center', padding: 100 }}><Text type="secondary">Bale not found</Text></div>;

  return (
    <div>
      <Link to="/bales"><Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 16 }}>Back to Bales</Button></Link>
      <Title level={2}>{bale.baleCode}</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Bale Information">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Bale Code"><Text strong style={{ fontFamily: 'monospace' }}>{bale.baleCode}</Text></Descriptions.Item>
              <Descriptions.Item label="Purchase Date">{formatDate(bale.purchaseDate)}</Descriptions.Item>
              <Descriptions.Item label="Supplier">{bale.supplierName}</Descriptions.Item>
              <Descriptions.Item label="Cost">{formatCurrency(bale.baleCost)}</Descriptions.Item>
              <Descriptions.Item label="Expected Qty">{bale.expectedQty}</Descriptions.Item>
              <Descriptions.Item label="Actual Qty">{bale.actualQty}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag>{bale.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Notes">{bale.notes || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Summary">
            <Statistic title="Status" value={bale.status} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
