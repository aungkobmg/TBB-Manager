import { useState, useEffect } from 'react';
import { Card, Tabs, Table, Typography, DatePicker, Space, Tag } from 'antd';
import { CalendarOutlined, BarChartOutlined, InboxOutlined, FundOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import { reportApi, formatCurrency, formatDate } from '../api/services';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function Reports() {
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [balePerformance, setBalePerformance] = useState<any[]>([]);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [voucherHistory, setVoucherHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = dateRange ? { date_from: dateRange[0].format('YYYY-MM-DD'), date_to: dateRange[1].format('YYYY-MM-DD') } : {};
      const [daily, monthly, bales, pl, customers, vouchers] = await Promise.all([
        reportApi.dailySales(params),
        reportApi.monthlySales(params),
        reportApi.balePerformance(),
        reportApi.profitLoss(params),
        reportApi.customerHistory(),
        reportApi.voucherHistory(),
      ]);
      setDailySales(daily.data || []);
      setMonthlySales(monthly.data || []);
      setBalePerformance(bales.data || []);
      setProfitLoss(pl.data || null);
      setCustomerHistory(customers.data || []);
      setVoucherHistory(vouchers.data || []);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, [dateRange]);

  const tabItems = [
    {
      key: 'daily',
      label: <span><CalendarOutlined /> Daily Sales</span>,
      children: (
        <Table
          dataSource={dailySales}
          rowKey="date"
          loading={loading}
          columns={[
            { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
            { title: 'Orders', dataIndex: 'orders', key: 'orders', align: 'center' as const },
            { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', align: 'right' as const, render: (v: number) => formatCurrency(v) },
          ]}
          locale={{ emptyText: 'No data' }}
        />
      ),
    },
    {
      key: 'monthly',
      label: <span><BarChartOutlined /> Monthly Sales</span>,
      children: (
        <Table
          dataSource={monthlySales}
          rowKey="month"
          loading={loading}
          columns={[
            { title: 'Month', dataIndex: 'month', key: 'month' },
            { title: 'Orders', dataIndex: 'orders', key: 'orders', align: 'center' as const },
            { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', align: 'right' as const, render: (v: number) => formatCurrency(v) },
          ]}
          locale={{ emptyText: 'No data' }}
        />
      ),
    },
    {
      key: 'bales',
      label: <span><InboxOutlined /> Bale Performance</span>,
      children: (
        <Table
          dataSource={balePerformance}
          rowKey="id"
          loading={loading}
          columns={[
            { title: 'Bale Code', dataIndex: 'bale_code', key: 'code', render: (v: string) => <Text strong style={{ fontFamily: 'monospace' }}>{v}</Text> },
            { title: 'Supplier', dataIndex: 'supplier_name', key: 'supplier' },
            { title: 'Cost', dataIndex: 'bale_cost', key: 'cost', align: 'right' as const, render: (v: number) => formatCurrency(v) },
            { title: 'Products', dataIndex: 'product_count', key: 'products', align: 'center' as const },
            { title: 'Sold', dataIndex: 'sold_count', key: 'sold', align: 'center' as const },
            { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', align: 'right' as const, render: (v: number) => formatCurrency(v) },
            { title: 'Profit', dataIndex: 'profit', key: 'profit', align: 'right' as const, render: (v: number) => <Text type={v >= 0 ? 'success' : 'danger'}>{formatCurrency(v)}</Text> },
          ]}
          locale={{ emptyText: 'No bales' }}
        />
      ),
    },
    {
      key: 'pl',
      label: <span><FundOutlined /> Profit & Loss</span>,
      children: profitLoss ? (
        <Card>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>Revenue</Text>
              <Text strong style={{ color: '#3f8600' }}>{formatCurrency(profitLoss.revenue)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>Product Cost</Text>
              <Text strong style={{ color: '#cf1322' }}>-{formatCurrency(profitLoss.product_cost)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ccc', paddingTop: 8 }}>
              <Text strong>Gross Profit</Text>
              <Text strong style={{ color: '#3f8600' }}>{formatCurrency(profitLoss.gross_profit)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>Operating Expenses</Text>
              <Text strong style={{ color: '#cf1322' }}>-{formatCurrency(profitLoss.expenses)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', paddingTop: 8, fontSize: 18 }}>
              <Text strong>Net Profit</Text>
              <Text strong style={{ color: profitLoss.net_profit >= 0 ? '#3f8600' : '#cf1322' }}>{formatCurrency(profitLoss.net_profit)}</Text>
            </div>
          </Space>
        </Card>
      ) : <Card loading />,
    },
    {
      key: 'customers',
      label: <span><TeamOutlined /> Customer History</span>,
      children: (
        <Table
          dataSource={customerHistory}
          rowKey="id"
          loading={loading}
          columns={[
            { title: 'Customer', dataIndex: 'name', key: 'name' },
            { title: 'Phone', dataIndex: 'phone', key: 'phone' },
            { title: 'Orders', dataIndex: 'order_count', key: 'orders', align: 'center' as const },
            { title: 'Total Spent', dataIndex: 'total_spent', key: 'total', align: 'right' as const, render: (v: number) => formatCurrency(v) },
          ]}
          locale={{ emptyText: 'No customers' }}
        />
      ),
    },
    {
      key: 'vouchers',
      label: <span><FileTextOutlined /> Voucher History</span>,
      children: (
        <Table
          dataSource={voucherHistory}
          rowKey="id"
          loading={loading}
          columns={[
            { title: 'Voucher', dataIndex: 'voucher_number', key: 'voucher', render: (v: string) => <Text strong style={{ fontFamily: 'monospace', color: '#0057B8' }}>{v}</Text> },
            { title: 'Date', dataIndex: 'order_date', key: 'date', render: (d: string) => formatDate(d) },
            { title: 'Customer', dataIndex: 'customer_name_snapshot', key: 'customer' },
            { title: 'Items', dataIndex: 'item_count', key: 'items', align: 'center' as const },
            { title: 'Total', dataIndex: 'total_amount', key: 'total', align: 'right' as const, render: (v: number) => formatCurrency(v) },
            { title: 'Status', dataIndex: 'order_status', key: 'status', render: (s: string) => {
              const colors: Record<string, string> = { Pending: 'gold', Confirmed: 'blue', Packed: 'purple', Shipped: 'cyan', Delivered: 'green', Cancelled: 'red' };
              return <Tag color={colors[s]}>{s}</Tag>;
            }},
          ]}
          locale={{ emptyText: 'No vouchers' }}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Reports</Title>
        <RangePicker onChange={(dates) => setDateRange(dates as any)} />
      </div>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}
