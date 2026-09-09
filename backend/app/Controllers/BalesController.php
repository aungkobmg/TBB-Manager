<?php
/**
 * TBB OS — Bales Controller
 */

require_once __DIR__ . '/../Helpers/Response.php';
require_once __DIR__ . '/../Helpers/Auth.php';
require_once __DIR__ . '/../../config/database.php';

class BalesController
{
    /**
     * GET /bales
     */
    public function index(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = trim($_GET['search'] ?? '');
        $status = trim($_GET['status'] ?? '');

        $where = ['archived_at IS NULL'];
        $bindings = [];

        if ($search !== '') {
            $where[] = '(bale_code LIKE ? OR supplier_name LIKE ?)';
            $bindings[] = "%{$search}%";
            $bindings[] = "%{$search}%";
        }

        if ($status !== '') {
            $where[] = 'status = ?';
            $bindings[] = $status;
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);

        // Count
        $countStmt = $db->prepare("SELECT COUNT(*) FROM bales {$whereClause}");
        $countStmt->execute($bindings);
        $total = (int) $countStmt->fetchColumn();

        // Fetch
        $sql = "SELECT * FROM bales {$whereClause} ORDER BY created_at DESC LIMIT {$limit} OFFSET {$offset}";
        $stmt = $db->prepare($sql);
        $stmt->execute($bindings);
        $bales = $stmt->fetchAll();

        // Cast types
        foreach ($bales as &$b) {
            $b['id'] = (int) $b['id'];
            $b['bale_cost'] = (float) $b['bale_cost'];
            $b['expected_qty'] = (int) $b['expected_qty'];
            $b['actual_qty'] = (int) $b['actual_qty'];
        }

        Response::paginated($bales, $total, $page, $limit);
    }

