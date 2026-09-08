import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, Card, Row, Col, Statistic, Typography } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useToast, useAuth } from '../App';
import { getBales, createBale, updateBale, getProducts, formatCurrency, formatDate, logActivity } from '../utils/storage';

const { Title } = Typography;

export default function Bales() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [bales, setBales] = useState(getBales());
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const products = getProducts();

  const stats = {
    total: bales.length,
    purchased: bales.filter(b => b.status === 'Purchased').length,
    processing: bales.filter(b => b.status === 'Processing').length,
    completed: bales.filter(b => b.status === 'Completed').length,
  };

  const handleSubmit = (values: any) => {
    if (editId) {
      updateBale(editId, values);
      logActivity(user!.userId, 'Bale Updated', 'bale', editId, `Updated ${values.baleCode || 'bale'}`);
      showToast('Bale updated successfully');
    } else {
      const bale = createBale(values);
      logActivity(user!.userId, 'Bale Created', 'bale', bale.id, `Created ${bale.baleCode}`);
      showToast(`Bale created: ${bale.baleCode}`);
    }
    setBales(getBales());
    setModalVisible(false);
    setEditId(null);
    form.resetFields();
  };

  const handleEdit = (bale: any) => {
    setEditId(bale.id);
    form.setFieldsValue(bale);
    setModalVisible(true);
  };

  const statusColors: Record<string, string> = {
    Purchased: 'blue',
    Processing: 'orange',
    Completed: 'green',
    Closed: 'default',
  };

  const columns = [
    {
      title: 'Bale Code',
      dataIndex: 'baleCode',
      key: 'baleCode',
      render: (text: string) => <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Purchase Date',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
    },
    {
      title: 'Cost',
      dataIndex: 'baleCost',
      key: 'baleCost',
      align: 'right' as const,
      render: (cost: number) => formatCurrency(cost),
    },
    {
      title: 'Expected Qty',
      dataIndex: 'expectedQty',
      key: 'expectedQty',
      align: 'center' as const,
    },
    {
      title: 'Actual Qty',
      dataIndex: 'actualQty',
      key: 'actualQty',
      align: 'center' as const,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Products',
      key: 'products',
      align: 'center' as const,
      render: (_: any, record: any) => {
        const count = products.filter(p => p.baleId === record.id).length;
        return count;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
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
        <Title level={3} style={{ margin: 0 }}>Bales</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditId(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Add Bale
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Total Bales" value={stats.total} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Purchased" value={stats.purchased} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Processing" value={stats.processing} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Completed" value={stats.completed} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={bales}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: 'No bales yet' }}
          onRow={(record) => ({
            onClick: () => navigate(`/bales/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={editId ? 'Edit Bale' : 'Add Bale'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditId(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'Purchased' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="purchaseDate"
                label="Purchase Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="supplierName"
                label="Supplier Name"
                rules={[{ required: true, message: 'Please enter supplier' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="baleCost"
                label="Bale Cost (MMK)"
                rules={[{ required: true, message: 'Please enter cost' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="Purchased">Purchased</Select.Option>
                  <Select.Option value="Processing">Processing</Select.Option>
                  <Select.Option value="Completed">Completed</Select.Option>
                  <Select.Option value="Closed">Closed</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="expectedQty" label="Expected Quantity">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actualQty" label="Actual Quantity">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
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
    </div>
  );
}
