# TBB OS — Hostinger Deployment Guide

This guide describes how to deploy TBB OS using the approved architecture:

```text
React + TypeScript + Vite static frontend
                    ↓
PHP 8.4+ REST API
                    ↓
MySQL 8+
```

The production server does **not** need Node.js. Node.js is required only to build the frontend.

---

## 1. Requirements

### Local build machine

- Node.js 18 or newer
- npm
- Git
- PHP 8.4+ for local backend testing
- MySQL 8+ for local testing

### Hostinger

- PHP 8.4+ enabled
- MySQL 8+ database
- File Manager, FTP, or SFTP access
- HTTPS/SSL enabled for the domain
- Apache `mod_rewrite` enabled
- PHP extensions:
  - PDO
  - PDO MySQL
  - JSON
  - OpenSSL
  - Mbstring
  - Fileinfo

Check the actual PHP version and extensions in Hostinger before deployment. Do not assume that the hosting plan matches the local environment.

---

## 2. Deployment Layout

A recommended same-domain layout is:

```text
public_html/
├── index.html
├── assets/
├── .htaccess                 # frontend React Router fallback
└── api/
    ├── public/               # API web root
    │   ├── index.php
    │   └── .htaccess
    ├── app/
    ├── config/
    ├── storage/
    ├── install.php           # delete after installation
    ├── .env                  # keep outside public access where possible
    └── ...
```

If Hostinger allows a separate document root, configure the API domain or subdomain to point directly to `backend/public/`. This is preferable because `backend/app`, `backend/config`, and `backend/storage` should not be publicly browsable.

If the API is deployed under `public_html/api/`, ensure requests are routed to `api/public/index.php` and that non-public backend directories cannot be downloaded.

---

## 3. Build the Frontend

Run these commands on the local build machine, not on Hostinger shared hosting:

```bash
npm ci
npm run typecheck
npm run build
```

The production build is written to `dist/` according to `vite.config.ts`.

Before building, configure the API URL in the frontend environment file used by the project. For a same-domain deployment:

```dotenv
VITE_API_URL=/api
```

For a separate API subdomain:

```dotenv
VITE_API_URL=https://api.example.com
```

Do not commit production `.env` files or database credentials.

After the build succeeds, upload the **contents of `dist/`** to the frontend document root, normally `public_html/`.

---

## 4. Frontend `.htaccess` for React Router

The frontend document root must contain `.htaccess` so that browser refreshes and direct links such as `/orders/123` return the React application instead of a server 404.

The repository includes `public/.htaccess`, which is copied into the production build when Vite copies the public directory:

```apacheconf
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

If the application is deployed in a subdirectory such as `/app/`, change the rewrite base and fallback target to match that subdirectory:

```apacheconf
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /app/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /app/index.html [L]
</IfModule>
```

Test direct browser access after upload:

```text
https://example.com/
https://example.com/orders/123
https://example.com/customers
```

The route must load the React application rather than returning 404. A valid application-level “not found” page is acceptable for an unknown record, but the web server must not reject the frontend route itself.

---

## 5. Create the Hostinger MySQL Database

1. Open **Hostinger hPanel → Databases → MySQL Databases**.
2. Create a database and database user.
3. Grant the user access to the database.
4. Record the exact Hostinger-generated database name, username, password, host, and port.
5. Open phpMyAdmin if you prefer to import the schema manually.

Hostinger database names and usernames commonly include an account prefix. Use the exact values shown in hPanel; do not use the local defaults from development.

---

## 6. Configure the PHP API Environment

Copy `backend/.env.example` to a private `.env` file on the server and replace every placeholder:

```dotenv
APP_NAME="TBB OS"
APP_ENV=production
APP_URL=https://example.com
APP_DEBUG=false

TIMEZONE=Asia/Yangon

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=hostinger_database_name
DB_USER=hostinger_database_user
DB_PASS=replace_with_a_strong_database_password
DB_CHARSET=utf8mb4

