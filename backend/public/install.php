<?php
/**
 * TBB OS — Secure First-Run Installation
 * 
 * SECURITY: This installer can only run ONCE.
 * After successful installation, it becomes permanently disabled.
 */

declare(strict_types=1);

// Load environment
require_once __DIR__ . '/../config/env.php';
loadEnv(dirname(__DIR__) . '/.env');

// Check if already installed
$lockFile = __DIR__ . '/../storage/.installed';
if (file_exists($lockFile)) {
    http_response_code(403);
    echo '<!DOCTYPE html><html><head><title>Access Denied</title></head><body>';
    echo '<h1>Installation Already Complete</h1>';
    echo '<p>This installer has been disabled for security reasons.</p>';
    echo '<p>If you need to reinstall, please contact your system administrator.</p>';
    echo '</body></html>';
    exit;
}

// Handle POST request (installation)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    $errors = [];
    
    if (empty($input['admin_username']) || strlen($input['admin_username']) < 3) {
        $errors[] = 'Admin username must be at least 3 characters';
    }
    
    if (empty($input['admin_password']) || strlen($input['admin_password']) < 8) {
        $errors[] = 'Admin password must be at least 8 characters';
    }
    
    // Check password strength
    if (!preg_match('/[A-Z]/', $input['admin_password']) || 
        !preg_match('/[a-z]/', $input['admin_password']) || 
        !preg_match('/[0-9]/', $input['admin_password'])) {
        $errors[] = 'Password must contain uppercase, lowercase, and numbers';
    }
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }
    
    // Test database connection
    try {
        require_once __DIR__ . '/../config/database.php';
        $db = Database::getConnection();
        
        // Check if users table exists
        $stmt = $db->query("SHOW TABLES LIKE 'users'");
        if ($stmt->rowCount() === 0) {
            throw new Exception('Database schema not found. Please import schema.sql first.');
        }
        
        // Check if admin already exists
        $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$input['admin_username']]);
        if ($stmt->fetch()) {
            throw new Exception('Admin username already exists');
        }
        
        // Create admin user with secure password hash
        $passwordHash = password_hash($input['admin_password'], PASSWORD_DEFAULT);
        $stmt = $db->prepare('INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, ?, ?)');
        $stmt->execute([$input['admin_username'], $passwordHash, 'admin', 1]);
        
        // Create lock file to prevent reinstallation
        $storageDir = __DIR__ . '/../storage';
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0755, true);
        }
        file_put_contents($lockFile, date('Y-m-d H:i:s') . ' - Installed by: ' . $input['admin_username']);
        chmod($lockFile, 0600);
        
        // Log installation
        $stmt = $db->prepare('INSERT INTO activity_logs (user_id, action, entity_type, description, ip_address) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([null, 'System Installed', 'system', 'Initial admin account created', $_SERVER['REMOTE_ADDR'] ?? 'unknown']);
        
        echo json_encode([
            'success' => true,
            'message' => 'Installation completed successfully. You can now login with your admin credentials.',
            'redirect' => '/login'
        ]);
        exit;
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Installation failed: ' . $e->getMessage()
        ]);
        exit;
    }
}

// Show installation form
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TBB OS - Installation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0057B8 0%, #0A1930 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            max-width: 500px;
            width: 100%;
            padding: 40px;
        }
        h1 { color: #0A1930; margin-bottom: 8px; font-size: 24px; }
        .subtitle { color: #667085; margin-bottom: 32px; font-size: 14px; }
        .form-group { margin-bottom: 20px; }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #0A1930;
            font-size: 14px;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.2s;
        }
        input:focus {
            outline: none;
            border-color: #0057B8;
        }
        .requirements {
            background: #F5F9FF;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 13px;
            color: #667085;
        }
        .requirements strong { color: #0A1930; }
        button {
            width: 100%;
            padding: 14px;
            background: #0057B8;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        button:hover { background: #003d82; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .error {
            background: #FEF2F2;
            border: 1px solid #FECACA;
            color: #991B1B;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
        }
        .success {
            background: #F0FDF4;
            border: 1px solid #BBF7D0;
            color: #166534;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
        }
        .warning {
            background: #FFFBEB;
            border: 1px solid #FDE68A;
            color: #92400E;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 TBB OS Installation</h1>
        <p class="subtitle">Create your administrator account to get started</p>
        
        <div class="warning">
            <strong>⚠️ Security Notice:</strong> This installer can only be run once. After installation, it will be permanently disabled for security reasons.
        </div>
        
        <div class="requirements">
            <strong>Password Requirements:</strong><br>
            • Minimum 8 characters<br>
            • At least one uppercase letter<br>
            • At least one lowercase letter<br>
            • At least one number
        </div>
        
        <div id="message"></div>
        
        <form id="installForm">
            <div class="form-group">
                <label for="admin_username">Administrator Username</label>
                <input type="text" id="admin_username" name="admin_username" required minlength="3" placeholder="e.g., admin">
            </div>
            
            <div class="form-group">
                <label for="admin_password">Administrator Password</label>
                <input type="password" id="admin_password" name="admin_password" required minlength="8" placeholder="Enter strong password">
            </div>
            
            <div class="form-group">
                <label for="confirm_password">Confirm Password</label>
                <input type="password" id="confirm_password" name="confirm_password" required minlength="8" placeholder="Confirm password">
            </div>
            
            <button type="submit" id="submitBtn">Complete Installation</button>
        </form>
    </div>

    <script>
        document.getElementById('installForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('admin_username').value.trim();
            const password = document.getElementById('admin_password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            const messageDiv = document.getElementById('message');
            const submitBtn = document.getElementById('submitBtn');
            
            // Client-side validation
            if (password !== confirmPassword) {
                messageDiv.innerHTML = '<div class="error">Passwords do not match</div>';
                return;
            }
            
            // Password strength check
            if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
                messageDiv.innerHTML = '<div class="error">Password must contain uppercase, lowercase, and numbers</div>';
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Installing...';
            messageDiv.innerHTML = '';
            
            try {
                const response = await fetch(window.location.href, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        admin_username: username,
                        admin_password: password
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    messageDiv.innerHTML = '<div class="success">' + data.message + '</div>';
                    submitBtn.textContent = 'Installation Complete!';
                    setTimeout(() => {
                        window.location.href = data.redirect || '/login';
                    }, 2000);
                } else {
                    messageDiv.innerHTML = '<div class="error">' + (data.error || data.errors?.join(', ') || 'Installation failed') + '</div>';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Complete Installation';
                }
            } catch (error) {
                messageDiv.innerHTML = '<div class="error">Network error. Please try again.</div>';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Complete Installation';
            }
        });
    </script>
</body>
</html>
