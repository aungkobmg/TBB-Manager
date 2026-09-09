import { useState, useEffect } from 'react';
import { Table, Card, Tag, Input, Select, Typography, message, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { fetchActivityLogs, formatDateTime } from '../utils/storage';
import type { ActivityLog } from '../utils/storage';

const { Title, Text } = Typography;
const { Search } = Input;

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const loadLogs = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetchActivityLogs({ page: p, limit: 50, search, action: actionFilter || undefined });
      setLogs(res.data);
      setTotal(res.total);
    } catch (err) {
      message.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, [page, search, actionFilter]);

  const columns = [
    { title: 'Time', dataIndex: 'createdAt', key: 'time', render: (d: string) => formatDateTime(d) },
    { title: 'User', dataIndex: 'username', key: 'user', render: (u: string) => <Text strong>{u || 'System'}</Text> },
    { title: 'Action', dataIndex: 'action', key: 'action', render: (a: string) => {
      let color = 'default';
      if (a.includes('Created')) color = 'green';
      else if (a.includes('Updated')) color = 'blue';
      else if (a.includes('Cancelled')) color = 'red';
      else if (a.includes('Login') || a.includes('Logout')) color = 'purple';
      return <Tag color={color}>{a}</Tag>;
    }},
    { title: 'Entity', dataIndex: 'entityType', key: 'entity' },
    { title: 'Description', dataIndex: 'description', key: 'desc' },
  ];

  return (
    <div>
      <Title level={3}>Activity Logs</Title>

      <Space style={{ marginBottom: 16 }}>
        <Search placeholder="Search logs..." onSearch={setSearch} style={{ width: 300 }} allowClear />
        <Select placeholder="Action" style={{ width: 200 }} allowClear onChange={setActionFilter}>
          <Select.Option value="Login">Login</Select.Option>
          <Select.Option value="Logout">Logout</Select.Option>
          <Select.Option value="Product Created">Product Created</Select.Option>
          <Select.Option value="Product Updated">Product Updated</Select.Option>
          <Select.Option value="Bale Created">Bale Created</Select.Option>
          <Select.Option value="Order Created">Order Created</Select.Option>
          <Select.Option value="Order Cancelled">Order Cancelled</Select.Option>
          <Select.Option value="Settings Updated">Settings Updated</Select.Option>
        </Select>
      </Space>

      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{ current: page, total, pageSize: 50, onChange: setPage }}
          locale={{ emptyText: 'No activity logs' }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
