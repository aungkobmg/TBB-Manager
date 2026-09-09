<?php
/**
 * TBB OS — CSRF Protection Helper
 */

class CSRF
{
    private const TOKEN_LENGTH = 32;
    
    /**
     * Generate a new CSRF token
     */
    public static function generateToken(): string
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(self::TOKEN_LENGTH));
        }
        
        return $_SESSION['csrf_token'];
    }
    
    /**
     * Get current CSRF token (generates if not exists)
     */
    public static function getToken(): string
    {
        return self::generateToken();
    }
    
    /**
     * Validate CSRF token from request
     */
    public static function validate(?string $token): bool
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['csrf_token']) || empty($token)) {
            return false;
        }
        
        // Use hash_equals for timing-safe comparison
        return hash_equals($_SESSION['csrf_token'], $token);
    }
    
    /**
     * Check if request requires CSRF validation
     */
    public static function requiresValidation(string $method): bool
    {
        return in_array(strtoupper($method), ['POST', 'PUT', 'PATCH', 'DELETE']);
    }
    
    /**
     * Validate request and return error response if invalid
     */
    public static function validateRequest(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        
        if (!self::requiresValidation($method)) {
            return;
        }
        
        // Get token from header or body
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        
        if (!$token) {
            // Try to get from JSON body
            $input = json_decode(file_get_contents('php://input'), true);
            $token = $input['_csrf'] ?? null;
        }
        
        if (!self::validate($token)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid or missing CSRF token. Please refresh the page and try again.'
            ]);
            exit;
        }
    }
}
