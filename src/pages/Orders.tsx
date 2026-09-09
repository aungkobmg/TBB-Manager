import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Tag, Input, Select, Typography, message, Space, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { fetchOrders, formatCurrency, formatDate } from '../utils/storage';
import type { Order } from '../utils/storage';

const { Title, Text } = Typography;
const { Search } = Input;

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetchOrders({ page: p, limit: 20, search, status: statusFilter || undefined });
      setOrders(res.data);
      setTotal(res.total);
    } catch (err) {
      message.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [page, search, statusFilter]);

  const columns = [
    { title: 'Voucher', dataIndex: 'voucherNumber', key: 'voucher', render: (v: string, r: Order) => <Text strong style={{ fontFamily: 'monospace', color: '#0057B8' }}>{v}</Text> },
    { title: 'Date', dataIndex: 'orderDate', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Customer', dataIndex: 'customerNameSnapshot', key: 'customer' },
    { title: 'Phone', dataIndex: 'phoneSnapshot', key: 'phone' },
    { title: 'Items', render: (_: any, r: Order) => r.items.length, key: 'items', align: 'center' as const },
    { title: 'Total', dataIndex: 'totalAmount', key: 'total', align: 'right' as const, render: (v: number) => formatCurrency(v) },
    { title: 'Payment', dataIndex: 'paymentMethod', key: 'payment' },
    { title: 'Status', dataIndex: 'orderStatus', key: 'status', render: (s: string) => {
      const colors: Record<string, string> = { Pending: 'gold', Confirmed: 'blue', Packed: 'purple', Shipped: 'cyan', Delivered: 'green', Cancelled: 'red' };
      return <Tag color={colors[s]}>{s}</Tag>;
    }},
  ];

  return (
    <div>
      <Title level={3}>Orders</Title>

      <Space style={{ marginBottom: 16 }}>
        <Search placeholder="Search orders..." onSearch={setSearch} style={{ width: 300 }} allowClear />
        <Select placeholder="Status" style={{ width: 150 }} allowClear onChange={setStatusFilter}>
          <Select.Option value="Pending">Pending</Select.Option>
          <Select.Option value="Confirmed">Confirmed</Select.Option>
          <Select.Option value="Packed">Packed</Select.Option>
          <Select.Option value="Shipped">Shipped</Select.Option>
          <Select.Option value="Delivered">Delivered</Select.Option>
          <Select.Option value="Cancelled">Cancelled</Select.Option>
        </Select>
      </Space>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
          onRow={(record) => ({ onClick: () => navigate(`/orders/${record.id}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: 'No orders found' }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