SESSION_DOMAIN=example.com
CORS_ALLOWED_ORIGINS=https://example.com,https://www.example.com
```

Security requirements:

- `APP_ENV=production`
- `APP_DEBUG=false`
- Use HTTPS in `APP_URL`
- Use a strong database password
- Never commit `.env`
- Do not add `ADMIN_PASSWORD` or plaintext production passwords to the environment file
- Keep the business timezone as `Asia/Yangon` unless the business configuration intentionally changes

If the frontend and API use different domains, set `APP_URL` and `CORS_ALLOWED_ORIGINS` to the exact frontend origin(s). Do not use `*` with credentialed session requests.

---

## 7. Upload the Backend

Upload the backend files using one of these supported layouts.

### Preferred: separate API document root

Configure `api.example.com` to use `backend/public/` as its document root. Upload the remaining backend directories outside that public root:

```text
backend-public-root/
├── index.php
└── .htaccess

private-backend-root/
├── app/
├── config/
├── storage/
├── .env
└── install.php
```

### Alternative: API subdirectory

Upload the backend under `public_html/api/`. In that case, ensure the API entry point and rewrite rules match the actual URL prefix. Do not expose `app/`, `config/`, `storage/`, or `.env` as downloadable public directories.

The backend `.htaccess` routes API requests to `index.php` and blocks common sensitive file extensions:

```apacheconf
RewriteEngine On
RewriteBase /

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

If the API is served from a subdirectory, verify the rewrite behavior in the actual Hostinger layout rather than copying a `RewriteBase` blindly.

---

## 8. Initialize the Application

The repository includes `backend/install.php` for first-run initialization.

1. Confirm the `.env` file is configured.
2. Confirm the database user can create and modify tables.
3. Open the installer URL in a browser, for example:

```text
https://example.com/api/install.php
```

or, when using a separate API subdomain:

```text
https://api.example.com/install.php
```

4. Enter a unique administrator username.
5. Enter a strong administrator password. Do not use `admin123` or any other documented/example password.
6. Complete installation.
7. Confirm the login page works.
8. Confirm the `backend/storage/.installed` lock file was created.
9. **Delete `install.php` from the server immediately after successful installation.**

The installer must not be used as a password-reset mechanism. If a production installation already exists, do not remove the lock or rerun the installer without a controlled recovery plan.

A fresh installation should contain only:

- The bootstrap administrator account
- Default business settings
- Empty bales, products, customers, orders, expenses, and financial records

No demo or sample business records should be created.

---

## 9. File Permissions and Storage

Use the least permissive permissions supported by the Hostinger account:

```bash
chmod 755 backend/storage
chmod 755 backend/storage/logs
chmod 755 backend/storage/rate_limits
chmod 640 backend/.env
```

If Hostinger does not permit these exact commands, use File Manager permissions that prevent public write access and keep `.env` private.

The following directories must not be publicly browsable:

- `backend/app/`
- `backend/config/`
- `backend/storage/`
- `backend/vendor/`, if present
- Any directory containing `.env`, logs, sessions, or backup files

Do not store downloadable database backups inside the public web root.

---

## 10. Production Verification Checklist

Perform these checks after deployment:

### Application and routing

- [ ] `https://example.com/` loads the frontend
- [ ] Direct refresh of `/orders/123` loads the React application
- [ ] API health/login request reaches PHP instead of returning a static 404
- [ ] Browser developer tools show no mixed-content HTTP requests
- [ ] HTTPS certificate is valid

### Authentication and security

- [ ] Login succeeds with the installer-created administrator
- [ ] Logout invalidates the session
- [ ] Staff cannot access admin-only endpoints and receives HTTP 403
- [ ] CSRF-protected write requests work only with a valid token
- [ ] Production errors do not expose file paths, SQL, or stack traces
- [ ] `install.php` has been deleted
- [ ] `.env` cannot be downloaded
- [ ] `storage/` cannot be browsed publicly

### Business flow

- [ ] Create a bale
- [ ] Add multiple products to the bale
- [ ] Confirm product codes use the expected format
- [ ] Search for a product by code
- [ ] Create a customer
- [ ] Create a quick order
- [ ] Confirm voucher number format and uniqueness
- [ ] Confirm order customer/address snapshots
- [ ] Confirm payment method and payment status
- [ ] Confirm cancelled orders are excluded from revenue
- [ ] Confirm finance uses historical item cost snapshots
- [ ] Confirm a closed bale rejects new products

### Empty-state behavior

- [ ] Dashboard works with no business records
- [ ] Bale list shows an empty state
- [ ] Product list shows an empty state
- [ ] Customer list shows an empty state
- [ ] Order list shows an empty state
- [ ] Expense and finance screens show zero values without errors

