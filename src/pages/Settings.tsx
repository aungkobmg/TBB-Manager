import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, message, Tabs, Divider } from 'antd';
import { SaveOutlined, DownloadOutlined, LockOutlined } from '@ant-design/icons';
import { fetchSettings, updateSettings } from '../utils/storage';
import { settingsApi } from '../api/services';
import type { Settings as SettingsType } from '../utils/storage';

const { Title, Text } = Typography;

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSettings()
      .then(res => {
        setSettings(res);
        form.setFieldsValue(res);
      })
      .catch(() => message.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      await updateSettings(values);
      message.success('Settings updated');
    } catch (err) {
      message.error('Failed to update settings');
    }
  };

  const handleExport = () => {
    settingsApi.backup();
    message.success('Database export started');
  };

  const tabItems = [
    {
      key: 'business',
      label: 'Business Information',
      children: (
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ maxWidth: 600 }}>
          <Form.Item name="business_name" label="Business Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone Number">
            <Input />
          </Form.Item>
          <Form.Item name="facebook" label="Facebook Page">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Business Address">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="voucher_footer" label="Voucher Footer Message">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="currency" label="Currency">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Save Settings</Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'backup',
      label: 'Backup',
      children: (
        <Card>
          <Title level={5}>Database Backup</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Export all business data as a JSON backup file. This includes bales, products, customers, orders, expenses, and activity logs.
          </Text>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            Export Database Backup
          </Button>
          <Divider />
          <Text type="secondary" style={{ fontSize: 12 }}>
            For production deployment with MySQL, use phpMyAdmin or command-line tools to create SQL backups.
          </Text>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Settings</Title>
      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
