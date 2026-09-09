<?php
/**
 * TBB OS — Products Controller
 */

require_once __DIR__ . '/../Helpers/Response.php';
require_once __DIR__ . '/../Helpers/Auth.php';
require_once __DIR__ . '/../../config/database.php';

class ProductsController
{
    /**
     * GET /products
     */
    public function index(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = trim($_GET['search'] ?? '');
        $status = trim($_GET['status'] ?? '');
        $condition = trim($_GET['condition'] ?? '');
        $baleId = (int)($_GET['bale_id'] ?? 0);

        $where = ['p.archived_at IS NULL'];
        $bindings = [];

        if ($search !== '') {
            $where[] = '(product_code LIKE ? OR product_name LIKE ? OR brand LIKE ? OR size LIKE ? OR category LIKE ?)';
            $bindings[] = "%{$search}%";
            $bindings[] = "%{$search}%";
            $bindings[] = "%{$search}%";
            $bindings[] = "%{$search}%";
            $bindings[] = "%{$search}%";
        }

        if ($status !== '') {
            $where[] = 'p.status = ?';
            $bindings[] = $status;
        }

        if ($condition !== '') {
            $where[] = 'p.condition_grade = ?';
            $bindings[] = $condition;
        }

        if ($baleId > 0) {
            $where[] = 'p.bale_id = ?';
            $bindings[] = $baleId;
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);

        // Count
        $countStmt = $db->prepare("SELECT COUNT(*) FROM products p {$whereClause}");
        $countStmt->execute($bindings);
        $total = (int) $countStmt->fetchColumn();

        // Fetch
        $sql = "SELECT p.*, b.bale_code FROM products p LEFT JOIN bales b ON p.bale_id = b.id {$whereClause} ORDER BY p.created_at DESC LIMIT {$limit} OFFSET {$offset}";
        $stmt = $db->prepare($sql);
        $stmt->execute($bindings);
        $products = $stmt->fetchAll();

        foreach ($products as &$p) {
            $p['id'] = (int) $p['id'];
            $p['cost_price'] = (float) $p['cost_price'];
            $p['selling_price'] = (float) $p['selling_price'];
            $p['bale_id'] = $p['bale_id'] ? (int) $p['bale_id'] : null;
        }

        Response::paginated($products, $total, $page, $limit);
    }

