# TBB OS — Deployment Guide

## 📋 Prerequisites

### For Local Development:
- Node.js 18+
- PHP 8.4+
- MySQL 8+
- Composer (optional, for PHP dependencies)

### For Production (Hostinger):
- Hostinger Shared Hosting account with PHP 8.4+ and MySQL support
- FTP/SFTP access or File Manager
- Domain name with SSL certificate

---

## 🚀 Local Development Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

Configure your `.env` file:
```env
APP_NAME="TBB OS"
APP_ENV=development
APP_URL=http://localhost:8000
APP_DEBUG=true

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=tbb_os
DB_USER=root
DB_PASS=your_password
DB_CHARSET=utf8mb4

SESSION_DOMAIN=localhost

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 2. Database Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE tbb_os CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -u root -p tbb_os < ../database/schema.sql
```

Or use the web installer:
```bash
# Start PHP built-in server
php -S localhost:8000 -t public

# Visit http://localhost:8000/install.php
```

### 3. Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Visit http://localhost:3000

Login credentials:
- Username: `admin`
- Password: `admin123`

---

## 🌐 Production Deployment (Hostinger)

### Step 1: Prepare Backend

1. **Upload Backend Files**
   - Upload entire `backend/` directory to your Hostinger account
   - Recommended location: `public_html/api/` or a subdomain

2. **Configure .env**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `.env` with your Hostinger database credentials:
   ```env
   APP_ENV=production
   APP_URL=https://yourdomain.com
   APP_DEBUG=false
   
   DB_HOST=localhost
   DB_NAME=u123456789_tbbos
   DB_USER=u123456789_admin
   DB_PASS=your_secure_password
   
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_secure_password
   ```

3. **Set Permissions**
   ```bash
   chmod 755 backend/public
   chmod 644 backend/public/.htaccess
   chmod 755 backend/storage
   ```

### Step 2: Setup Database

1. **Create MySQL Database** in Hostinger control panel:
   - Database Name: `tbb_os`
   - Database User: Create new user with full privileges
   - Note the credentials

2. **Import Schema**:
   - Use phpMyAdmin from Hostinger control panel
   - Import `database/schema.sql`
   
   Or run the installer:
   - Visit `https://yourdomain.com/api/install.php`
   - Follow the installation wizard

### Step 3: Build Frontend

```bash
# Update API URL
echo "VITE_API_URL=https://yourdomain.com/api" > .env

# Build for production
npm run build
```

### Step 4: Upload Frontend

1. **Upload dist/ directory** to your web root:
   - Location: `public_html/` (for main domain)
   - Or: `public_html/app/` (for subdirectory)

2. **Configure .htaccess** (if using subdirectory):
   ```apache
   RewriteEngine On
   RewriteBase /app/
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /app/index.html [L]
   ```

### Step 5: Configure API URL

Update frontend to point to your backend API:

**Option A: Same Domain**
```env
VITE_API_URL=/api
```

**Option B: Separate Subdomain**
```env
VITE_API_URL=https://api.yourdomain.com
```

**Option C: Subdirectory**
```env
VITE_API_URL=/api
```

### Step 6: Security Checklist

- ✅ Delete `install.php` after installation
- ✅ Change default admin password
- ✅ Set `APP_DEBUG=false` in production
- ✅ Enable HTTPS/SSL
- ✅ Set proper file permissions
- ✅ Configure CORS in backend if needed
- ✅ Setup regular database backups

---

## 🔧 Post-Installation

### 1. Test the Application

1. **Login**: Visit your domain and login with admin credentials
2. **Create a Bale**: Test bale creation
3. **Add Products**: Create some products
4. **Create Customer**: Add a customer
5. **Quick Order**: Test the order workflow
6. **Print Voucher**: Test thermal printing

### 2. Configure Business Settings

1. Go to **Settings** page
2. Update business information:
   - Business Name
   - Phone Number
   - Facebook Page
   - Address
   - Voucher Footer Message

### 3. Setup Thermal Printer

1. Connect XPrinter XP-80U to your computer
2. Install printer driver
3. Set as default printer
4. Configure paper size: 80mm × auto
5. Test print from Voucher page

---

## 📊 Database Backup

### Manual Backup (phpMyAdmin)

1. Login to Hostinger control panel
2. Open phpMyAdmin
3. Select your database
4. Click "Export"
5. Choose "Quick" export method
6. Format: SQL
7. Click "Go"
8. Save the .sql file

### Automated Backup (Recommended)

Create a cron job in Hostinger:

```bash
# Daily backup at 2 AM
0 2 * * * /usr/bin/mysqldump -u DB_USER -p'DB_PASS' DB_NAME | gzip > /home/user/backups/tbb_os_$(date +\%Y\%m\%d).sql.gz
```

### In-App Backup

1. Go to **Settings** → **Backup** tab
2. Click "Export Database Backup"
3. Download the JSON file

---

## 🐛 Troubleshooting

### Issue: API returns 404
**Solution**: Check `.htaccess` file exists in `backend/public/`

### Issue: CORS errors
**Solution**: Update `APP_URL` in backend `.env` to match your frontend domain

### Issue: Database connection failed
**Solution**: 
- Verify database credentials in `.env`
- Check database user has proper permissions
- Ensure database exists

### Issue: Can't login
**Solution**:
- Run installer again to reset admin password
- Or manually update password in database:
  ```sql
  UPDATE users SET password_hash = '$2y$10$...' WHERE username = 'admin';
  ```

### Issue: Voucher not printing correctly
**Solution**:
- Check printer is set as default
- Verify paper size is 80mm
- Clear browser cache
- Try different browser

---

## 📞 Support

For technical support:
- Check the activity logs in the application
- Review error logs in `backend/storage/logs/`
- Enable debug mode temporarily: `APP_DEBUG=true`

---

## 🔐 Security Best Practices

1. **Never commit .env files** to version control
2. **Use strong passwords** for admin and database
3. **Enable HTTPS** for all pages
4. **Regular backups** - daily automated backups
5. **Keep PHP updated** - use latest 8.4.x version
6. **Monitor activity logs** - check for suspicious activity
7. **Limit database permissions** - use dedicated user with minimal privileges
8. **Disable debug mode** in production
9. **Delete install.php** after installation
10. **Use firewall** to restrict database access

---

## 📈 Performance Optimization

### Frontend
- ✅ Code splitting enabled (lazy loading)
- ✅ Tree shaking for unused code
- ✅ Gzip compression on server
- ✅ Browser caching headers

### Backend
- ✅ Database indexes on frequently queried fields
- ✅ Prepared statements for all queries
- ✅ Connection pooling (if using persistent connections)
- ✅ Query optimization for reports

### Server
- Enable OPcache for PHP
- Use CDN for static assets
- Enable browser caching
- Use Redis/Memcached for session storage (optional)

---

## ✅ Deployment Checklist

- [ ] Backend uploaded to server
- [ ] Database created and schema imported
- [ ] Backend `.env` configured
- [ ] `install.php` run successfully
- [ ] `install.php` deleted
- [ ] Frontend built with correct API URL
- [ ] Frontend uploaded to web root
- [ ] HTTPS enabled
- [ ] Admin password changed
- [ ] Business settings configured
- [ ] Thermal printer tested
- [ ] Test order created
- [ ] Backup system configured
- [ ] Activity logs reviewed

---

## 🎉 You're Ready!

Your TBB OS is now live and ready for business operations!

**Quick Start**:
1. Login at your domain
2. Create your first bale
3. Add products from the bale
4. Create a customer
5. Process your first order
6. Print the voucher

Happy selling! 🛍️
