<?php
/**
 * TBB OS — Main API Router
 * Entry point for all REST API requests
 */

declare(strict_types=1);

// Error reporting based on environment
require_once __DIR__ . '/../config/env.php';
loadEnv(dirname(__DIR__) . '/.env');

$isProduction = env('APP_ENV', 'production') === 'production';

if ($isProduction) {
    error_reporting(0);
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    ini_set('error_log', dirname(__DIR__) . '/storage/logs/error.log');
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
}

// Global exception handler for production
set_exception_handler(function($exception) use ($isProduction) {
    if ($isProduction) {
        http_response_code(500);
        echo json_encode(['error' => 'An internal error occurred. Please try again later.']);
        error_log('Unhandled exception: ' . $exception->getMessage());
    } else {
        http_response_code(500);
        echo json_encode([
            'error' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
        ]);
    }
    exit;
});

// Global error handler for production
set_error_handler(function($severity, $message, $file, $line) use ($isProduction) {
    if ($isProduction) {
        error_log("PHP Error: $message in $file:$line");
        return true; // Suppress default error handler
    }
    return false; // Use default error handler in development
});

// Set timezone
$timezone = env('TIMEZONE', 'Asia/Yangon');
date_default_timezone_set($timezone);

// CORS & JSON headers
header('Content-Type: application/json; charset=utf-8');

// Configure CORS - only allow trusted origins in production
$appUrl = env('APP_URL', '');
$allowedOrigins = [$appUrl];

// Add additional allowed origins from environment if specified
$additionalOrigins = env('CORS_ALLOWED_ORIGINS', '');
if ($additionalOrigins) {
    $allowedOrigins = array_merge($allowedOrigins, explode(',', $additionalOrigins));
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} elseif (!$isProduction && $origin) {
    // In development, allow any origin for convenience
    header('Access-Control-Allow-Origin: ' . $origin);
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN');
header('Access-Control-Allow-Credentials: true');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Autoloader
spl_autoload_register(function (string $class) {
    $paths = [
        __DIR__ . '/../app/Controllers/',
        __DIR__ . '/../app/Models/',
        __DIR__ . '/../app/Services/',
        __DIR__ . '/../app/Middleware/',
        __DIR__ . '/../app/Helpers/',
    ];
    foreach ($paths as $path) {
        $file = $path . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// Load core
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../app/Helpers/Response.php';
require_once __DIR__ . '/../app/Helpers/Auth.php';
require_once __DIR__ . '/../app/Helpers/CSRF.php';

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove /api prefix and trailing slash
$uri = preg_replace('#^/api#', '', $uri);
$uri = rtrim($uri, '/');
$uri = $uri ?: '/';

// Parse JSON body
$input = [];
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    $rawBody = file_get_contents('php://input');
    $input = json_decode($rawBody, true) ?? [];
}

// Route mapping
$routes = [
    // Auth
    'POST /login'              => ['AuthController', 'login', false],
    'POST /logout'             => ['AuthController', 'logout', true],
    'GET /auth/me'             => ['AuthController', 'me', true],
    'GET /auth/csrf-token'     => ['AuthController', 'getCsrfToken', true],
    'PUT /auth/password'       => ['AuthController', 'changePassword', true],

    // Dashboard
    'GET /dashboard/summary'   => ['DashboardController', 'summary', true],

    // Bales
    'GET /bales'               => ['BalesController', 'index', true],
    'GET /bales/{id}'          => ['BalesController', 'show', true],
    'POST /bales'              => ['BalesController', 'store', true],
    'PUT /bales/{id}'          => ['BalesController', 'update', true],

    // Products
    'GET /products'            => ['ProductsController', 'index', true],
    'GET /products/{id}'       => ['ProductsController', 'show', true],
    'GET /products/search/{code}' => ['ProductsController', 'searchByCode', true],
    'POST /products'           => ['ProductsController', 'store', true],
    'PUT /products/{id}'       => ['ProductsController', 'update', true],

    // Customers
    'GET /customers'           => ['CustomersController', 'index', true],
    'GET /customers/{id}'      => ['CustomersController', 'show', true],
    'GET /customers/search'    => ['CustomersController', 'search', true],
    'POST /customers'          => ['CustomersController', 'store', true],
    'PUT /customers/{id}'      => ['CustomersController', 'update', true],

    // Orders
    'GET /orders'              => ['OrdersController', 'index', true],
    'GET /orders/{id}'         => ['OrdersController', 'show', true],
    'POST /orders'             => ['OrdersController', 'store', true],
    'PUT /orders/{id}'         => ['OrdersController', 'update', true],
    'PUT /orders/{id}/status'  => ['OrdersController', 'updateStatus', true],
    'PUT /orders/{id}/cancel'  => ['OrdersController', 'cancel', true],

    // Vouchers
    'GET /vouchers/{id}'       => ['VouchersController', 'show', true],

    // Finance
    'GET /finance/summary'     => ['FinanceController', 'summary', true],
    'GET /expenses'            => ['FinanceController', 'expenses', true],
    'POST /expenses'           => ['FinanceController', 'storeExpense', true],
    'PUT /expenses/{id}'       => ['FinanceController', 'updateExpense', true],

    // Reports
    'GET /reports/daily-sales'     => ['ReportsController', 'dailySales', true],
    'GET /reports/monthly-sales'   => ['ReportsController', 'monthlySales', true],
    'GET /reports/inventory'       => ['ReportsController', 'inventory', true],
    'GET /reports/bale-performance' => ['ReportsController', 'balePerformance', true],
    'GET /reports/profit-loss'     => ['ReportsController', 'profitLoss', true],
    'GET /reports/customer-history' => ['ReportsController', 'customerHistory', true],
    'GET /reports/voucher-history' => ['ReportsController', 'voucherHistory', true],

    // Settings
    'GET /settings'            => ['SettingsController', 'index', true],
    'PUT /settings'            => ['SettingsController', 'update', true],
    'GET /settings/backup'     => ['SettingsController', 'backup', true],

    // Activity Logs
    'GET /activity-logs'       => ['ActivityController', 'index', true],
];

// Match route
$matched = false;
foreach ($routes as $pattern => $handler) {
    [$routeMethod, $routePath] = explode(' ', $pattern, 2);

    if ($routeMethod !== $method) {
        continue;
    }

    // Convert {param} to regex
    $regex = preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $routePath);
    $regex = '#^' . $regex . '$#';

    if (preg_match($regex, $uri, $matches)) {
        [$controllerName, $action, $requiresAuth] = $handler;

        // Auth check
        if ($requiresAuth) {
            $user = Auth::authenticate();
            if (!$user) {
                Response::json(['error' => 'Unauthenticated'], 401);
                exit;
            }
            
            // CSRF validation for state-changing requests
            if (CSRF::requiresValidation($method)) {
                CSRF::validateRequest();
            }
        } else {
            $user = null;
        }

        // Extract route params
        $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

        // Instantiate controller and call action
        $controller = new $controllerName();
        $controller->$action($params, $input, $user);
        $matched = true;
        break;
    }
}

if (!$matched) {
    Response::json(['error' => 'Endpoint not found'], 404);
}
