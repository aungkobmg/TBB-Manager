import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, Button, Space, Typography, Descriptions, Table, Divider, Tag } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { getOrder, getSettings, formatCurrency, formatDate } from '../utils/storage';

const { Title, Text } = Typography;

export default function VoucherView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = getOrder(Number(id));
  const settings = getSettings();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!order) return <div style={{ textAlign: 'center', padding: 48 }}><Text type="secondary">Voucher not found</Text></div>;

  const handlePrint = () => {
    window.print();
  };

  const orderDate = new Date(order.orderDate);
  const dateStr = orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = orderDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      {/* Screen View - Hidden during print */}
      <div className="no-print">
        <div style={{ marginBottom: 24 }}>
          <Link to={`/orders/${order.id}`}>
            <Button type="link" icon={<ArrowLeftOutlined />} style={{ padding: 0, marginBottom: 8 }}>
              Back to Order
            </Button>
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              Voucher: {order.voucherNumber}
            </Title>
            <Space>
              <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
                Print Receipt
              </Button>
            </Space>
          </div>
        </div>

        {/* Preview Card */}
        <Card style={{ maxWidth: 400, margin: '0 auto', border: '2px dashed #d9d9d9' }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Text strong style={{ fontSize: 16 }}>{settings.businessName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>Voucher Preview (80mm)</Text>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div style={{ fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text type="secondary">Voucher No:</Text>
              <Text strong style={{ fontFamily: 'monospace' }}>{order.voucherNumber}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text type="secondary">Date:</Text>
              <Text>{dateStr}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">Time:</Text>
              <Text>{timeStr}</Text>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>CUSTOMER</Text>
              <div><Text>{order.customerNameSnapshot}</Text></div>
              <div><Text type="secondary" style={{ fontSize: 12 }}>{order.phoneSnapshot}</Text></div>
              <div><Text type="secondary" style={{ fontSize: 12 }}>{order.shippingAddressSnapshot}</Text></div>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>ITEMS</Text>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ fontFamily: 'monospace' }}>{item.productCodeSnapshot}</span>
                  <span>{item.quantity}</span>
                  <span>{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text>Subtotal</Text>
              <Text>{formatCurrency(order.subtotal)}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text>Delivery Fee</Text>
              <Text>{formatCurrency(order.deliveryFee)}</Text>
            </div>
            <Divider style={{ margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text strong style={{ fontSize: 14 }}>TOTAL</Text>
              <Text strong style={{ fontSize: 14, color: '#0057B8' }}>{formatCurrency(order.totalAmount)}</Text>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Payment: {order.paymentMethod}</Text>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ textAlign: 'center', fontSize: 11 }}>
              <div>Facebook: {settings.facebook}</div>
              <div>Phone: {settings.phone}</div>
              <div style={{ marginTop: 4 }}>{settings.voucherFooter}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Thermal Receipt - Only visible during print */}
      <div className="thermal-receipt" ref={receiptRef}>
        <div className="receipt-header">
          <div className="business-name">{settings.businessName}</div>
        </div>

        <div className="receipt-info">
          <div className="info-row">
            <span>Voucher No:</span>
            <span style={{ fontWeight: 'bold' }}>{order.voucherNumber}</span>
          </div>
          <div className="info-row">
            <span>Date:</span>
            <span>{dateStr}</span>
          </div>
          <div className="info-row">
            <span>Time:</span>
            <span>{timeStr}</span>
          </div>
        </div>

        <div className="customer-section">
          <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>CUSTOMER</div>
          <div>Name: {order.customerNameSnapshot}</div>
          <div>Phone: {order.phoneSnapshot}</div>
          <div>Address:</div>
          <div style={{ paddingLeft: '2mm' }}>{order.shippingAddressSnapshot}</div>
        </div>

        <div className="items-table">
          <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>ITEMS</div>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.productCodeSnapshot}</td>
                  <td>{item.quantity}</td>
                  <td>{item.lineTotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="totals">
          <div className="total-row">
            <span>Subtotal</span>
            <span>{order.subtotal.toLocaleString()}</span>
          </div>
          <div className="total-row">
            <span>Delivery Fee</span>
            <span>{order.deliveryFee.toLocaleString()}</span>
          </div>
          <div className="total-row grand-total">
            <span>TOTAL</span>
            <span>{order.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="payment-method">
          Payment: {order.paymentMethod}
        </div>

        <div className="footer">
          <div>Facebook: {settings.facebook}</div>
          <div>Phone: {settings.phone}</div>
          <div style={{ marginTop: '2mm' }}>{settings.voucherFooter}</div>
        </div>
      </div>
    </div>
  );
}
