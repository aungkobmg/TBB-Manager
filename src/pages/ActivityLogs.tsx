import { useState } from 'react';
import { Table, Card, Input, Select, Tag, Typography, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getActivityLogs, formatDateTime } from '../utils/storage';

const { Title } = Typography;
const { Search } = Input;

export default function ActivityLogs() {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const logs = getActivityLogs();

  const filtered = logs.filter(l => {
    const s = search.toLowerCase();
    const matchSearch = !s || l.action.toLowerCase().includes(s) || l.description.toLowerCase().includes(s) || l.entityType.toLowerCase().includes(s);
    const matchAction = !filterAction || l.action === filterAction;
    return matchSearch && matchAction;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const actions = [...new Set(logs.map(l => l.action))];

  const getTagColor = (action: string) => {
    if (action.includes('Created')) return 'green';
    if (action.includes('Updated')) return 'blue';
    if (action.includes('Cancelled')) return 'red';
    if (action.includes('Login') || action.includes('Logout')) return 'purple';
    return 'default';
  };

  const columns = [
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => <span style={{ fontSize: 12 }}>{formatDateTime(date)}</span>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Tag color={getTagColor(action)}>{action}</Tag>,
    },
    {
      title: 'Entity',
      dataIndex: 'entityType',
      key: 'entityType',
      responsive: ['md' as const],
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Activity Logs</Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="Search logs..."
            allowClear
            onSearch={setSearch}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
          />
          <Select
            style={{ width: 200 }}
            placeholder="Filter by Action"
            allowClear
            value={filterAction || undefined}
            onChange={(value) => setFilterAction(value || '')}
          >
            <Select.Option value="">All Actions</Select.Option>
            {actions.map(a => <Select.Option key={a} value={a}>{a}</Select.Option>)}
          </Select>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (total) => `Total ${total} logs` }}
          locale={{ emptyText: 'No activity logs' }}
          size="small"
        />
      </Card>
    </div>
  );
}
