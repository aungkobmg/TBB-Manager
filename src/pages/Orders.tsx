import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Card, Tag, Input, Select, Space, Typography, Row, Col } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { getOrders, formatCurrency, formatDate } from '../utils/storage';

const { Title } = Typography;
const { Search } = Input;

export default function Orders() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const orders = getOrders();

  const filtered = orders.filter(o => {
    const s = search.toLowerCase();
    const matchSearch = !s || o.voucherNumber.toLowerCase().includes(s) || o.customerNameSnapshot.toLowerCase().includes(s) || o.phoneSnapshot.includes(s);
    const matchStatus = !filterStatus || o.orderStatus === filterStatus;
    const matchPayment = !filterPayment || o.paymentMethod === filterPayment;
    return matchSearch && matchStatus && matchPayment;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statusColors: Record<string, string> = {
    Pending: 'gold',
    Confirmed: 'blue',
    Packed: 'purple',
    Shipped: 'geekblue',
    Delivered: 'green',
    Cancelled: 'red',
  };

  const columns = [
    {
      title: 'Voucher',
      dataIndex: 'voucherNumber',
      key: 'voucherNumber',
      render: (text: string, record: any) => (
        <Link to={`/orders/${record.id}`} style={{ fontFamily: 'monospace', color: '#0057B8', fontWeight: 500 }}>
          {text}
        </Link>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Customer',
      dataIndex: 'customerNameSnapshot',
      key: 'customerNameSnapshot',
    },
    {
      title: 'Phone',
      dataIndex: 'phoneSnapshot',
      key: 'phoneSnapshot',
      responsive: ['md' as const],
    },
    {
      title: 'Items',
      key: 'items',
      align: 'center' as const,
      render: (_: any, record: any) => record.items.length,
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right' as const,
      render: (amount: number) => <span style={{ fontWeight: 500 }}>{formatCurrency(amount)}</span>,
    },
    {
      title: 'Payment',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      responsive: ['md' as const],
      render: (method: string) => <Tag>{method}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <Link to={`/orders/${record.id}`}>
            <a><EyeOutlined /> View</a>
          </Link>
          <Link to={`/voucher/${record.id}`}>
            <a>Voucher</a>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Orders</Title>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={10}>
            <Search
              placeholder="Search voucher, customer, phone..."
              allowClear
              onSearch={setSearch}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={12} sm={6} md={7}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Status"
              allowClear
              value={filterStatus || undefined}
              onChange={(value) => setFilterStatus(value || '')}
            >
              <Select.Option value="">All Status</Select.Option>
              <Select.Option value="Pending">Pending</Select.Option>
              <Select.Option value="Confirmed">Confirmed</Select.Option>
              <Select.Option value="Packed">Packed</Select.Option>
              <Select.Option value="Shipped">Shipped</Select.Option>
              <Select.Option value="Delivered">Delivered</Select.Option>
              <Select.Option value="Cancelled">Cancelled</Select.Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={7}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Payment"
              allowClear
              value={filterPayment || undefined}
              onChange={(value) => setFilterPayment(value || '')}
            >
              <Select.Option value="">All Payment</Select.Option>
              <Select.Option value="COD">COD</Select.Option>
              <Select.Option value="KBZ Pay">KBZ Pay</Select.Option>
              <Select.Option value="Wave Pay">Wave Pay</Select.Option>
              <Select.Option value="AYA Pay">AYA Pay</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total} orders` }}
          locale={{ emptyText: 'No orders found' }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
