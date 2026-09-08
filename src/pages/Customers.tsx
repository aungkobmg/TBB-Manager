import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Input, Tag, Card, Typography, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { fetchCustomers, createCustomer, formatCurrency } from '../utils/storage';
import type { Customer } from '../utils/storage';

const { Title } = Typography;
const { Search } = Input;

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadCustomers = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetchCustomers({ page: p, limit: 20, search });
      setCustomers(res.data);
      setTotal(res.total);
    } catch (err) {
      message.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomers(); }, [page, search]);

  const handleSubmit = async (values: any) => {
    try {
      await createCustomer(values);
      message.success('Customer created');
      setModalOpen(false);
      form.resetFields();
      loadCustomers();
    } catch (err) {
      message.error('Failed to create customer');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Facebook', dataIndex: 'facebookName', key: 'facebook' },
    { title: 'Orders', dataIndex: 'order_count', key: 'orders', align: 'center' as const },
    { title: 'Total Spent', dataIndex: 'total_spent', key: 'spent', align: 'right' as const, render: (v: number) => formatCurrency(v || 0) },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>Customers</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>Add Customer</Button>
      </div>

      <Search placeholder="Search customers..." onSearch={setSearch} style={{ width: 300, marginBottom: 16 }} allowClear />

      <Card>
        <Table columns={columns} dataSource={customers} rowKey="id" loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
          locale={{ emptyText: 'No customers found' }}
        />
      </Card>

      <Modal title="Add Customer" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="facebookName" label="Facebook Name"><Input /></Form.Item>
          <Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
