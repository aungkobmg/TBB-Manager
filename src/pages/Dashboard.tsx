import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Spin, Empty, message } from 'antd';
import { DollarOutlined, ShoppingCartOutlined, TagsOutlined, InboxOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { dashboardApi, formatCurrency, formatDate } from '../api/services';
import type { DashboardData } from '../api/services';

const { Title, Text } = Typography;

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardApi.summary();
        if (res.data) setData(res.data);
      } catch (err) {
        message.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  if (!data) return <Empty description="No data available" />;

  const metrics = [
    { title: 'Revenue Today', value: data.revenue_today, prefix: <DollarOutlined />, color: '#389e0d' },
    { title: 'Revenue This Month', value: data.revenue_month, prefix: <DollarOutlined />, color: '#0057B8' },
    { title: 'Orders Today', value: data.orders_today, prefix: <ShoppingCartOutlined />, color: '#722ed1' },
    { title: 'Pending Orders', value: data.pending_orders, prefix: <ShoppingCartOutlined />, color: '#fa8c16' },
    { title: 'Available Products', value: data.available_products, prefix: <TagsOutlined />, color: '#13c2c2' },
    { title: 'Inventory Value', value: data.inventory_cost_value, prefix: <InboxOutlined />, color: '#2f54eb' },
    { title: 'Total Expenses', value: data.total_expenses, prefix: <FallOutlined />, color: '#cf1322' },
    { title: 'Gross Profit', value: data.gross_profit, prefix: <RiseOutlined />, color: '#389e0d' },
    { title: 'Net Profit', value: data.net_profit, prefix: <RiseOutlined />, color: data.net_profit >= 0 ? '#389e0d' : '#cf1322' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>Dashboard</Title>
        <Text type="secondary">{formatDate(data.today)}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {metrics.map((m, i) => (
          <Col xs={12} sm={8} lg={6} key={i}>
            <Card>
              <Statistic title={m.title} value={m.value} prefix={m.prefix} formatter={(v) => m.title.includes('Orders') || m.title.includes('Products') ? v : formatCurrency(Number(v))} valueStyle={{ color: m.color, fontSize: 18 }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Orders" extra={<Link to="/orders">View All</Link>}>
            <Table dataSource={data.recent_orders} rowKey="id" pagination={false} size="small"
              locale={{ emptyText: 'No orders yet' }}
              columns={[
                { title: 'Voucher', dataIndex: 'voucher_number', key: 'voucher', render: (v: string, r: any) => <Link to={`/orders/${r.id}`}><Text strong style={{ color: '#0057B8' }}>{v}</Text></Link> },
                { title: 'Customer', dataIndex: 'customer_name_snapshot', key: 'customer' },
                { title: 'Amount', dataIndex: 'total_amount', key: 'amount', align: 'right', render: (v: number) => formatCurrency(v) },
                { title: 'Status', dataIndex: 'order_status', key: 'status', render: (s: string) => {
                  const colors: Record<string, string> = { Pending: 'gold', Confirmed: 'blue', Packed: 'purple', Shipped: 'cyan', Delivered: 'green', Cancelled: 'red' };
                  return <Tag color={colors[s]}>{s}</Tag>;
                }},
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Expenses" extra={<Link to="/finance">View All</Link>}>
            <Table dataSource={data.recent_expenses} rowKey="id" pagination={false} size="small"
              locale={{ emptyText: 'No expenses yet' }}
              columns={[
                { title: 'Category', dataIndex: 'category', key: 'category' },
                { title: 'Date', dataIndex: 'expense_date', key: 'date', render: (d: string) => formatDate(d) },
                { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', render: (v: number) => <Text type="danger">{formatCurrency(v)}</Text> },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={6}><Card style={{ textAlign: 'center' }}><Statistic title="Total Bales" value={data.total_bales} /></Card></Col>
        <Col xs={6}><Card style={{ textAlign: 'center' }}><Statistic title="Total Products" value={data.total_products} /></Card></Col>
        <Col xs={6}><Card style={{ textAlign: 'center' }}><Statistic title="Total Customers" value={data.total_customers} /></Card></Col>
        <Col xs={6}><Card style={{ textAlign: 'center' }}><Statistic title="Total Orders" value={data.total_orders} /></Card></Col>
      </Row>
    </div>
  );
}
