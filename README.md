# TBB OS — The Bra Boutique Operating System

A complete business operating system for **The Bra Boutique (Yangon)** — a used clothing/bra resale business.

## 🎯 Overview

TBB OS manages the complete business flow:

```
Bale Purchase → Product Processing → Inventory → Customer Order → Voucher → Delivery → Revenue/Expense → Profit
```

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Ant Design 5** for UI components
- **React Router 6** for navigation
- **Vite** for build tooling
- **Code Splitting** with lazy loading

### Backend
- **PHP 8.4+** REST API
- **MySQL 8+** database
- **Session-based authentication**
- **Transaction-safe operations**

### Deployment
- **Hostinger Shared Hosting** compatible
- No Node.js runtime required in production
- Standard PHP/MySQL hosting

## ✨ Features

### Core Modules

1. **Dashboard** — Real-time business metrics
2. **Bale Management** — Track incoming stock purchases
3. **Inventory** — Individual product tracking with unique codes
4. **Customer Database** — Customer profiles with order history
5. **Quick Order** — Fast order creation workflow
6. **Order Management** — Complete order lifecycle
7. **Voucher Generation** — Auto-generated voucher numbers
8. **80mm Thermal Printing** — Optimized for XPrinter XP-80U
9. **Finance** — Revenue, expenses, profit tracking
10. **Reports** — Daily/Monthly sales, inventory, P&L
11. **Settings** — Business configuration
12. **Activity Logs** — Complete audit trail

### Key Business Rules

- ✅ Products can only be sold once (double-selling prevention)
- ✅ Customer info is snapshotted in orders (historical integrity)
- ✅ Cancelled orders don't count as revenue
- ✅ Voucher numbers are unique per date
- ✅ Product codes are auto-generated and unique
- ✅ Financial calculations are server-side authoritative
- ✅ Transaction-safe order creation with rollback

## 📦 Tech Stack

### Frontend
```
React 18 + TypeScript
Ant Design 5
React Router 6
Vite
```

### Backend
```
PHP 8.4+
MySQL 8+
REST API
Session Authentication
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PHP 8.4+
- MySQL 8+

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd tbb-os

# 2. Install frontend dependencies
npm install

# 3. Setup backend
cd backend
cp .env.example .env
# Edit .env with your database credentials

# 4. Create database
mysql -u root -p -e "CREATE DATABASE tbb_os CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p tbb_os < ../database/schema.sql

# 5. Start backend
php -S localhost:8000 -t public

# 6. Start frontend (new terminal)
npm run dev
```

Visit http://localhost:3000

Then run the installer at `/api/install.php` (or `/install.php` when serving `backend/public`) to create the first admin account with your own credentials.

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT.md) — Complete production deployment instructions
- [API Documentation](backend/README.md) — REST API endpoints
- [Database Schema](database/schema.sql) — MySQL table structure

## 🗂️ Project Structure

```
tbb-os/
├── src/                    # Frontend source
│   ├── api/               # API client & services
│   ├── pages/             # React pages (15 pages)
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── App.tsx            # Main app component
├── backend/               # PHP backend
│   ├── app/
│   │   ├── Controllers/   # API controllers (10 controllers)
│   │   ├── Helpers/       # Auth, Response helpers
│   │   └── Services/      # Business logic
│   ├── config/            # Database, environment config
│   └── public/            # Web root (index.php, .htaccess)
├── database/
│   └── schema.sql         # MySQL schema (11 tables)
├── dist/                  # Production build output
└── DEPLOYMENT.md          # Deployment guide
```

## 🎨 Brand Colors

- **Primary:** #0057B8
- **Dark:** #0A1930
- **Light:** #F5F9FF
- **White:** #FFFFFF

## 🔐 Security Features

- Password hashing (bcrypt)
- Session-based authentication
- CSRF protection
- SQL injection prevention (prepared statements)
- XSS protection
- Secure session handling
- Activity logging
- Role-based access control

## 📊 Database Schema

### Core Tables
- `users` — System users
- `settings` — Business configuration
- `bales` — Stock purchases
- `products` — Individual items
- `customers` — Customer profiles
- `orders` — Sales orders
- `order_items` — Order line items
- `expenses` — Business expenses
- `transactions` — Financial records
- `activity_logs` — Audit trail
- `voucher_sequences` — Voucher number generation

## 🖨️ Thermal Printing

Optimized for **XPrinter XP-80U** (80mm thermal printer):
- Dedicated print CSS
- Clean receipt layout
- Customer-facing information only
- No internal data exposed

## 📈 Performance

### Frontend
- Code splitting with lazy loading
- Initial bundle: ~500KB (165KB gzipped)
- 39 optimized chunks
- Route-level code splitting

### Backend
- Database indexes on frequently queried fields
- Server-side pagination
- Prepared statements
- Efficient SQL queries
- Aggregation for reports

## 🛠️ Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚢 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete instructions.

### Quick Deployment Steps

1. Upload `backend/` to Hostinger
2. Serve `backend/public/` as the `/api` web root and keep `app/`, `config/`, `storage/`, and `.env` outside the public web root
3. Configure backend `.env` with database credentials and frontend origin
4. Import `database/schema.sql`, then run `/api/install.php` once to create the first admin user
5. Build frontend: `npm run build`
6. Upload `dist/` plus `public/.htaccess` to the frontend web root
7. Delete or disable installer access after setup

## 📝 License

Proprietary — The Bra Boutique (Yangon)

## 👥 Credits

Built for **The Bra Boutique (Yangon)**

---

**Status:** Deployment requires environment-specific verification

**Last Updated:** 2026

**Version:** 1.0.0
