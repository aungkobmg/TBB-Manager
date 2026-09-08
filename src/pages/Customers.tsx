import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Card, Space, Typography, Drawer, Descriptions, Tag, Statistic, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useToast, useAuth } from '../App';
import { getCustomers, createCustomer, updateCustomer, getOrders, formatCurrency, formatDate, logActivity } from '../utils/storage';

const { Title, Text } = Typography;
const { Search } = Input;

export default function Customers() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [customers, setCustomers] = useState(getCustomers());
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();
  const orders = getOrders();

  const filtered = customers.filter(c => {
    const s = search.toLowerCase();
    return !s || c.name.toLowerCase().includes(s) || c.phone.toLowerCase().includes(s) || c.facebookName.toLowerCase().includes(s);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = (values: any) => {
    if (editId) {
      updateCustomer(editId, values);
      logActivity(user!.userId, 'Customer Updated', 'customer', editId, `Updated ${values.name}`);
      showToast('Customer updated successfully');
    } else {
      const c = createCustomer(values);
      logActivity(user!.userId, 'Customer Created', 'customer', c.id, `Created ${c.name}`);
      showToast('Customer created successfully');
    }
    setCustomers(getCustomers());
    setModalVisible(false);
    setEditId(null);
    form.resetFields();
  };

  const handleEdit = (customer: any) => {
    setEditId(customer.id);
    form.setFieldsValue(customer);
    setModalVisible(true);
  };

  const handleView = (customer: any) => {
    setSelectedCustomer(customer);
    setDrawerVisible(true);
  };

  const getCustomerOrders = (customerId: number) => {
    return orders.filter(o => o.customerId === customerId && o.orderStatus !== 'Cancelled');
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Facebook',
      dataIndex: 'facebookName',
      key: 'facebookName',
      responsive: ['md' as const],
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      responsive: ['lg' as const],
    },
    {
      title: 'Orders',
      key: 'orders',
      align: 'center' as const,
      render: (_: any, record: any) => {
        const count = getCustomerOrders(record.id).length;
        return <Tag color="blue">{count}</Tag>;
      },
    },
    {
      title: 'Total Spent',
      key: 'totalSpent',
      align: 'right' as const,
      render: (_: any, record: any) => {
        const total = getCustomerOrders(record.id).reduce((s, o) => s + o.totalAmount, 0);
        return <span style={{ fontWeight: 500 }}>{formatCurrency(total)}</span>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            View
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>Customers</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditId(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <Card style={{ marginBottom: 16 }}>
        <Search
          placeholder="Search by name, phone, or Facebook..."
          allowClear
          onSearch={setSearch}
          onChange={(e) => setSearch(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ maxWidth: 500 }}
        />
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total} customers` }}
          locale={{ emptyText: 'No customers found' }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editId ? 'Edit Customer' : 'Add Customer'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditId(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Customer Name"
            rules={[{ required: true, message: 'Please enter customer name' }]}
          >
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone Number">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="facebookName" label="Facebook Name">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="township" label="Township">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="city" label="City">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editId ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Drawer */}
      <Drawer
        title="Customer Details"
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={500}
      >
        {selectedCustomer && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Name">{selectedCustomer.name}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedCustomer.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Facebook">{selectedCustomer.facebookName || '-'}</Descriptions.Item>
              <Descriptions.Item label="Address">{selectedCustomer.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="Township">{selectedCustomer.township || '-'}</Descriptions.Item>
              <Descriptions.Item label="City">{selectedCustomer.city || '-'}</Descriptions.Item>
              <Descriptions.Item label="Notes">{selectedCustomer.notes || '-'}</Descriptions.Item>
              <Descriptions.Item label="Created">{formatDate(selectedCustomer.createdAt)}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Card size="small">
                    <Statistic title="Total Orders" value={getCustomerOrders(selectedCustomer.id).length} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title="Total Spent"
                      value={getCustomerOrders(selectedCustomer.id).reduce((s, o) => s + o.totalAmount, 0)}
                      precision={0}
                      formatter={(value) => `${Number(value).toLocaleString()} MMK`}
                    />
                  </Card>
                </Col>
              </Row>

              <Title level={5}>Order History</Title>
              {getCustomerOrders(selectedCustomer.id).length === 0 ? (
                <Text type="secondary">No orders yet</Text>
              ) : (
                <Table
                  size="small"
                  dataSource={getCustomerOrders(selectedCustomer.id).slice(0, 10)}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: 'Voucher', dataIndex: 'voucherNumber', key: 'voucherNumber', render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
                    { title: 'Date', dataIndex: 'orderDate', key: 'orderDate', render: (d: string) => formatDate(d) },
                    { title: 'Amount', dataIndex: 'totalAmount', key: 'totalAmount', align: 'right', render: (a: number) => formatCurrency(a) },
                  ]}
                />
              )}
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
