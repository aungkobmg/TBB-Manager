import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, Card, Row, Col, Statistic, Typography, Input as AntInput } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { useToast, useAuth } from '../App';
import { getProducts, createProduct, updateProduct, getBales, formatCurrency, logActivity } from '../utils/storage';

const { Title } = Typography;
const { Search } = AntInput;

export default function Inventory() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState(getProducts());
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCondition, setFilterCondition] = useState<string>('');
  const [form] = Form.useForm();
  const bales = getBales();

  const stats = {
    available: products.filter(p => p.status === 'Available').length,
    sold: products.filter(p => p.status === 'Sold').length,
    reserved: products.filter(p => p.status === 'Reserved').length,
    total: products.length,
  };

  const filtered = products.filter(p => {
    const s = search.toLowerCase();
    const matchSearch = !s || p.productCode.toLowerCase().includes(s) || p.productName.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s) || p.size.toLowerCase().includes(s) || p.category.toLowerCase().includes(s);
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchCondition = !filterCondition || p.condition === filterCondition;
    return matchSearch && matchStatus && matchCondition;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = (values: any) => {
    if (editId) {
      updateProduct(editId, values);
      logActivity(user!.userId, 'Product Updated', 'product', editId, `Updated ${values.productName}`);
      showToast('Product updated successfully');
    } else {
      const p = createProduct(values);
      logActivity(user!.userId, 'Product Created', 'product', p.id, `Created ${p.productCode}`);
      showToast(`Product created: ${p.productCode}`);
    }
    setProducts(getProducts());
    setModalVisible(false);
    setEditId(null);
    form.resetFields();
  };

  const handleEdit = (product: any) => {
    setEditId(product.id);
    form.setFieldsValue(product);
    setModalVisible(true);
  };

  const statusColors: Record<string, string> = {
    Available: 'green',
    Reserved: 'gold',
    Sold: 'blue',
    Cancelled: 'red',
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'productCode',
      key: 'productCode',
      render: (text: string) => <span style={{ fontFamily: 'monospace', color: '#0057B8', fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      responsive: ['md' as const],
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      responsive: ['lg' as const],
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      align: 'center' as const,
      render: (condition: string) => <Tag>{condition}</Tag>,
    },
    {
      title: 'Sell Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      align: 'right' as const,
      render: (price: number) => <span style={{ fontWeight: 500 }}>{formatCurrency(price)}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>Inventory</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditId(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Available" value={stats.available} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Sold" value={stats.sold} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Reserved" value={stats.reserved} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Total" value={stats.total} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={10}>
            <Search
              placeholder="Search code, name, brand, size..."
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
              <Select.Option value="Available">Available</Select.Option>
              <Select.Option value="Reserved">Reserved</Select.Option>
              <Select.Option value="Sold">Sold</Select.Option>
              <Select.Option value="Cancelled">Cancelled</Select.Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={7}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Condition"
              allowClear
              value={filterCondition || undefined}
              onChange={(value) => setFilterCondition(value || '')}
            >
              <Select.Option value="">All Condition</Select.Option>
              <Select.Option value="A+">A+</Select.Option>
              <Select.Option value="A">A</Select.Option>
              <Select.Option value="B">B</Select.Option>
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
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total} products` }}
          locale={{ emptyText: 'No products found' }}
          scroll={{ x: 800 }}
          onRow={(record) => ({
            onClick: () => navigate(`/products/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={editId ? 'Edit Product' : 'Add Product'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditId(null);
          form.resetFields();
        }}
        footer={null}
        width={640}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ condition: 'A', status: 'Available' }}
        >
          <Form.Item
            name="productName"
            label="Product Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="brand" label="Brand">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Category">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="size" label="Size">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="color" label="Color">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="condition" label="Condition" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="A+">A+</Select.Option>
                  <Select.Option value="A">A</Select.Option>
                  <Select.Option value="B">B</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="costPrice" label="Cost Price (MMK)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sellingPrice" label="Selling Price (MMK)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="baleId" label="Source Bale">
            <Select allowClear placeholder="Select bale (optional)">
              {bales.map(b => (
                <Select.Option key={b.id} value={b.id}>
                  {b.baleCode} - {b.supplierName}
                </Select.Option>
              ))}
            </Select>
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
