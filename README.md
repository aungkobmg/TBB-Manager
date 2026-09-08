# TBB OS - The Bra Boutique Operating System

A production-ready Business Operating System for **The Bra Boutique (Yangon)**, built with React, TypeScript, and Ant Design.

## 🎯 Overview

TBB OS is a complete business management system designed specifically for a used clothing/bra resale business. It manages the entire workflow from bale purchase to final sale, with focus on:

- **Fast order creation** - Quick Order workflow for rapid processing
- **Reliable inventory tracking** - Prevent double-selling, track product lifecycle
- **Customer database** - Complete customer management with order history
- **Voucher generation** - Auto-generated voucher numbers with thermal receipt printing
- **Financial visibility** - Revenue, expenses, and profit tracking
- **Bale management** - Track incoming stock and product sourcing

## 🚀 Features

### Core Modules

1. **Authentication**
   - Secure login/logout
   - Session management (8-hour timeout)
   - Password hashing
   - Activity logging

2. **Dashboard**
   - Real-time metrics (revenue, orders, inventory value, profit)
   - Recent orders and expenses
   - Quick statistics

3. **Bale Management**
   - Create/edit bales with auto-generated codes (BAL-YYMMDD-###)
   - Track supplier, cost, expected/actual quantities
   - Status tracking (Purchased → Processing → Completed → Closed)
   - View linked products

4. **Inventory Management**
   - Product CRUD with auto-generated codes (TBB-000001)
   - Condition grading (A+/A/B)
   - Status tracking (Available → Reserved → Sold → Cancelled)
   - Search and filter by code, name, brand, size, condition, status
   - Link products to source bales

5. **Customer Database**
   - Complete customer profiles
   - Search by name, phone, Facebook
   - View order history and total spending
   - Customer details drawer

6. **Quick Order** ⚡ (Priority #1)
   - Fast workflow: Customer → Product Code → Order → Voucher
   - Real-time product code validation
   - Prevents double-selling
   - Auto-calculate totals
   - Multiple payment methods (COD, KBZ Pay, Wave Pay, AYA Pay)
   - Delivery company selection

7. **Order Management**
   - Full order lifecycle (Pending → Confirmed → Packed → Shipped → Delivered)
   - Status management with controlled cancellation
   - Product release on cancellation
   - Order details with customer snapshots

8. **Voucher Generation** ⚡ (Priority #2)
   - Auto-generated voucher numbers (TBB-YYMMDD-####)
   - Unique per date
   - Immutable historical data
   - Print preview

9. **80mm Thermal Printing** ⚡ (Priority #3)
   - Optimized for XPrinter XP-80U
   - Clean receipt layout
   - Customer-facing info only
   - Dedicated print CSS

10. **Finance**
    - Revenue tracking from valid sales
    - Expense management (Bale Purchase, Delivery, Packaging, Misc)
    - Gross profit calculation (Revenue - Product Cost)
    - Net profit calculation (Gross Profit - Expenses)

11. **Reports**
    - Daily Sales
    - Monthly Sales
    - Inventory Report
    - Bale Performance
    - Profit & Loss
    - Customer Purchase History
    - Date range filtering

12. **Settings**
    - Business information configuration
    - Password change
    - Database backup export

13. **Activity Logs**
    - Complete audit trail
    - Track all business actions
    - Searchable and filterable

## 🎨 Design System

### Brand Colors
- **Primary**: #0057B8
- **Dark**: #0A1930
- **Light**: #F5F9FF
- **White**: #FFFFFF

### UI Framework
- **Ant Design** - Primary component library
- Clean, modern, professional interface
- Mobile responsive
- Desktop optimized

## 📦 Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Ant Design** - UI components
- **React Router** - Navigation
- **LocalStorage** - Data persistence (demo)
- **Vite** - Build tool

## 🗄️ Data Model

### Core Entities

**Bale**
- baleCode, purchaseDate, supplierName, baleCost
- expectedQty, actualQty, status, notes

**Product**
- productCode, productName, brand, category, size, color
- condition (A+/A/B), costPrice, sellingPrice
- baleId, status (Available/Reserved/Sold/Cancelled)

**Customer**
- name, phone, facebookName, address, township, city, notes

**Order**
- voucherNumber, orderDate, customerId
- customerNameSnapshot, phoneSnapshot, shippingAddressSnapshot
- deliveryCompany, trackingNumber, paymentMethod
- deliveryFee, subtotal, totalAmount
- orderStatus, paymentStatus

**Expense**
- expenseDate, category, amount, description, reference

**Activity Log**
- userId, action, entityType, entityId, description, ipAddress

## 🔐 Business Rules

1. **Product can only be sold once** - Prevented at application level
2. **Customer info is snapshotted in orders** - Historical integrity preserved
3. **Cancelled orders don't count as revenue** - Financial accuracy
4. **Voucher numbers are unique per date** - No duplicates
5. **Product codes are auto-generated and unique** - TBB-000001, TBB-000002, etc.
6. **Bale codes are auto-generated** - BAL-YYMMDD-###
7. **No mock/demo data** - System starts empty, ready for real data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Login Credentials

**Default Admin Account:**
- Username: `admin`
- Password: `admin123`

⚠️ **Important**: Change the default password after first login!

## 📱 Usage Guide

### Quick Order Workflow (Fastest Path)

1. Navigate to **Quick Order**
2. Search or create customer
3. Enter product code (e.g., TBB-000001) and press Enter
4. Repeat for additional products
5. Set delivery fee and payment method
6. Click "Place Order & Generate Voucher"
7. Print thermal receipt

### Adding Products to Inventory

1. Navigate to **Inventory**
2. Click "Add Product"
3. Fill in product details
4. Optionally link to source bale
5. Product code is auto-generated

### Managing Bales

1. Navigate to **Bales**
2. Click "Add Bale"
3. Enter supplier, cost, quantities
4. Bale code is auto-generated
5. Update status as processing progresses

### Generating Reports

1. Navigate to **Reports**
2. Select report type (Daily Sales, Monthly, Inventory, etc.)
3. Optionally set date range
4. View data tables with calculations

## 🖨️ Thermal Printing Setup

### Printer: XPrinter XP-80U
### Paper: 80mm thermal

The voucher is optimized for 80mm thermal printing:
- Clean receipt layout
- Customer-facing info only
- No internal data (costs, profit, status)
- Proper line spacing and alignment

**To Print:**
1. Open order voucher
2. Click "Print Receipt"
3. Select XPrinter XP-80U
4. Print

## 📊 Financial Calculations

**Revenue** = Sum of all non-cancelled order totals

**Product Cost** = Sum of cost prices for sold products

**Gross Profit** = Revenue - Product Cost

**Total Expenses** = Sum of all expense records

**Net Profit** = Gross Profit - Total Expenses

## 🔒 Security Notes

This is a demo version using localStorage. For production deployment:

1. **Backend Required**: Implement PHP/MySQL backend
2. **Password Hashing**: Use bcrypt on server-side
3. **Session Management**: Use secure HTTP-only cookies
4. **CSRF Protection**: Implement CSRF tokens
5. **Input Validation**: Server-side validation required
6. **SQL Injection**: Use prepared statements
7. **XSS Protection**: Sanitize all user input
8. **Rate Limiting**: Implement API rate limits
9. **Backup**: Regular database backups
10. **HTTPS**: Always use HTTPS in production

## 📦 Production Deployment

### For Hostinger (PHP/MySQL)

This React app needs a PHP backend for production:

1. **Backend API**: Create PHP REST API
2. **Database**: MySQL 8+ with proper schema
3. **Authentication**: Server-side session management
4. **File Structure**:
   ```
   /public (React build)
   /api (PHP backend)
   /config (Database config)
   ```

### Database Schema

See `database-schema.sql` for complete MySQL schema.

### Environment Variables

```env
DB_HOST=localhost
DB_NAME=tbb_os
DB_USER=your_user
DB_PASS=your_password
APP_URL=https://yourdomain.com
```

## 📝 Development Notes

### Data Persistence

Currently uses localStorage for demo purposes. In production:
- Replace localStorage calls with API calls
- Implement proper database transactions
- Add optimistic locking for concurrent access
- Implement proper error handling

### Performance

- Ant Design bundle size: ~1.2MB (gzipped: ~394KB)
- Consider code-splitting for production
- Lazy load routes
- Optimize images

### Testing

Recommended test coverage:
- Authentication flow
- Quick Order workflow
- Product status transitions
- Voucher generation
- Financial calculations
- Print functionality

## 🎯 Key Features Checklist

- ✅ Authentication with session management
- ✅ Dashboard with real-time metrics
- ✅ Bale management with auto-generated codes
- ✅ Inventory with product lifecycle tracking
- ✅ Customer database with order history
- ✅ Quick Order workflow (Priority #1)
- ✅ Voucher generation (Priority #2)
- ✅ 80mm thermal printing (Priority #3)
- ✅ Order management with status workflow
- ✅ Finance tracking (revenue, expenses, profit)
- ✅ Reports with date filtering
- ✅ Settings management
- ✅ Activity logs (audit trail)
- ✅ Database backup export
- ✅ Mobile responsive design
- ✅ Ant Design UI components

## 📄 License

This is a custom-built application for The Bra Boutique (Yangon).

## 🤝 Support

For issues or questions, contact the development team.

---

**Built with ❤️ for The Bra Boutique (Yangon)**
