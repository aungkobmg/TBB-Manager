import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Card, Typography, message, Space, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { fetchProducts, createProduct, updateProduct, formatCurrency } from '../utils/storage';
import type { Product } from '../utils/storage';

const { Title } = Typography;
const { Search } = Input;

export default function Inventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  const loadProducts = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetchProducts({ page: p, limit: 20, search, status: statusFilter || undefined });
      setProducts(res.data);
      setTotal(res.total);
    } catch (err) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, [page, search, statusFilter]);

  const handleSubmit = async (values: any) => {
    try {
      if (editProduct) {
        await updateProduct(editProduct.id, values);
        message.success('Product updated');
      } else {
        await createProduct(values);
        message.success('Product created');
      }
      setModalOpen(false);
      setEditProduct(null);
      form.resetFields();
      loadProducts();
    } catch (err) {
      message.error('Failed to save product');
    }
  };

  const columns = [
    { title: 'Code', dataIndex: 'productCode', key: 'code', render: (v: string) => <span style={{ fontFamily: 'monospace', color: '#0057B8', fontWeight: 500 }}>{v}</span> },
    { title: 'Name', dataIndex: 'productName', key: 'name' },
    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
    { title: 'Size', dataIndex: 'size', key: 'size' },
    { title: 'Condition', dataIndex: 'condition', key: 'condition', render: (c: string) => <Tag>{c}</Tag> },
    { title: 'Sell Price', dataIndex: 'sellingPrice', key: 'price', align: 'right' as const, render: (v: number) => formatCurrency(v) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => {
      const colors: Record<string, string> = { Available: 'green', Reserved: 'orange', Sold: 'blue', Cancelled: 'red' };
      return <Tag color={colors[s]}>{s}</Tag>;
    }},
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>Inventory</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditProduct(null); form.resetFields(); setModalOpen(true); }}>Add Product</Button>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Search placeholder="Search products..." onSearch={setSearch} style={{ width: 300 }} allowClear />
        <Select placeholder="Status" style={{ width: 150 }} allowClear onChange={setStatusFilter}>
          <Select.Option value="Available">Available</Select.Option>
          <Select.Option value="Reserved">Reserved</Select.Option>
          <Select.Option value="Sold">Sold</Select.Option>
          <Select.Option value="Cancelled">Cancelled</Select.Option>
        </Select>
      </Space>

      <Card>
        <Table columns={columns} dataSource={products} rowKey="id" loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
          onRow={(record) => ({ onClick: () => navigate(`/products/${record.id}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: 'No products found' }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal title={editProduct ? 'Edit Product' : 'Add Product'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={editProduct || { condition: 'A' }}>
          <Form.Item name="productName" label="Product Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="brand" label="Brand"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="category" label="Category"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="size" label="Size"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="color" label="Color"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="condition" label="Condition"><Select options={[{ value: 'A+' }, { value: 'A' }, { value: 'B' }]} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="costPrice" label="Cost Price"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="sellingPrice" label="Selling Price"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
