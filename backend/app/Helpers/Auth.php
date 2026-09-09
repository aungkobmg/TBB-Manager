<?php
/**
 * TBB OS — Authentication Helper
 * Uses PHP sessions with database-backed storage
 */

class Auth
{
    private static bool $started = false;

    /**
     * Start session if not already started
     */
    private static function startSession(): void
    {
        if (self::$started) {
            return;
        }

        if (session_status() === PHP_SESSION_NONE) {
            $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

            session_set_cookie_params([
                'lifetime' => 28800, // 8 hours
                'path'     => '/',
                'domain'   => env('SESSION_DOMAIN', ''),
                'secure'   => $isSecure,
                'httponly'  => true,
                'samesite'  => 'Lax',
            ]);

            session_name('TBB_OS_SESSION');
            session_start();
        }

        self::$started = true;
    }

    /**
     * Authenticate current request - returns user array or null
     */
    public static function authenticate(): ?array
    {
        self::startSession();

        if (!isset($_SESSION['user_id'])) {
            return null;
        }

        // Check session timeout (8 hours)
        if (isset($_SESSION['last_activity'])) {
            $timeout = 28800; // 8 hours
            if (time() - $_SESSION['last_activity'] > $timeout) {
                self::logout();
                return null;
            }
        }

        // Update last activity
        $_SESSION['last_activity'] = time();

        return [
            'id'       => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role'     => $_SESSION['role'] ?? 'admin',
        ];
    }

    /**
     * Login user
     */
    public static function login(int $userId, string $username, string $role): void
    {
        self::startSession();

        // Regenerate session ID to prevent fixation
        session_regenerate_id(true);

        $_SESSION['user_id']       = $userId;
        $_SESSION['username']      = $username;
        $_SESSION['role']          = $role;
        $_SESSION['last_activity'] = time();
        $_SESSION['login_time']    = time();
    }

    /**
     * Logout user
     */
    public static function logout(): void
    {
        self::startSession();

        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        session_destroy();
        self::$started = false;
    }

    /**
     * Get current user ID
     */
    public static function userId(): ?int
    {
        self::startSession();
        return $_SESSION['user_id'] ?? null;
    }

    /**
     * Get client IP address
     */
    public static function ipAddress(): string
    {
        return $_SERVER['HTTP_X_FORWARDED_FOR']
            ?? $_SERVER['HTTP_X_REAL_IP']
            ?? $_SERVER['REMOTE_ADDR']
            ?? '0.0.0.0';
    }
}