    /**
     * GET /bales/{id}
     */
    public function show(array $params, array $input, ?array $user): void
    {
        $id = (int) $params['id'];
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM bales WHERE id = ?');
        $stmt->execute([$id]);
        $bale = $stmt->fetch();

        if (!$bale) {
            Response::error('Bale not found', 404);
            return;
        }

        $bale['id'] = (int) $bale['id'];
        $bale['bale_cost'] = (float) $bale['bale_cost'];
        $bale['expected_qty'] = (int) $bale['expected_qty'];
        $bale['actual_qty'] = (int) $bale['actual_qty'];

        // Summary stats
        $stmt = $db->prepare('
            SELECT
                COUNT(*) as total_products,
                SUM(CASE WHEN status = \'Available\' THEN 1 ELSE 0 END) as available_count,
                SUM(CASE WHEN status = \'Reserved\' THEN 1 ELSE 0 END) as reserved_count,
                SUM(CASE WHEN status = \'Sold\' THEN 1 ELSE 0 END) as sold_count,
                SUM(CASE WHEN status = \'Cancelled\' THEN 1 ELSE 0 END) as cancelled_count,
                COALESCE(SUM(cost_price), 0) as total_cost,
                COALESCE(SUM(CASE WHEN status = \'Sold\' THEN selling_price ELSE 0 END), 0) as total_revenue
            FROM products WHERE bale_id = ?
        ');
        $stmt->execute([$id]);
        $summary = $stmt->fetch();

        $bale['summary'] = [
            'total_products' => (int) $summary['total_products'],
            'available_count' => (int) $summary['available_count'],
            'reserved_count' => (int) $summary['reserved_count'],
            'sold_count' => (int) $summary['sold_count'],
            'cancelled_count' => (int) $summary['cancelled_count'],
            'total_cost' => (float) $summary['total_cost'],
            'total_revenue' => (float) $summary['total_revenue'],
            'profit' => (float) $summary['total_revenue'] - (float) $summary['total_cost'],
        ];

        Response::success($bale);
    }

    /**
     * POST /bales
     */
    public function store(array $params, array $input, ?array $user): void
    {
        $supplierName = trim($input['supplierName'] ?? '');
        $purchaseDate = trim($input['purchaseDate'] ?? '');
        $baleCost = (float)($input['baleCost'] ?? 0);
        $expectedQty = (int)($input['expectedQty'] ?? 0);
        $actualQty = (int)($input['actualQty'] ?? 0);
        $status = $input['status'] ?? 'Purchased';
        $notes = trim($input['notes'] ?? '');

        if ($supplierName === '' || $purchaseDate === '') {
            Response::error('Supplier name and purchase date are required', 400);
            return;
        }

        $db = Database::getConnection();

        // Generate bale code
        $dateKey = date('ymd', strtotime($purchaseDate));
        $stmt = $db->prepare("SELECT COUNT(*) FROM bales WHERE bale_code LIKE ?");
        $stmt->execute(["BAL-{$dateKey}-%"]);
        $count = (int) $stmt->fetchColumn();
        $baleCode = sprintf('BAL-%s-%03d', $dateKey, $count + 1);

        $stmt = $db->prepare('
            INSERT INTO bales (bale_code, purchase_date, supplier_name, bale_cost, expected_qty, actual_qty, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$baleCode, $purchaseDate, $supplierName, $baleCost, $expectedQty, $actualQty, $status, $notes]);

        $id = (int) $db->lastInsertId();

        // Log activity
        $this->logActivity($user['id'], 'Bale Created', 'bale', $id, "Created bale {$baleCode}");

        $stmt = $db->prepare('SELECT * FROM bales WHERE id = ?');
        $stmt->execute([$id]);
        $bale = $stmt->fetch();
        $bale['id'] = (int) $bale['id'];
        $bale['bale_cost'] = (float) $bale['bale_cost'];
        $bale['expected_qty'] = (int) $bale['expected_qty'];
        $bale['actual_qty'] = (int) $bale['actual_qty'];

        Response::success($bale, 'Bale created');
    }

    /**
     * PUT /bales/{id}
     */
    public function update(array $params, array $input, ?array $user): void
    {
        $id = (int) $params['id'];
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT id FROM bales WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::error('Bale not found', 404);
            return;
        }

        $fields = [];
        $bindings = [];

        $allowedFields = [
            'supplierName' => 'supplier_name',
            'purchaseDate' => 'purchase_date',
            'baleCost' => 'bale_cost',
            'expectedQty' => 'expected_qty',
            'actualQty' => 'actual_qty',
            'status' => 'status',
            'notes' => 'notes',
        ];

        foreach ($allowedFields as $inputKey => $dbColumn) {
            if (isset($input[$inputKey])) {
                $fields[] = "{$dbColumn} = ?";
                $bindings[] = $input[$inputKey];
            }
        }

        if (empty($fields)) {
            Response::error('No fields to update', 400);
            return;
        }

        $bindings[] = $id;
        $sql = 'UPDATE bales SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $db->prepare($sql)->execute($bindings);

        $this->logActivity($user['id'], 'Bale Updated', 'bale', $id, "Updated bale #{$id}");

        $stmt = $db->prepare('SELECT * FROM bales WHERE id = ?');
        $stmt->execute([$id]);
        $bale = $stmt->fetch();
        $bale['id'] = (int) $bale['id'];
        $bale['bale_cost'] = (float) $bale['bale_cost'];
        $bale['expected_qty'] = (int) $bale['expected_qty'];
        $bale['actual_qty'] = (int) $bale['actual_qty'];

        Response::success($bale, 'Bale updated');
    }

    /**
     * POST /bales/{id}/products/bulk
     * Bulk create products for a bale
     */
    public function bulkCreateProducts(array $params, array $input, ?array $user): void
    {
        $baleId = (int) $params['id'];
        $products = $input['products'] ?? [];

        if (empty($products)) {
            Response::error('No products provided', 400);
            return;
        }

        $db = Database::getConnection();

        // Check if bale exists and is not closed
        $stmt = $db->prepare('SELECT id, status FROM bales WHERE id = ?');
        $stmt->execute([$baleId]);
        $bale = $stmt->fetch();

        if (!$bale) {
            Response::error('Bale not found', 404);
            return;
        }

        if ($bale['status'] === 'Closed') {
            Response::error('Cannot add products to a closed bale', 400);
            return;
        }

        // Validate all products first
        $errors = [];
        foreach ($products as $index => $product) {
            if (empty($product['productName'])) {
                $errors[] = "Row " . ($index + 1) . ": Product name is required";
            }
            if (!isset($product['costPrice']) || $product['costPrice'] < 0) {
                $errors[] = "Row " . ($index + 1) . ": Invalid cost price";
            }
            if (!isset($product['sellingPrice']) || $product['sellingPrice'] < 0) {
                $errors[] = "Row " . ($index + 1) . ": Invalid selling price";
            }
        }

        if (!empty($errors)) {
            Response::error('Validation failed', 400, $errors);
            return;
        }

        // Use transaction for atomic operation
        $db->beginTransaction();

        try {
            $createdProducts = [];

            foreach ($products as $product) {
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
                    $product['productName'],
                    $product['brand'] ?? null,
                    $product['category'] ?? null,
                    $product['size'] ?? null,
                    $product['color'] ?? null,
                    $product['condition'] ?? 'A',
                    (float) $product['costPrice'],
                    (float) $product['sellingPrice'],
                    $baleId,
                    'Available',
                ]);

                $productId = (int) $db->lastInsertId();

                // Log movement
                $stmt = $db->prepare('
                    INSERT INTO product_movements (product_id, from_status, to_status, order_id, reason, created_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                ');
                $stmt->execute([$productId, null, 'Available', null, 'Product created via bulk import', $user['id']]);

                $createdProducts[] = [
                    'id' => $productId,
                    'product_code' => $productCode,
                    'product_name' => $product['productName'],
                ];
            }

            $db->commit();

            $this->logActivity($user['id'], 'Bulk Products Created', 'bale', $baleId, "Created " . count($createdProducts) . " products");

            Response::success([
                'count' => count($createdProducts),
                'products' => $createdProducts,
            ], 'Products created successfully');

        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Failed to create products: ' . $e->getMessage(), 500);
        }
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
