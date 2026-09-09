<?php
/**
 * TBB OS — Installer
 * Run this once to set up the database and admin account
 * DELETE THIS FILE after successful installation in production
 */

declare(strict_types=1);

require_once __DIR__ . '/config/env.php';
loadEnv(__DIR__ . '/.env');

header('Content-Type: text/html; charset=utf-8');

$steps = [];
$errors = [];

// Step 1: Check PHP version
if (version_compare(PHP_VERSION, '8.1.0', '<')) {
    $errors[] = 'PHP 8.1+ is required. Current: ' . PHP_VERSION;
} else {
    $steps[] = '✓ PHP ' . PHP_VERSION;
}

// Step 2: Check extensions
$requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        $steps[] = "✓ Extension: {$ext}";
    } else {
        $errors[] = "Missing extension: {$ext}";
    }
}

// Step 3: Check .env exists
if (!file_exists(__DIR__ . '/.env')) {
    $errors[] = '.env file not found. Copy .env.example to .env and configure it.';
} else {
    $steps[] = '✓ .env file found';
}

// Step 4: Connect to database
try {
    $host = env('DB_HOST', '127.0.0.1');
    $port = env('DB_PORT', '3306');
    $dbname = env('DB_NAME', 'tbb_os');
    $username = env('DB_USER', 'root');
    $password = env('DB_PASS', '');

    $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $steps[] = '✓ Database connection successful';
} catch (PDOException $e) {
    $errors[] = 'Database connection failed: ' . $e->getMessage();
}

// Step 5: Create database if not exists
if (empty($errors)) {
    try {
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `{$dbname}`");
        $steps[] = "✓ Database '{$dbname}' ready";
    } catch (PDOException $e) {
        $errors[] = 'Failed to create database: ' . $e->getMessage();
    }
}

// Step 6: Import schema
if (empty($errors)) {
    try {
        $schemaFile = dirname(__DIR__) . '/database/schema.sql';
        if (file_exists($schemaFile)) {
            $sql = file_get_contents($schemaFile);
            $pdo->exec($sql);
            $steps[] = '✓ Database schema imported';
        } else {
            $errors[] = 'Schema file not found: ' . $schemaFile;
        }
    } catch (PDOException $e) {
        // Ignore duplicate errors (tables already exist)
        if (str_contains($e->getMessage(), 'already exists')) {
            $steps[] = '✓ Database schema already exists (skipped)';
        } else {
            $errors[] = 'Schema import error: ' . $e->getMessage();
        }
    }
}

// Step 7: Create admin account
if (empty($errors)) {
    try {
        $adminUsername = env('ADMIN_USERNAME', 'admin');
        $adminPassword = env('ADMIN_PASSWORD', 'admin123');
        $hash = password_hash($adminPassword, PASSWORD_DEFAULT);

        // Check if admin already exists
        $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$adminUsername]);

        if ($stmt->fetch()) {
            // Update password
            $pdo->prepare('UPDATE users SET password_hash = ? WHERE username = ?')
                ->execute([$hash, $adminUsername]);
            $steps[] = "✓ Admin account '{$adminUsername}' password updated";
        } else {
            $pdo->prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
                ->execute([$adminUsername, $hash, 'admin']);
            $steps[] = "✓ Admin account '{$adminUsername}' created";
        }
    } catch (PDOException $e) {
        $errors[] = 'Failed to create admin: ' . $e->getMessage();
    }
}

// Step 8: Set permissions
$writableDirs = [__DIR__ . '/storage'];
foreach ($writableDirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    if (is_writable($dir)) {
        $steps[] = '✓ Directory writable: ' . basename($dir);
    } else {
        $steps[] = '⚠ Directory not writable (may need chmod): ' . $dir;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TBB OS — Installation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f9ff; color: #0a1930; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { font-size: 24px; margin-bottom: 8px; color: #0057b8; }
        .subtitle { color: #667085; margin-bottom: 24px; }
        .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .step { padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
        .step:last-child { border-bottom: none; }
        .error { color: #cf1322; background: #fff1f0; padding: 12px; border-radius: 8px; margin-bottom: 8px; font-size: 14px; }
        .success { color: #389e0d; background: #f6ffed; padding: 16px; border-radius: 8px; font-size: 14px; }
        .warning { color: #d48806; background: #fffbe6; padding: 12px; border-radius: 8px; margin-top: 16px; font-size: 13px; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏪 TBB OS — Installation</h1>
        <p class="subtitle">The Bra Boutique (Yangon) — System Setup</p>

        <?php if (!empty($errors)): ?>
            <div class="card">
                <h3 style="color: #cf1322; margin-bottom: 12px;">❌ Installation Errors</h3>
                <?php foreach ($errors as $error): ?>
                    <div class="error"><?= htmlspecialchars($error) ?></div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <?php if (!empty($steps)): ?>
            <div class="card">
                <h3 style="margin-bottom: 12px;">Installation Steps</h3>
                <?php foreach ($steps as $step): ?>
                    <div class="step"><?= htmlspecialchars($step) ?></div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <?php if (empty($errors)): ?>
            <div class="success">
                <strong>✅ Installation Complete!</strong><br><br>
                Your TBB OS is ready to use.<br>
                Admin username: <code><?= htmlspecialchars(env('ADMIN_USERNAME', 'admin')) ?></code><br>
                <br>
                <strong>⚠️ IMPORTANT:</strong> Delete this installer file (<code>install.php</code>) from your server for security.
            </div>
            <div class="warning">
                <strong>Next Steps:</strong><br>
                1. Delete <code>install.php</code> from your server<br>
                2. Deploy the React frontend build to your web root<br>
                3. Configure the API URL in your frontend<br>
                4. Test login and create your first bale
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
