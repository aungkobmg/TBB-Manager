<?php
/**
 * TBB OS — Role-Based Access Control Helper
 */

class RBAC
{
    // Admin-only endpoints
    private const ADMIN_ONLY_ROUTES = [
        'GET /settings',
        'PUT /settings',
        'GET /settings/backup',
        'POST /users',
        'PUT /users/{id}',
        'DELETE /users/{id}',
        'GET /activity-logs',
        'POST /bales/{id}/close',
        'PUT /bales/{id}/archive',
        'PUT /orders/{id}/void',
        'PUT /products/{id}/archive',
        'PUT /customers/{id}/archive',
    ];

    // Staff-allowed endpoints (subset)
    private const STAFF_ALLOWED_PATTERNS = [
        'GET /products',
        'GET /products/{id}',
        'POST /products',
        'PUT /products/{id}',
        'GET /customers',
        'GET /customers/{id}',
        'POST /customers',
        'PUT /customers/{id}',
        'GET /orders',
        'GET /orders/{id}',
        'POST /orders',
        'PUT /orders/{id}',
        'PUT /orders/{id}/status',
        'PUT /orders/{id}/cancel',
        'GET /vouchers/{id}',
        'GET /bales',
        'GET /bales/{id}',
        'POST /bales',
        'PUT /bales/{id}',
        'POST /bales/{id}/products/bulk',
        'GET /dashboard/summary',
        'GET /finance/summary',
        'GET /expenses',
        'POST /expenses',
        'PUT /expenses/{id}',
        'GET /reports/*',
    ];

    /**
     * Check if current user has permission for the route
     */
    public static function authorize(string $method, string $route, ?array $user): bool
    {
        if (!$user) {
            return false;
        }

        $role = $user['role'] ?? 'staff';
        $fullRoute = strtoupper($method) . ' ' . $route;

        // Admin can access everything
        if ($role === 'admin') {
            return true;
        }

        // Check if route is admin-only
        foreach (self::ADMIN_ONLY_ROUTES as $adminRoute) {
            if (self::routeMatches($fullRoute, $adminRoute)) {
                return false; // Staff cannot access admin-only routes
            }
        }

        // Check if route is in staff-allowed list
        foreach (self::STAFF_ALLOWED_PATTERNS as $pattern) {
            if (self::routeMatches($fullRoute, $pattern)) {
                return true;
            }
        }

        // Default: deny access for staff
        return false;
    }

    /**
     * Check if route matches pattern (supports wildcards)
     */
    private static function routeMatches(string $route, string $pattern): bool
    {
        // Exact match
        if ($route === $pattern) {
            return true;
        }

        // Wildcard match
        if (str_contains($pattern, '*')) {
            $regex = str_replace('*', '.*', $pattern);
            return preg_match('#^' . $regex . '$#', $route) === 1;
        }

        // Parameter match (e.g., /products/{id})
        $regex = preg_replace('#\{[^}]+\}#', '[^/]+', $pattern);
        return preg_match('#^' . $regex . '$#', $route) === 1;
    }

    /**
     * Enforce authorization and return 403 if denied
     */
    public static function enforce(string $method, string $route, ?array $user): void
    {
        if (!self::authorize($method, $route, $user)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Access denied. You do not have permission to perform this action.'
            ]);
            exit;
        }
    }
}
