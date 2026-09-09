import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, Typography, message, Row, Col, Statistic, Space, DatePicker } from 'antd';
import { PlusOutlined, DollarOutlined } from '@ant-design/icons';
import { fetchExpenses, createExpense, formatCurrency, formatDate } from '../utils/storage';
import type { Expense } from '../utils/storage';

const { Title, Text } = Typography;

export default function Finance() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [summary, setSummary] = useState({ totalExpenses: 0, totalRevenue: 0, grossProfit: 0, netProfit: 0 });

  const loadExpenses = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetchExpenses({ page: p, limit: 20 });
      setExpenses(res.data);
      setTotal(res.total);
    } catch (err) {
      message.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExpenses(); }, [page]);

  const handleSubmit = async (values: any) => {
    try {
      await createExpense(values);
      message.success('Expense created');
      setModalOpen(false);
      form.resetFields();
      loadExpenses();
    } catch (err) {
      message.error('Failed to create expense');
    }
  };

  const columns = [
    { title: 'Date', dataIndex: 'expenseDate', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c: string) => <Text strong>{c}</Text> },
    { title: 'Description', dataIndex: 'description', key: 'desc' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right' as const, render: (v: number) => <Text type="danger">{formatCurrency(v)}</Text> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>Finance</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>Add Expense</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Total Revenue" value={summary.totalRevenue} prefix="MMK" formatter={(v) => formatCurrency(Number(v))} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Total Expenses" value={summary.totalExpenses} prefix="MMK" formatter={(v) => formatCurrency(Number(v))} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Gross Profit" value={summary.grossProfit} prefix="MMK" formatter={(v) => formatCurrency(Number(v))} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Net Profit" value={summary.netProfit} prefix="MMK" formatter={(v) => formatCurrency(Number(v))} valueStyle={{ color: summary.netProfit >= 0 ? '#3f8600' : '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Card title="Expenses">
        <Table columns={columns} dataSource={expenses} rowKey="id" loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
          locale={{ emptyText: 'No expenses found' }}
        />
      </Card>

      <Modal title="Add Expense" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ expenseDate: new Date().toISOString().slice(0, 10) }}>
          <Form.Item name="expenseDate" label="Date" rules={[{ required: true }]}><Input type="date" /></Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Bale Purchase">Bale Purchase</Select.Option>
              <Select.Option value="Delivery Cost">Delivery Cost</Select.Option>
              <Select.Option value="Packaging Cost">Packaging Cost</Select.Option>
              <Select.Option value="Miscellaneous">Miscellaneous</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
