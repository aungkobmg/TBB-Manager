import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Card, Row, Col, Statistic, Typography, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { fetchBales, createBale, updateBale, formatCurrency, formatDate } from '../utils/storage';
import type { Bale } from '../utils/storage';

const { Title } = Typography;

export default function Bales() {
  const navigate = useNavigate();
  const [bales, setBales] = useState<Bale[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBale, setEditBale] = useState<Bale | null>(null);
  const [form] = Form.useForm();

  const loadBales = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetchBales({ page: p, limit: 20 });
      setBales(res.data);
      setTotal(res.total);
    } catch (err) {
      message.error('Failed to load bales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBales(); }, [page]);

  const handleSubmit = async (values: any) => {
    try {
      if (editBale) {
        await updateBale(editBale.id, values);
        message.success('Bale updated');
      } else {
        await createBale(values);
        message.success('Bale created');
      }
      setModalOpen(false);
      setEditBale(null);
      form.resetFields();
      loadBales();
    } catch (err) {
      message.error('Failed to save bale');
    }
  };

  const columns = [
    { title: 'Bale Code', dataIndex: 'baleCode', key: 'code', render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{v}</span> },
    { title: 'Supplier', dataIndex: 'supplierName', key: 'supplier' },
    { title: 'Date', dataIndex: 'purchaseDate', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Cost', dataIndex: 'baleCost', key: 'cost', align: 'right' as const, render: (v: number) => formatCurrency(v) },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => {
      const colors: Record<string, string> = { Purchased: 'blue', Processing: 'orange', Completed: 'green', Closed: 'default' };
      return <Tag color={colors[s]}>{s}</Tag>;
    }},
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>Bales</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditBale(null); form.resetFields(); setModalOpen(true); }}>Add Bale</Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={bales} rowKey="id" loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
          onRow={(record) => ({ onClick: () => navigate(`/bales/${record.id}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: 'No bales yet' }}
        />
      </Card>

      <Modal title={editBale ? 'Edit Bale' : 'Add Bale'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={editBale || { status: 'Purchased' }}>
          <Form.Item name="supplierName" label="Supplier Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="purchaseDate" label="Purchase Date" rules={[{ required: true }]}><Input type="date" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="baleCost" label="Bale Cost"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="expectedQty" label="Expected Qty"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="actualQty" label="Actual Qty"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="Status"><Select options={[{ value: 'Purchased' }, { value: 'Processing' }, { value: 'Completed' }, { value: 'Closed' }]} /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
