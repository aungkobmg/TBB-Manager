import { useState } from 'react';
import { Card, Tabs, Table, Typography, Row, Col, Statistic, DatePicker, Space, Tag, Divider } from 'antd';
import {
  CalendarOutlined,
  BarChartOutlined,
  InboxOutlined,
  FundOutlined,
  TeamOutlined,
  RiseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { getOrders, getProducts, getExpenses, getBales, getCustomers, formatCurrency, formatDate } from '../utils/storage';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function Reports() {
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const orders = getOrders();
  const products = getProducts();
  const expenses = getExpenses();
  const bales = getBales();
  const customers = getCustomers();

  const getDateFilter = () => {
    if (!dateRange) return null;
    const from = dateRange[0]?.format('YYYY-MM-DD');
    const to = dateRange[1]?.format('YYYY-MM-DD');
    return { from, to };
  };

  const filterByDate = (dateStr: string) => {
    const range = getDateFilter();
    if (!range) return true;
    return dateStr >= range.from && dateStr <= range.to;
  };

  const filteredOrders = orders.filter(o => filterByDate(o.orderDate?.slice(0, 10) || '') && o.orderStatus !== 'Cancelled');
  const filteredExpenses = expenses.filter(e => filterByDate(e.expenseDate?.slice(0, 10) || ''));

  const tabItems = [
    {
      key: 'daily-sales',
      label: <span><CalendarOutlined /> Daily Sales</span>,
      children: (() => {
        const byDate: Record<string, { orders: number; revenue: number }> = {};
        filteredOrders.forEach(o => {
          const d = o.orderDate?.slice(0, 10) || '';
          if (!byDate[d]) byDate[d] = { orders: 0, revenue: 0 };
          byDate[d].orders++;
          byDate[d].revenue += o.totalAmount;
        });
        const data = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, info]) => ({ key: date, date, ...info }));
        return (
          <Table
            dataSource={data}
            pagination={{ pageSize: 30 }}
            columns={[
              { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
              { title: 'Orders', dataIndex: 'orders', key: 'orders', align: 'center' },
              { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', align: 'right', render: (v: number) => formatCurrency(v) },
            ]}
            locale={{ emptyText: 'No data' }}
          />
        );
      })(),
    },
    {
      key: 'monthly-sales',
      label: <span><BarChartOutlined /> Monthly Sales</span>,
      children: (() => {
        const byMonth: Record<string, { orders: number; revenue: number }> = {};
        filteredOrders.forEach(o => {
          const m = o.orderDate?.slice(0, 7) || '';
          if (!byMonth[m]) byMonth[m] = { orders: 0, revenue: 0 };
          byMonth[m].orders++;
          byMonth[m].revenue += o.totalAmount;
        });
        const data = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0])).map(([month, info]) => ({ key: month, month, ...info }));
        return (
          <Table
            dataSource={data}
            pagination={false}
            columns={[
              { title: 'Month', dataIndex: 'month', key: 'month' },
              { title: 'Orders', dataIndex: 'orders', key: 'orders', align: 'center' },
              { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', align: 'right', render: (v: number) => formatCurrency(v) },
            ]}
            locale={{ emptyText: 'No data' }}
          />
        );
      })(),
    },
    {
      key: 'inventory',
      label: <span><InboxOutlined /> Inventory</span>,
      children: (() => {
        const available = products.filter(p => p.status === 'Available');
        const costValue = available.reduce((s, p) => s + p.costPrice, 0);
        const sellValue = available.reduce((s, p) => s + p.sellingPrice, 0);
        return (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={8}>
                <Card size="small"><Statistic title="Available" value={available.length} /></Card>
              </Col>
              <Col xs={8}>
                <Card size="small"><Statistic title="Cost Value" value={costValue} precision={0} formatter={(v) => `${Number(v).toLocaleString()} MMK`} /></Card>
              </Col>
              <Col xs={8}>
                <Card size="small"><Statistic title="Selling Value" value={sellValue} precision={0} formatter={(v) => `${Number(v).toLocaleString()} MMK`} /></Card>
              </Col>
            </Row>
            <Table
              dataSource={products}
              rowKey="id"
              pagination={{ pageSize: 20 }}
              size="small"
              columns={[
                { title: 'Code', dataIndex: 'productCode', key: 'productCode', render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
                { title: 'Name', dataIndex: 'productName', key: 'productName' },
                { title: 'Cost', dataIndex: 'costPrice', key: 'costPrice', align: 'right', render: (v: number) => formatCurrency(v) },
                { title: 'Sell', dataIndex: 'sellingPrice', key: 'sellingPrice', align: 'right', render: (v: number) => formatCurrency(v) },
                { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'Available' ? 'green' : s === 'Sold' ? 'blue' : 'default'}>{s}</Tag> },
              ]}
            />
          </div>
        );
      })(),
    },
    {
      key: 'bale-performance',
      label: <span><FundOutlined /> Bale Performance</span>,
      children: (() => {
        const data = bales.map(b => {
          const bProducts = products.filter(p => p.baleId === b.id);
          const soldProducts = bProducts.filter(p => p.status === 'Sold');
          const revenue = orders.filter(o => o.orderStatus !== 'Cancelled').reduce((s, o) =>
            s + o.items.filter(i => bProducts.find(p => p.id === i.productId)).reduce((is, i) => is + i.lineTotal, 0), 0);
          const cost = soldProducts.reduce((s, p) => s + p.costPrice, 0);
          return {
            key: b.id,
            baleCode: b.baleCode,
            baleCost: b.baleCost,
            products: bProducts.length,
            sold: soldProducts.length,
            revenue,
            profit: revenue - cost,
          };
        });
        return (
          <Table
            dataSource={data}
            pagination={false}
            columns={[
              { title: 'Bale Code', dataIndex: 'baleCode', key: 'baleCode', render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
              { title: 'Cost', dataIndex: 'baleCost', key: 'baleCost', align: 'right', render: (v: number) => formatCurrency(v) },
              { title: 'Products', dataIndex: 'products', key: 'products', align: 'center' },
              { title: 'Sold', dataIndex: 'sold', key: 'sold', align: 'center' },
              { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', align: 'right', render: (v: number) => formatCurrency(v) },
              { title: 'Profit', dataIndex: 'profit', key: 'profit', align: 'right', render: (v: number) => <Text style={{ color: v >= 0 ? '#52c41a' : '#cf1322' }}>{formatCurrency(v)}</Text> },
            ]}
            locale={{ emptyText: 'No bales' }}
          />
        );
      })(),
    },
    {
      key: 'profit-loss',
      label: <span><RiseOutlined /> Profit & Loss</span>,
      children: (() => {
        const revenue = filteredOrders.reduce((s, o) => s + o.totalAmount, 0);
        const productCost = filteredOrders.reduce((s, o) =>
          s + o.items.reduce((is, i) => {
            const p = products.find(pr => pr.id === i.productId);
            return is + (p?.costPrice || 0) * i.quantity;
          }, 0), 0);
        const grossProfit = revenue - productCost;
        const expTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);
        const netProfit = grossProfit - expTotal;
        return (
          <div style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Text>Revenue</Text>
              <Text strong style={{ color: '#52c41a' }}>{formatCurrency(revenue)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Text>Product Cost</Text>
              <Text strong style={{ color: '#fa8c16' }}>-{formatCurrency(productCost)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Text strong>Gross Profit</Text>
              <Text strong style={{ color: '#1890ff' }}>{formatCurrency(grossProfit)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Text>Operating Expenses</Text>
              <Text strong style={{ color: '#cf1322' }}>-{formatCurrency(expTotal)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '2px solid #000' }}>
              <Text strong style={{ fontSize: 18 }}>Net Profit</Text>
              <Text strong style={{ fontSize: 18, color: netProfit >= 0 ? '#389e0d' : '#cf1322' }}>{formatCurrency(netProfit)}</Text>
            </div>
          </div>
        );
      })(),
    },
    {
      key: 'customer-history',
      label: <span><TeamOutlined /> Customer History</span>,
      children: (() => {
        const data = customers.map(c => {
          const cOrders = orders.filter(o => o.customerId === c.id && o.orderStatus !== 'Cancelled');
          return {
            key: c.id,
            name: c.name,
            phone: c.phone,
            orders: cOrders.length,
            total: cOrders.reduce((s, o) => s + o.totalAmount, 0),
          };
        }).filter(d => d.orders > 0);
        return (
          <Table
            dataSource={data}
            pagination={{ pageSize: 20 }}
            columns={[
              { title: 'Customer', dataIndex: 'name', key: 'name' },
              { title: 'Phone', dataIndex: 'phone', key: 'phone' },
              { title: 'Orders', dataIndex: 'orders', key: 'orders', align: 'center' },
              { title: 'Total Spent', dataIndex: 'total', key: 'total', align: 'right', render: (v: number) => formatCurrency(v) },
            ]}
            locale={{ emptyText: 'No customer orders' }}
          />
        );
      })(),
    },
    {
      key: 'voucher-history',
      label: <span><FileTextOutlined /> Voucher History</span>,
      children: (() => {
        const allOrders = orders.filter(o => o.voucherNumber);
        const data = allOrders
          .filter(o => filterByDate(o.orderDate?.slice(0, 10) || ''))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map(o => ({
            key: o.id,
            voucherNumber: o.voucherNumber,
            date: o.orderDate,
            customer: o.customerNameSnapshot,
            phone: o.phoneSnapshot,
            items: o.items.length,
            total: o.totalAmount,
            status: o.orderStatus,
            payment: o.paymentMethod,
          }));
        return (
          <Table
            dataSource={data}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            columns={[
              { title: 'Voucher No.', dataIndex: 'voucherNumber', key: 'voucherNumber', render: (v: string) => <Text strong style={{ fontFamily: 'monospace', color: '#0057B8' }}>{v}</Text> },
              { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
              { title: 'Customer', dataIndex: 'customer', key: 'customer' },
              { title: 'Items', dataIndex: 'items', key: 'items', align: 'center' },
              { title: 'Total', dataIndex: 'total', key: 'total', align: 'right', render: (v: number) => formatCurrency(v) },
              { title: 'Payment', dataIndex: 'payment', key: 'payment' },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (s: string) => {
                  const colors: Record<string, string> = {
                    Pending: 'gold', Confirmed: 'blue', Packed: 'purple',
                    Shipped: 'cyan', Delivered: 'green', Cancelled: 'red',
                  };
                  return <Tag color={colors[s]}>{s}</Tag>;
                },
              },
            ]}
            locale={{ emptyText: 'No vouchers' }}
          />
        );
      })(),
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