### Backup and recovery

- [ ] Admin-only backup endpoint is accessible
- [ ] Staff cannot download backups
- [ ] Backup is downloaded to the administrator's device and is not stored publicly
- [ ] A backup is copied to secure offline/cloud storage
- [ ] Restore procedure is tested on a separate database before relying on the backup

### Printing

- [ ] Voucher preview renders expected customer-facing fields
- [ ] Browser print preview is checked at 80mm width
- [ ] Physical XPrinter XP-80U testing is completed separately

---

## 11. Database Backups

### Hostinger/phpMyAdmin backup

1. Open phpMyAdmin from Hostinger.
2. Select the TBB OS database.
3. Choose **Export**.
4. Use SQL format.
5. Download the export.
6. Store it outside the public web root.

### Hostinger automated backups

Use Hostinger's backup and cron features where available. If using `mysqldump`, keep credentials out of publicly accessible files and avoid placing generated dumps under `public_html`:

```bash
mysqldump -u DB_USER -p DB_NAME | gzip > /home/account-private/backups/tbb_os_$(date +\%Y\%m\%d).sql.gz
```

Use a private path appropriate to the Hostinger account. Test that the backup can be restored before treating the process as reliable.

### In-application export

The Settings backup endpoint is an authenticated administrative export of business data. It is not a replacement for tested MySQL backups or a restore plan.

---

## 12. Troubleshooting

### Frontend route returns 404 after refresh

- Confirm the frontend `.htaccess` was uploaded to the same directory as `index.html`.
- Confirm `mod_rewrite` is enabled.
- Confirm the rewrite target matches the deployment root (`/index.html` or `/app/index.html`).
- Clear browser/CDN cache after changing rewrite rules.

### API returns 404

- Confirm the API document root points to `backend/public/`, or that the subdirectory rewrite maps to the actual `index.php`.
- Confirm `backend/public/.htaccess` exists.
- Confirm the request URL matches the configured `VITE_API_URL`.
- Check Hostinger Apache/PHP error logs.

### CORS or session errors

- Confirm `APP_URL` matches the frontend origin.
- Confirm `CORS_ALLOWED_ORIGINS` contains the exact origin, including scheme and optional `www` host.
- Use HTTPS for both frontend and API.
- Confirm browser cookies are not being blocked because of an incorrect session domain.

### Database connection failure

- Recheck the exact Hostinger database name and username.
- Confirm the database user has access.
- Confirm `DB_HOST` and `DB_PORT` supplied by Hostinger.
- Confirm required PDO MySQL extension is enabled.
- Keep `APP_DEBUG=false` in production and inspect server logs instead of exposing errors.

### Installer cannot write the lock file

- Confirm `backend/storage/` exists and is writable by PHP.
- Correct the directory permissions through Hostinger File Manager.
- Do not disable security controls or make the entire site writable.

### Voucher or receipt does not print correctly

- Use the application preview/browser print preview.
- Select an 80mm paper profile where available.
- Verify print margins and scaling.
- Perform physical XPrinter XP-80U validation separately; software deployment alone is not hardware validation.

---

## 13. Production Security Rules

- Never commit `.env` files.
- Never use example passwords in production.
- Never leave `install.php` on a live server after setup.
- Keep `APP_DEBUG=false`.
- Use HTTPS everywhere.
- Do not expose backend source, configuration, logs, sessions, or backups.
- Use an administrator account only for administrative work; create staff accounts for daily operations.
- Back up the database regularly and test restoration.
- Review activity logs for unusual access or changes.
- Keep PHP, MySQL, Hostinger, and frontend dependencies supported and patched.
- Do not use localStorage or mock records as a substitute for the MySQL business data.

---

## 14. Deployment Status

Deployment is complete only after the actual Hostinger environment passes the production verification checklist above.

Repository configuration and documentation do not prove that a live Hostinger deployment works. The following require testing on the target environment:

- Actual DNS and SSL configuration
- Actual PHP version and extensions
- Actual MySQL credentials and permissions
- Actual Apache rewrite behavior
- Actual session cookies and CORS behavior
- Actual React Router deep links
- Actual backup restoration
- Physical XPrinter XP-80U output
