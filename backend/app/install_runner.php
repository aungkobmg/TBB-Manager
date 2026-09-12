<?php
/**
 * TBB OS — Production Installer
 *
 * Shared installer runtime used by both installer entrypoints.
 */

require_once dirname(__DIR__) . '/config/env.php';
loadEnv(dirname(__DIR__) . '/.env');
loadEnv(dirname(dirname(__DIR__)) . '/.env');

class InstallationValidationException extends Exception
{
}

// Installation lock file
$installedFile = dirname(__DIR__) . '/storage/.installed';

// Prevent reinstallation
if (file_exists($installedFile)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Installation already completed. This file should be deleted.'
    ]);
    exit;
}

// Handle requests
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    handleInstallation();
} else {
    showInstallerUI();
}

/**
 * Display installer UI
 */
function showInstallerUI()
{
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TBB OS Installation</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
            .card { background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; width: 100%; padding: 40px; }
            h1 { color: #333; margin-bottom: 10px; font-size: 28px; }
            .subtitle { color: #666; font-size: 14px; margin-bottom: 30px; }
            .alert { padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; line-height: 1.5; }
            .alert-warning { background: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
            .form-group { margin-bottom: 20px; }
            label { display: block; color: #333; font-weight: 500; margin-bottom: 8px; font-size: 14px; }
            input { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; font-family: inherit; }
            input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
            .help-text { font-size: 12px; color: #666; margin-top: 4px; }
            .password-strength { font-size: 12px; margin-top: 4px; padding: 4px 8px; border-radius: 4px; }
            .strength-weak { background: #f8d7da; color: #721c24; }
            .strength-medium { background: #fff3cd; color: #856404; }
            .strength-strong { background: #d4edda; color: #155724; }
            button { width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 500; cursor: pointer; margin-top: 20px; transition: background 0.3s; }
            button:hover { background: #5568d3; }
            button:disabled { background: #ccc; cursor: not-allowed; }
            .divider { margin: 30px 0; border-top: 1px solid #eee; }
            .form-section-title { font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 25px; margin-bottom: 15px; }
            .error { color: #d9534f; font-size: 12px; margin-top: 4px; }
            .hidden { display: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <h1>🎁 TBB OS Installation</h1>
                <p class="subtitle">Initialize your production database</p>

                <div class="alert alert-warning">
                    <strong>⚠️ Important:</strong> Delete <code>install.php</code> immediately after installation for security.
                </div>

                <form id="installForm" method="POST">
                    <div class="form-section-title">Admin Account</div>

                    <div class="form-group">
                        <label for="username">Admin Username</label>
                        <input type="text" id="username" name="username" required placeholder="e.g., admin" minlength="3" maxlength="50">
                        <p class="help-text">3-50 characters, alphanumeric and underscore only</p>
                    </div>

                    <div class="form-group">
                        <label for="password">Admin Password</label>
                        <input type="password" id="password" name="password" required placeholder="Minimum 8 characters" minlength="8">
                        <p class="help-text">Must be at least 8 characters. Use a strong password.</p>
                        <div id="strengthIndicator" class="password-strength hidden"></div>
                    </div>

                    <div class="form-group">
                        <label for="password_confirm">Confirm Password</label>
                        <input type="password" id="password_confirm" name="password_confirm" required placeholder="Re-enter password">
                        <div id="matchError" class="error hidden">Passwords do not match</div>
                    </div>

                    <div class="form-section-title">Business Information</div>

                    <div class="form-group">
                        <label for="business_name">Business Name</label>
                        <input type="text" id="business_name" name="business_name" value="The Bra Boutique (Yangon)" required>
                    </div>

                    <div class="form-group">
                        <label for="phone">Business Phone</label>
                        <input type="tel" id="phone" name="phone" placeholder="09-XXXXXXXXX">
                    </div>

                    <div class="form-group">
                        <label for="address">Business Address</label>
                        <input type="text" id="address" name="address" placeholder="Yangon, Myanmar">
                    </div>

                    <button type="submit" id="submitBtn">Begin Installation</button>
                </form>
            </div>
        </div>

        <script>
            const form = document.getElementById('installForm');
            const passwordField = document.getElementById('password');
            const passwordConfirmField = document.getElementById('password_confirm');
            const strengthIndicator = document.getElementById('strengthIndicator');
            const matchError = document.getElementById('matchError');
            const submitBtn = document.getElementById('submitBtn');

            passwordField.addEventListener('input', () => {
                const pwd = passwordField.value;
                let strength = '';
                let label = '';
                
                if (pwd.length >= 8 && /[a-z]/.test(pwd) && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
                    strength = 'strong';
                    label = '✓ Strong password';
                } else if (pwd.length >= 12) {
                    strength = 'medium';
                    label = '◐ Medium strength (add uppercase, numbers, symbols for better security)';
                } else if (pwd.length >= 8) {
                    strength = 'weak';
                    label = '◑ Weak (add uppercase letters and numbers)';
                } else {
                    strength = '';
                }

                if (strength) {
                    strengthIndicator.className = 'password-strength strength-' + strength;
                    strengthIndicator.textContent = label;
                    strengthIndicator.classList.remove('hidden');
                } else {
                    strengthIndicator.classList.add('hidden');
                }

                validatePasswordMatch();
            });

            passwordConfirmField.addEventListener('input', validatePasswordMatch);

            function validatePasswordMatch() {
                if (passwordField.value && passwordConfirmField.value && passwordField.value !== passwordConfirmField.value) {
                    matchError.classList.remove('hidden');
                    submitBtn.disabled = true;
                } else {
                    matchError.classList.add('hidden');
                    submitBtn.disabled = false;
                }
            }

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                submitBtn.disabled = true;
                submitBtn.textContent = 'Installing...';

                try {
                    const formData = new FormData(form);
                    const response = await fetch(window.location.href, {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (result.success) {
                        document.body.innerHTML = `
                            <div class="container">
                                <div class="card" style="text-align: center;">
                                    <h1 style="color: #28a745; margin-bottom: 10px;">✓ Installation Successful</h1>
                                    <p style="color: #666; margin-bottom: 20px;">TBB OS is ready to use</p>
                                    <div class="alert" style="background: #d4edda; color: #155724; border: 1px solid #c3e6cb;">
                                        <strong>Admin Username:</strong> ${result.admin_username}<br>
                                        <strong>Next Step:</strong> ${result.next_step}
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        alert('Installation failed: ' + (result.error || 'Unknown error'));
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Begin Installation';
                    }
                } catch (error) {
                    alert('Installation error: ' + error.message);
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Begin Installation';
                }
            });
        </script>
    </body>
    </html>
    <?php
}

/**
 * Handle installation request
 */
function handleInstallation()
{
    header('Content-Type: application/json');

    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $password_confirm = trim($_POST['password_confirm'] ?? '');
    $business_name = trim($_POST['business_name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $address = trim($_POST['address'] ?? '');

    $errors = [];

    if (empty($username)) {
        $errors[] = 'Username is required';
    } elseif (strlen($username) < 3) {
        $errors[] = 'Username must be at least 3 characters';
    } elseif (strlen($username) > 50) {
        $errors[] = 'Username must not exceed 50 characters';
    } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        $errors[] = 'Username can only contain letters, numbers, and underscores';
    }

    if (empty($password)) {
        $errors[] = 'Password is required';
    } elseif (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters';
    } elseif (!preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/[0-9]/', $password)) {
        $errors[] = 'Password must include uppercase, lowercase, and numbers';
    } elseif ($password !== $password_confirm) {
        $errors[] = 'Passwords do not match';
    }

    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }

    try {
        require_once dirname(__DIR__) . '/config/database.php';
        $db = Database::getConnection();

        $stmt = $db->query('SELECT 1');
        if (!$stmt) {
            throw new Exception('Database connection failed');
        }

        $db->beginTransaction();

        try {
            $password_hash = password_hash($password, PASSWORD_DEFAULT, ['cost' => 12]);

            $stmt = $db->prepare('SELECT COUNT(*) FROM users');
            $stmt->execute();
            $userCount = (int) $stmt->fetchColumn();

            if ($userCount > 0) {
                throw new InstallationValidationException('Installation requires an empty users table. Existing users were detected.');
            }

            $stmt = $db->prepare('
                INSERT INTO users (username, password_hash, role, is_active)
                VALUES (?, ?, ?, ?)
            ');
            $stmt->execute([$username, $password_hash, 'admin', 1]);

            $settings = [
                'business_name' => $business_name ?: 'The Bra Boutique (Yangon)',
                'phone' => $phone ?: '09-xxxxxxxxx',
                'address' => $address ?: 'Yangon, Myanmar',
            ];

            foreach ($settings as $key => $value) {
                $stmt = $db->prepare('
                    INSERT INTO settings (setting_key, setting_value)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE setting_value = ?
                ');
                $stmt->execute([$key, $value, $value]);
            }

            $stmt = $db->prepare('
                INSERT INTO sequences (name, current_value)
                VALUES (?, 0)
                ON DUPLICATE KEY UPDATE current_value = current_value
            ');
            $stmt->execute(['product_code']);

            $db->commit();

            $storageDir = dirname(__DIR__) . '/storage';
            if (!is_dir($storageDir)) {
                mkdir($storageDir, 0755, true);
            }

            $lockContent = date('Y-m-d H:i:s') . "\nInstaller locked. Delete this file only if you need to reinstall.";
            if (!file_put_contents($GLOBALS['installedFile'], $lockContent)) {
                throw new Exception('Could not create installation lock file. Check storage directory permissions.');
            }
            chmod($GLOBALS['installedFile'], 0600);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Installation completed successfully!',
                'admin_username' => $username,
                'next_step' => 'Delete install.php from the server and login with your admin credentials at the application login page.',
            ]);
            exit;

        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }

    } catch (InstallationValidationException $e) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
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
?>