    /**
     * GET /products/{id}
     */
    public function show(array $params, array $input, ?array $user): void
    {
        $id = (int) $params['id'];
        $db = Database::getConnection();

        $stmt = $db->prepare('
            SELECT p.*, b.bale_code, b.supplier_name
            FROM products p
            LEFT JOIN bales b ON p.bale_id = b.id
            WHERE p.id = ?
        ');
        $stmt->execute([$id]);
        $product = $stmt->fetch();

        if (!$product) {
            Response::error('Product not found', 404);
            return;
        }

        $product['id'] = (int) $product['id'];
        $product['cost_price'] = (float) $product['cost_price'];
        $product['selling_price'] = (float) $product['selling_price'];
        $product['bale_id'] = $product['bale_id'] ? (int) $product['bale_id'] : null;

        // Get sales history
        $stmt = $db->prepare('
            SELECT o.id, o.voucher_number, o.customer_name_snapshot, o.order_date, o.total_amount, o.order_status
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE oi.product_id = ? AND o.order_status != \'Cancelled\'
            ORDER BY o.created_at DESC
        ');
        $stmt->execute([$id]);
        $product['sales_history'] = $stmt->fetchAll();

        // Get movements
        $stmt = $db->prepare('
            SELECT * FROM product_movements WHERE product_id = ? ORDER BY created_at DESC
        ');
        $stmt->execute([$id]);
        $product['movements'] = $stmt->fetchAll();

        Response::success($product);
    }

    /**
     * GET /products/search/{code}
     * Fast product code lookup for Quick Order
     */
    public function searchByCode(array $params, array $input, ?array $user): void
    {
        $code = strtoupper(trim($params['code'] ?? ''));

        if ($code === '') {
            Response::error('Product code is required', 400);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM products WHERE product_code = ? LIMIT 1');
        $stmt->execute([$code]);
        $product = $stmt->fetch();

        if (!$product) {
            Response::error('Product not found', 404);
            return;
        }

        $product['id'] = (int) $product['id'];
        $product['cost_price'] = (float) $product['cost_price'];
        $product['selling_price'] = (float) $product['selling_price'];
        $product['bale_id'] = $product['bale_id'] ? (int) $product['bale_id'] : null;

        Response::success($product);
    }

    /**
     * POST /products
     */
    public function store(array $params, array $input, ?array $user): void
    {
        $productName = trim($input['productName'] ?? '');
        if ($productName === '') {
            Response::error('Product name is required', 400);
            return;
        }

        $db = Database::getConnection();

        // Check if bale is closed (cannot add products to closed bales)
        if (!empty($input['baleId'])) {
            $stmt = $db->prepare('SELECT status FROM bales WHERE id = ?');
            $stmt->execute([(int) $input['baleId']]);
            $bale = $stmt->fetch();
            
            if ($bale && $bale['status'] === 'Closed') {
                Response::error('Cannot add products to a closed bale', 400);
                return;
            }
        }

        // Generate product code atomically using sequence table
        $stmt = $db->query("UPDATE sequences SET current_value = LAST_INSERT_ID(current_value + 1) WHERE name = 'product_code'");
        $stmt = $db->query("SELECT LAST_INSERT_ID()");
        $nextNum = (int) $stmt->fetchColumn();
        $productCode = sprintf('TBB-%06d', $nextNum);

        $stmt = $db->prepare('
            INSERT INTO products (product_code, product_name, brand, category, size, color, condition_grade, cost_price, selling_price, bale_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $productCode,
            $productName,
            $input['brand'] ?? null,
            $input['category'] ?? null,
            $input['size'] ?? null,
            $input['color'] ?? null,
            $input['condition'] ?? 'A',
            (float)($input['costPrice'] ?? 0),
            (float)($input['sellingPrice'] ?? 0),
            !empty($input['baleId']) ? (int) $input['baleId'] : null,
            'Available',
        ]);

        $id = (int) $db->lastInsertId();

        // Log movement
        $this->logMovement($id, null, 'Available', null, 'Product created', $user['id']);
        $this->logActivity($user['id'], 'Product Created', 'product', $id, "Created {$productCode}");

        $stmt = $db->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        $product['id'] = (int) $product['id'];
        $product['cost_price'] = (float) $product['cost_price'];
        $product['selling_price'] = (float) $product['selling_price'];

        Response::success($product, 'Product created');
    }

    /**
     * PUT /products/{id}
     */
    public function update(array $params, array $input, ?array $user): void
    {
        $id = (int) $params['id'];
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$id]);
        $product = $stmt->fetch();

        if (!$product) {
            Response::error('Product not found', 404);
            return;
        }

        $fields = [];
        $bindings = [];

        $allowedFields = [
            'productName' => 'product_name',
            'brand' => 'brand',
            'category' => 'category',
            'size' => 'size',
            'color' => 'color',
            'costPrice' => 'cost_price',
            'sellingPrice' => 'selling_price',
            'baleId' => 'bale_id',
        ];

        foreach ($allowedFields as $inputKey => $dbColumn) {
            if (array_key_exists($inputKey, $input)) {
                $fields[] = "{$dbColumn} = ?";
                $bindings[] = $input[$inputKey] === '' ? null : $input[$inputKey];
            }
        }

        if (isset($input['condition'])) {
            $fields[] = 'condition_grade = ?';
            $bindings[] = $input['condition'];
        }

        if (empty($fields)) {
            Response::error('No fields to update', 400);
            return;
        }

        $bindings[] = $id;
        $sql = 'UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $db->prepare($sql)->execute($bindings);

        $this->logActivity($user['id'], 'Product Updated', 'product', $id, "Updated product #{$id}");

        $stmt = $db->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$id]);
        $updated = $stmt->fetch();
        $updated['id'] = (int) $updated['id'];
        $updated['cost_price'] = (float) $updated['cost_price'];
        $updated['selling_price'] = (float) $updated['selling_price'];

        Response::success($updated, 'Product updated');
    }

    private function logMovement(int $productId, ?string $from, string $to, ?int $orderId, string $reason, int $userId): void
    {
        try {
            $db = Database::getConnection();
            $stmt = $db->prepare(
                'INSERT INTO product_movements (product_id, from_status, to_status, order_id, reason, created_by)
                 VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$productId, $from, $to, $orderId, $reason, $userId]);
        } catch (Exception $e) {}
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
