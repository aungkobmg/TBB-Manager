import { useState } from 'react';
import { Table, Card, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, Typography, Row, Col, Statistic, Tabs, DatePicker } from 'antd';
import { PlusOutlined, DollarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useToast, useAuth } from '../App';
import { getOrders, getProducts, getExpenses, createExpense, formatCurrency, formatDate, logActivity } from '../utils/storage';

const { Title, Text } = Typography;

export default function Finance() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState(getExpenses());
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const orders = getOrders();
  const products = getProducts();

  const validOrders = orders.filter(o => o.orderStatus !== 'Cancelled');
  const totalRevenue = validOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalProductCost = validOrders.reduce((s, o) =>
    s + o.items.reduce((is, i) => {
      const p = products.find(pr => pr.id === i.productId);
      return is + (p?.costPrice || 0) * i.quantity;
    }, 0), 0);
  const grossProfit = totalRevenue - totalProductCost;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const handleSubmit = (values: any) => {
    const expense = createExpense(values);
    logActivity(user!.userId, 'Expense Created', 'expense', expense.id, `Created expense: ${values.category} - ${formatCurrency(values.amount)}`);
    showToast('Expense added successfully');
    setExpenses(getExpenses());
    setModalVisible(false);
    form.resetFields();
  };

  const expenseColumns = [
    {
      title: 'Date',
      dataIndex: 'expenseDate',
      key: 'expenseDate',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      responsive: ['md' as const],
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (amount: number) => <Text type="danger" strong>{formatCurrency(amount)}</Text>,
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={totalRevenue}
                  precision={0}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<DollarOutlined />}
                  formatter={(value) => `${Number(value).toLocaleString()} MMK`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Product Cost"
                  value={totalProductCost}
                  precision={0}
                  valueStyle={{ color: '#fa8c16' }}
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
                  valueStyle={{ color: '#1890ff' }}
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
                  formatter={(value) => `${Number(value).toLocaleString()} MMK`}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic title="Total Orders" value={validOrders.length} />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic title="Total Expenses" value={totalExpenses} precision={0} valueStyle={{ color: '#cf1322' }} formatter={(value) => `${Number(value).toLocaleString()} MMK`} />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'expenses',
      label: 'Expenses',
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>Expense Records</Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              Add Expense
            </Button>
          </div>
          <Table
            columns={expenseColumns}
            dataSource={[...expenses].sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())}
            rowKey="id"
            pagination={{ pageSize: 20, showSizeChanger: true }}
            locale={{ emptyText: 'No expenses yet' }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Finance</Title>
      </div>

      <Card>
        <Tabs items={tabItems} />
      </Card>

      {/* Add Expense Modal */}
      <Modal
        title="Add Expense"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="expenseDate" label="Date" rules={[{ required: true, message: 'Please select date' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please select category' }]}>
            <Select placeholder="Select category">
              <Select.Option value="Bale Purchase">Bale Purchase</Select.Option>
              <Select.Option value="Delivery Cost">Delivery Cost</Select.Option>
              <Select.Option value="Packaging Cost">Packaging Cost</Select.Option>
              <Select.Option value="Miscellaneous">Miscellaneous</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Amount (MMK)" rules={[{ required: true, message: 'Please enter amount' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="reference" label="Reference">
            <Input placeholder="Optional reference number" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Cancel</Button>
              <Button type="primary" htmlType="submit">Add Expense</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
