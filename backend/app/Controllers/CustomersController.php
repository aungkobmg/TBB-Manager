<?php
/**
 * TBB OS — Customers Controller
 */

require_once __DIR__ . '/../Helpers/Response.php';
require_once __DIR__ . '/../Helpers/Auth.php';
require_once __DIR__ . '/../../config/database.php';

class CustomersController
{
    /**
     * GET /customers
     */
    public function index(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = trim($_GET['search'] ?? '');

        $where = '';
        $bindings = [];

        if ($search !== '') {
            $where = 'WHERE c.name LIKE ? OR c.phone LIKE ? OR c.facebook_name LIKE ?';
            $bindings = ["%{$search}%", "%{$search}%", "%{$search}%"];
        }

        $countStmt = $db->prepare("SELECT COUNT(*) FROM customers c {$where}");
        $countStmt->execute($bindings);
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT c.*,
            (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id AND o.order_status != 'Cancelled') as order_count,
            (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.customer_id = c.id AND o.order_status != 'Cancelled') as total_spent
            FROM customers c {$where}
            ORDER BY c.created_at DESC LIMIT {$limit} OFFSET {$offset}";
        $stmt = $db->prepare($sql);
        $stmt->execute($bindings);
        $customers = $stmt->fetchAll();

        foreach ($customers as &$c) {
            $c['id'] = (int) $c['id'];
            $c['order_count'] = (int) $c['order_count'];
            $c['total_spent'] = (float) $c['total_spent'];
        }

        Response::paginated($customers, $total, $page, $limit);
    }

    /**
     * GET /customers/{id}
     */
    public function show(array $params, array $input, ?array $user): void
    {
        $id = (int) $params['id'];
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM customers WHERE id = ?');
        $stmt->execute([$id]);
        $customer = $stmt->fetch();

        if (!$customer) {
            Response::error('Customer not found', 404);
            return;
        }

        $customer['id'] = (int) $customer['id'];

        // Stats
        $stmt = $db->prepare("
            SELECT
                COUNT(*) as order_count,
                COALESCE(SUM(total_amount), 0) as total_spent,
                MAX(order_date) as last_order_date
            FROM orders
            WHERE customer_id = ? AND order_status != 'Cancelled'
        ");
        $stmt->execute([$id]);
        $stats = $stmt->fetch();
        $customer['stats'] = [
            'order_count' => (int) $stats['order_count'],
            'total_spent' => (float) $stats['total_spent'],
            'last_order_date' => $stats['last_order_date'],
        ];

        // Recent orders
        $stmt = $db->prepare("
            SELECT id, voucher_number, order_date, total_amount, order_status, payment_method
            FROM orders
            WHERE customer_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        ");
        $stmt->execute([$id]);
        $customer['recent_orders'] = $stmt->fetchAll();

        Response::success($customer);
    }

    /**
     * GET /customers/search
     */
    public function search(array $params, array $input, ?array $user): void
    {
        $q = trim($_GET['q'] ?? '');
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 20))); // Default 20, max 50
        
        if ($q === '') {
            Response::success([]);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT id, name, phone, facebook_name, address, township, city
            FROM customers
            WHERE name LIKE ? OR phone LIKE ? OR facebook_name LIKE ?
            ORDER BY name ASC
            LIMIT {$limit}
        ");
        $like = "%{$q}%";
        $stmt->execute([$like, $like, $like]);
        $results = $stmt->fetchAll();

        foreach ($results as &$r) {
            $r['id'] = (int) $r['id'];
        }

        Response::success($results);
    }

    /**
     * POST /customers
     */
    public function store(array $params, array $input, ?array $user): void
    {
        $name = trim($input['name'] ?? '');
        if ($name === '') {
            Response::error('Customer name is required', 400);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('
            INSERT INTO customers (name, phone, facebook_name, address, township, city, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $name,
            $input['phone'] ?? null,
            $input['facebookName'] ?? null,
            $input['address'] ?? null,
            $input['township'] ?? null,
            $input['city'] ?? null,
            $input['notes'] ?? null,
        ]);

        $id = (int) $db->lastInsertId();

        $this->logActivity($user['id'], 'Customer Created', 'customer', $id, "Created customer: {$name}");

        $stmt = $db->prepare('SELECT * FROM customers WHERE id = ?');
        $stmt->execute([$id]);
        $customer = $stmt->fetch();
        $customer['id'] = (int) $customer['id'];

        Response::success($customer, 'Customer created');
    }

    /**
     * PUT /customers/{id}
     */
    public function update(array $params, array $input, ?array $user): void
    {
        $id = (int) $params['id'];
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT id FROM customers WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::error('Customer not found', 404);
            return;
        }

        $fields = [];
        $bindings = [];

        $allowedFields = [
            'name' => 'name',
            'phone' => 'phone',
            'facebookName' => 'facebook_name',
            'address' => 'address',
            'township' => 'township',
            'city' => 'city',
            'notes' => 'notes',
        ];

        foreach ($allowedFields as $inputKey => $dbColumn) {
            if (array_key_exists($inputKey, $input)) {
                $fields[] = "{$dbColumn} = ?";
                $bindings[] = $input[$inputKey];
            }
        }

        if (empty($fields)) {
            Response::error('No fields to update', 400);
            return;
        }

        $bindings[] = $id;
        $sql = 'UPDATE customers SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $db->prepare($sql)->execute($bindings);

        $this->logActivity($user['id'], 'Customer Updated', 'customer', $id, "Updated customer #{$id}");

        $stmt = $db->prepare('SELECT * FROM customers WHERE id = ?');
        $stmt->execute([$id]);
        $customer = $stmt->fetch();
        $customer['id'] = (int) $customer['id'];

        Response::success($customer, 'Customer updated');
    }

    private function logActivity(int $userId, string $action, string $entityType, ?int $entityId, string $description): void
    {
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare(
                'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$userId, $action, $entityType, $entityId, $description, Auth::ipAddress(), substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500)]);
        } catch (Exception $e) {}
    }
}
