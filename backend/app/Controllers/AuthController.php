<?php
/**
 * TBB OS — Auth Controller
 */

require_once __DIR__ . '/../Helpers/Response.php';
require_once __DIR__ . '/../Helpers/Auth.php';
require_once __DIR__ . '/../../config/database.php';

class AuthController
{
    /**
     * POST /login
     */
    public function login(array $params, array $input, ?array $user): void
    {
        $username = trim($input['username'] ?? '');
        $password = $input['password'] ?? '';

        if ($username === '' || $password === '') {
            Response::error('Username and password are required', 400);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, username, password_hash, role, is_active FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $found = $stmt->fetch();

        if (!$found || !password_verify($password, $found['password_hash'])) {
            Response::error('Invalid credentials', 401);
            return;
        }

        if (!$found['is_active']) {
            Response::error('Account is disabled', 403);
            return;
        }

        // Login
        Auth::login((int) $found['id'], $found['username'], $found['role']);

        // Update last login
        $db->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')
           ->execute([$found['id']]);

        // Log activity
        $this->logActivity((int) $found['id'], 'Login', 'auth', null, 'User logged in');

        Response::success([
            'user' => [
                'id'       => (int) $found['id'],
                'username' => $found['username'],
                'role'     => $found['role'],
            ],
        ], 'Login successful');
    }

    /**
     * POST /logout
     */
    public function logout(array $params, array $input, ?array $user): void
    {
        if ($user) {
            $this->logActivity($user['id'], 'Logout', 'auth', null, 'User logged out');
        }

        Auth::logout();
        Response::success(null, 'Logged out');
    }

    /**
     * GET /auth/me
     */
    public function me(array $params, array $input, ?array $user): void
    {
        if (!$user) {
            Response::error('Unauthenticated', 401);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, username, role, last_login_at, created_at FROM users WHERE id = ?');
        $stmt->execute([$user['id']]);
        $userData = $stmt->fetch();

        Response::success($userData);
    }

    /**
     * PUT /auth/password
     */
    public function changePassword(array $params, array $input, ?array $user): void
    {
        if (!$user) {
            Response::error('Unauthenticated', 401);
            return;
        }

        $currentPassword = $input['currentPassword'] ?? '';
        $newPassword = $input['newPassword'] ?? '';

        if ($currentPassword === '' || $newPassword === '') {
            Response::error('Current and new passwords are required', 400);
            return;
        }

        if (strlen($newPassword) < 6) {
            Response::error('New password must be at least 6 characters', 400);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
        $stmt->execute([$user['id']]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
            Response::error('Current password is incorrect', 400);
            return;
        }

        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
           ->execute([$hash, $user['id']]);

        $this->logActivity($user['id'], 'Password Changed', 'user', $user['id'], 'Password updated');

        Response::success(null, 'Password changed successfully');
    }

    /**
     * Log activity helper
     */
    private function logActivity(int $userId, string $action, string $entityType, ?int $entityId, string $description): void
    {
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare(
                'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $userId,
                $action,
                $entityType,
                $entityId,
                $description,
                Auth::ipAddress(),
                substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
            ]);
        } catch (Exception $e) {
            // Don't fail the main operation if logging fails
        }
    }
}
