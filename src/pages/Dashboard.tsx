import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Space } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  InboxOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { getOrders, getProducts, getExpenses, getCustomers, getBales, formatCurrency, formatDate } from '../utils/storage';

const { Title, Text } = Typography;

export default function Dashboard() {
  const orders = getOrders();
  const products = getProducts();
  const expenses = getExpenses();
  const customers = getCustomers();
  const bales = getBales();

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const todayOrders = orders.filter(o => o.orderDate?.slice(0, 10) === today && o.orderStatus !== 'Cancelled');
  const monthOrders = orders.filter(o => o.orderDate?.slice(0, 7) === thisMonth && o.orderStatus !== 'Cancelled');
  const pendingOrders = orders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed');
  const availableProducts = products.filter(p => p.status === 'Available');
  const todayExpenses = expenses.filter(e => e.expenseDate?.slice(0, 10) === today);

  const revenueToday = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
  const revenueMonth = monthOrders.reduce((s, o) => s + o.totalAmount, 0);
  const inventoryCostValue = availableProducts.reduce((s, p) => s + p.costPrice, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRevenue = orders.filter(o => o.orderStatus !== 'Cancelled').reduce((s, o) => s + o.totalAmount, 0);
  const totalProductCost = orders.filter(o => o.orderStatus !== 'Cancelled').reduce((s, o) =>
    s + o.items.reduce((is, i) => {
      const product = products.find(p => p.id === i.productId);
      return is + (product?.costPrice || 0) * i.quantity;
    }, 0), 0);
  const grossProfit = totalRevenue - totalProductCost;
  const netProfit = grossProfit - totalExpenses;

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentExpenses = [...expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const orderColumns = [
    {
      title: 'Voucher',
      dataIndex: 'voucherNumber',
      key: 'voucherNumber',
      render: (text: string, record: any) => (
        <Link to={`/orders/${record.id}`} style={{ fontFamily: 'monospace', color: '#0057B8' }}>
          {text}
        </Link>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerNameSnapshot',
      key: 'customerNameSnapshot',
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right' as const,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Status',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: (status: string) => {
        const colors: Record<string, string> = {
          Pending: 'gold',
          Confirmed: 'blue',
          Packed: 'purple',
          Shipped: 'geekblue',
          Delivered: 'green',
          Cancelled: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
  ];

  const expenseColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Date',
      dataIndex: 'expenseDate',
      key: 'expenseDate',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (amount: number) => <Text type="danger">{formatCurrency(amount)}</Text>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>Dashboard</Title>
        <Text type="secondary">{formatDate(new Date().toISOString())}</Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Revenue Today"
              value={revenueToday}
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DollarOutlined />}
              suffix="MMK"
              formatter={(value) => `${Number(value).toLocaleString()} MMK`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Revenue This Month"
              value={revenueMonth}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<RiseOutlined />}
              suffix="MMK"
              formatter={(value) => `${Number(value).toLocaleString()} MMK`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Orders Today"
              value={todayOrders.length}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Orders"
              value={pendingOrders.length}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Available Products"
              value={availableProducts.length}
              valueStyle={{ color: '#13c2c2' }}
              prefix={<TagsOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Inventory Cost Value"
              value={inventoryCostValue}
              precision={0}
              valueStyle={{ color: '#2f54eb' }}
              prefix={<InboxOutlined />}
              formatter={(value) => `${Number(value).toLocaleString()} MMK`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Gross Profit"
              value={grossProfit}
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<RiseOutlined />}
              formatter={(value) => `${Number(value).toLocaleString()} MMK`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Net Profit"
              value={netProfit}
              precision={0}
              valueStyle={{ color: netProfit >= 0 ? '#389e0d' : '#cf1322' }}
              prefix={netProfit >= 0 ? <RiseOutlined /> : <FallOutlined />}
              formatter={(value) => `${Number(value).toLocaleString()} MMK`}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Orders & Expenses */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="Recent Orders"
            extra={<Link to="/orders">View All</Link>}
          >
            <Table
              columns={orderColumns}
              dataSource={recentOrders}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: 'No orders yet' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="Recent Expenses"
            extra={<Link to="/finance">View All</Link>}
          >
            <Table
              columns={expenseColumns}
              dataSource={recentExpenses}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: 'No expenses yet' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ textAlign: 'center' }}>
            <Statistic title="Total Bales" value={bales.length} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ textAlign: 'center' }}>
            <Statistic title="Total Products" value={products.length} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ textAlign: 'center' }}>
            <Statistic title="Total Customers" value={customers.length} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ textAlign: 'center' }}>
            <Statistic title="Total Orders" value={orders.length} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
