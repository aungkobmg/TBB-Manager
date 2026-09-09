<?php
/**
 * TBB OS — Orders Controller
 * Handles order creation with transaction safety and voucher generation
 */

require_once __DIR__ . '/../Helpers/Response.php';
require_once __DIR__ . '/../Helpers/Auth.php';
require_once __DIR__ . '/../../config/database.php';

class OrdersController
{
    /**
     * GET /orders
     */
    public function index(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $where = [];
        $bindings = [];

        $search = trim($_GET['search'] ?? '');
        $status = trim($_GET['status'] ?? '');
        $paymentMethod = trim($_GET['payment_method'] ?? '');
        $dateFrom = trim($_GET['date_from'] ?? '');
        $dateTo = trim($_GET['date_to'] ?? '');

        if ($search !== '') {
            $where[] = '(o.voucher_number LIKE ? OR o.customer_name_snapshot LIKE ? OR o.phone_snapshot LIKE ?)';
            $bindings[] = "%{$search}%";
            $bindings[] = "%{$search}%";
            $bindings[] = "%{$search}%";
        }
        if ($status !== '') {
            $where[] = 'o.order_status = ?';
            $bindings[] = $status;
        }
        if ($paymentMethod !== '') {
            $where[] = 'o.payment_method = ?';
            $bindings[] = $paymentMethod;
        }
        if ($dateFrom !== '') {
            $where[] = 'o.order_date >= ?';
            $bindings[] = $dateFrom;
        }
        if ($dateTo !== '') {
            $where[] = 'o.order_date <= ?';
            $bindings[] = $dateTo;
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $db->prepare("SELECT COUNT(*) FROM orders o {$whereClause}");
        $countStmt->execute($bindings);
        $total = (int) $countStmt->fetchColumn();

        // Use JOIN with subquery to avoid N+1 query problem
        $sql = "SELECT o.*, 
                       c.name as customer_name, 
                       c.phone as customer_phone,
                       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                {$whereClause}
                ORDER BY o.created_at DESC
                LIMIT {$limit} OFFSET {$offset}";
        $stmt = $db->prepare($sql);
        $stmt->execute($bindings);
        $orders = $stmt->fetchAll();

        foreach ($orders as &$o) {
            $o['id'] = (int) $o['id'];
            $o['customer_id'] = (int) $o['customer_id'];
            $o['delivery_fee'] = (float) $o['delivery_fee'];
            $o['subtotal'] = (float) $o['subtotal'];
            $o['total_amount'] = (float) $o['total_amount'];
            $o['item_count'] = (int) $o['item_count'];
        }

        Response::paginated($orders, $total, $page, $limit);
    }

    /**
     * GET /orders/{id}
     */
    public function show(array $params, array $input, ?array $user): void
    {
        $id = (int) $params['id'];
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT o.*, c.name as customer_name, c.phone as customer_phone FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?');
        $stmt->execute([$id]);
        $order = $stmt->fetch();

        if (!$order) {
            Response::error('Order not found', 404);
            return;
        }

        $order['id'] = (int) $order['id'];
        $order['customer_id'] = (int) $order['customer_id'];
        $order['delivery_fee'] = (float) $order['delivery_fee'];
        $order['subtotal'] = (float) $order['subtotal'];
        $order['total_amount'] = (float) $order['total_amount'];

        // Get items
        $stmt = $db->prepare('
            SELECT oi.*, p.product_name, p.brand, p.size, p.color, p.cost_price
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        ');
        $stmt->execute([$id]);
        $items = $stmt->fetchAll();

        foreach ($items as &$item) {
            $item['id'] = (int) $item['id'];
            $item['order_id'] = (int) $item['order_id'];
            $item['product_id'] = (int) $item['product_id'];
            $item['quantity'] = (int) $item['quantity'];
            $item['unit_price'] = (float) $item['unit_price'];
            $item['line_total'] = (float) $item['line_total'];
            if ($item['cost_price'] !== null) {
                $item['cost_price'] = (float) $item['cost_price'];
            }
        }

        $order['items'] = $items;

        Response::success($order);
    }

    /**
     * POST /orders
     * Transaction-safe order creation with voucher generation
     */
    public function store(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        // Validate input
        $customerId = (int)($input['customerId'] ?? 0);
        $productCodes = $input['productCodes'] ?? [];
        $deliveryFee = (float)($input['deliveryFee'] ?? 0);
        $deliveryCompany = $input['deliveryCompany'] ?? null;
        $paymentMethod = $input['paymentMethod'] ?? 'COD';
        $paymentStatus = $input['paymentStatus'] ?? 'Unpaid';
        $shippingAddress = $input['shippingAddress'] ?? '';
        $trackingNumber = $input['trackingNumber'] ?? '';

        if ($customerId <= 0) {
            Response::error('Customer is required', 400);
            return;
        }

        if (empty($productCodes)) {
            Response::error('At least one product is required', 400);
            return;
        }

        // Validate allowed payment methods
        $allowedPayments = ['KBZ Pay', 'Wave Pay', 'AYA Pay', 'COD'];
        if (!in_array($paymentMethod, $allowedPayments)) {
            Response::error('Invalid payment method', 400);
            return;
        }

        // Begin transaction
        $db->beginTransaction();

        try {
            // 1. Verify customer exists
            $stmt = $db->prepare('SELECT * FROM customers WHERE id = ? FOR UPDATE');
            $stmt->execute([$customerId]);
            $customer = $stmt->fetch();

            if (!$customer) {
                $db->rollBack();
                Response::error('Customer not found', 404);
                return;
            }

            // 2. Verify all products are available and lock them
            $products = [];
            $subtotal = 0;

            foreach ($productCodes as $code) {
                $code = strtoupper(trim($code));
                $stmt = $db->prepare('SELECT * FROM products WHERE product_code = ? FOR UPDATE');
                $stmt->execute([$code]);
                $product = $stmt->fetch();

                if (!$product) {
                    $db->rollBack();
                    Response::error("Product not found: {$code}", 404);
                    return;
                }

                if ($product['status'] === 'Sold') {
                    $db->rollBack();
                    Response::error("Product {$code} is already sold", 409);
                    return;
                }

                if ($product['status'] === 'Reserved') {
                    $db->rollBack();
                    Response::error("Product {$code} is currently reserved", 409);
                    return;
                }

                if ($product['status'] === 'Cancelled') {
                    $db->rollBack();
                    Response::error("Product {$code} is cancelled", 409);
                    return;
                }

                $products[] = $product;
                $subtotal += (float) $product['selling_price'];
            }

            // 3. Generate voucher number safely
            $dateKey = date('ymd');
            $stmt = $db->prepare('SELECT last_number FROM voucher_sequences WHERE date_key = ? FOR UPDATE');
            $stmt->execute([$dateKey]);
            $row = $stmt->fetch();

            if ($row) {
                $nextNum = (int) $row['last_number'] + 1;
                $db->prepare('UPDATE voucher_sequences SET last_number = ? WHERE date_key = ?')
                   ->execute([$nextNum, $dateKey]);
            } else {
                $nextNum = 1;
                $db->prepare('INSERT INTO voucher_sequences (date_key, last_number) VALUES (?, ?)')
                   ->execute([$dateKey, $nextNum]);
            }

            $voucherNumber = sprintf('TBB-%s-%04d', $dateKey, $nextNum);

            // 4. Create order
            $orderDate = date('Y-m-d');
            $orderTime = date('H:i:s');
            $totalAmount = $subtotal + $deliveryFee;

            $stmt = $db->prepare('
                INSERT INTO orders (voucher_number, order_date, order_time, customer_id,
                    customer_name_snapshot, phone_snapshot, shipping_address_snapshot,
                    delivery_company, tracking_number, payment_method, payment_status,
                    delivery_fee, subtotal, total_amount, order_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $voucherNumber,
                $orderDate,
                $orderTime,
                $customerId,
                $customer['name'],
                $customer['phone'],
                $shippingAddress ?: ($customer['address'] ?? ''),
                $deliveryCompany,
                $trackingNumber,
                $paymentMethod,
                $paymentStatus,
                $deliveryFee,
                $subtotal,
                $totalAmount,
                'Pending',
            ]);

            $orderId = (int) $db->lastInsertId();

            // 5. Create order items and update product statuses
            foreach ($products as $product) {
                $unitPrice = (float) $product['selling_price'];

                $stmt = $db->prepare('
                    INSERT INTO order_items (order_id, product_id, product_code_snapshot, quantity, unit_price, line_total)
                    VALUES (?, ?, ?, ?, ?, ?)
                ');
                $stmt->execute([
                    $orderId,
                    $product['id'],
                    $product['product_code'],
                    1,
                    $unitPrice,
                    $unitPrice,
                ]);

                // Update product status
                $stmt = $db->prepare("UPDATE products SET status = 'Sold', reserved_order_id = ? WHERE id = ?");
                $stmt->execute([$orderId, $product['id']]);

                // Log movement
                $stmt = $db->prepare('
                    INSERT INTO product_movements (product_id, from_status, to_status, order_id, reason, created_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                ');
                $stmt->execute([$product['id'], 'Available', 'Sold', $orderId, 'Sold via order', $user['id']]);
            }

            // 6. Create financial transaction
            $stmt = $db->prepare('
                INSERT INTO transactions (transaction_type, reference_type, reference_id, amount, description, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute(['sale', 'order', $orderId, $totalAmount, "Sale: {$voucherNumber}", $user['id']]);

            // 7. Log activity
            $stmt = $db->prepare('
                INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $user['id'], 'Order Created', 'order', $orderId,
                "Created order {$voucherNumber} with " . count($products) . " items",
                Auth::ipAddress(),
                substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
            ]);

            // 8. Commit
            $db->commit();

            // Return created order
            $stmt = $db->prepare('SELECT * FROM orders WHERE id = ?');
            $stmt->execute([$orderId]);
            $order = $stmt->fetch();

            $order['id'] = (int) $order['id'];
            $order['customer_id'] = (int) $order['customer_id'];
            $order['delivery_fee'] = (float) $order['delivery_fee'];
            $order['subtotal'] = (float) $order['subtotal'];
            $order['total_amount'] = (float) $order['total_amount'];

            // Get items
            $stmt = $db->prepare('SELECT * FROM order_items WHERE order_id = ?');
            $stmt->execute([$orderId]);
            $items = $stmt->fetchAll();
            foreach ($items as &$item) {
                $item['id'] = (int) $item['id'];
                $item['order_id'] = (int) $item['order_id'];
                $item['product_id'] = (int) $item['product_id'];
                $item['quantity'] = (int) $item['quantity'];
                $item['unit_price'] = (float) $item['unit_price'];
                $item['line_total'] = (float) $item['line_total'];
            }
            $order['items'] = $items;

            Response::success($order, 'Order created successfully');

        } catch (Exception $e) {
            $db->rollBack();

            $isProduction = env('APP_ENV', 'production') === 'production';
            $message = $isProduction ? 'Order could not be created. Please try again.' : $e->getMessage();
            Response::error($message, 500);
        }
    }

    /**
     * PUT /orders/{id}
     */
    public function update(array $params, array $input, ?array $user): void
    {
        $id = (int) $params['id'];
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$id]);
        $order = $stmt->fetch();

        if (!$order) {
            Response::error('Order not found', 404);
            return;
        }

        $fields = [];
        $bindings = [];

        $allowedFields = [
            'deliveryCompany' => 'delivery_company',
            'trackingNumber' => 'tracking_number',
            'deliveryFee' => 'delivery_fee',
            'paymentStatus' => 'payment_status',
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

        // Recalculate total if delivery fee changed
        if (isset($input['deliveryFee'])) {
            $newDeliveryFee = (float) $input['deliveryFee'];
            $fields[] = 'total_amount = subtotal + ?';
            // We need to handle this differently
            array_pop($fields); // Remove the last one
            $fields[] = 'total_amount = ?';
            $bindings[] = (float) $order['subtotal'] + $newDeliveryFee;
        }

        $bindings[] = $id;
        $sql = 'UPDATE orders SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $db->prepare($sql)->execute($bindings);

        $this->logActivity($user['id'], 'Order Updated', 'order', $id, "Updated order #{$id}");

        // Return updated order
        $stmt = $db->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$id]);
        $updated = $stmt->fetch();
        $updated['id'] = (int) $updated['id'];
        $updated['customer_id'] = (int) $updated['customer_id'];
        $updated['delivery_fee'] = (float) $updated['delivery_fee'];
        $updated['subtotal'] = (float) $updated['subtotal'];
        $updated['total_amount'] = (float) $updated['total_amount'];

        Response::success($updated, 'Order updated');
    }

    /**
     * PUT /orders/{id}/status
     */
    public function updateStatus(array $params, array $input, ?array $user): void
    {
        $id = (int) $params['id'];
        $newStatus = $input['status'] ?? '';

        $allowedStatuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
        if (!in_array($newStatus, $allowedStatuses)) {
            Response::error('Invalid status', 400);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, order_status FROM orders WHERE id = ?');
        $stmt->execute([$id]);
        $order = $stmt->fetch();

        if (!$order) {
            Response::error('Order not found', 404);
            return;
        }

        if ($order['order_status'] === 'Cancelled') {
            Response::error('Cannot update a cancelled order', 400);
            return;
        }

        $db->prepare('UPDATE orders SET order_status = ? WHERE id = ?')
           ->execute([$newStatus, $id]);

        $this->logActivity($user['id'], 'Order Status Changed', 'order', $id, "Status: {$order['order_status']} → {$newStatus}");

        Response::success(null, "Order status updated to {$newStatus}");
    }

    /**
     * PUT /orders/{id}/cancel
     */
    public function cancel(array $params, array $input, ?array $user): void
    {
        $id = (int) $params['id'];
        $reason = $input['reason'] ?? 'Cancelled by admin';

        $db = Database::getConnection();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
            $stmt->execute([$id]);
            $order = $stmt->fetch();

            if (!$order) {
                $db->rollBack();
                Response::error('Order not found', 404);
                return;
            }

            if ($order['order_status'] === 'Cancelled') {
                $db->rollBack();
                Response::error('Order is already cancelled', 400);
                return;
            }

            // Cancel order
            $db->prepare("UPDATE orders SET order_status = 'Cancelled', cancel_reason = ?, cancelled_at = NOW() WHERE id = ?")
               ->execute([$reason, $id]);

            // Release products
            $stmt = $db->prepare('SELECT product_id FROM order_items WHERE order_id = ?');
            $stmt->execute([$id]);
            $items = $stmt->fetchAll();

            foreach ($items as $item) {
                $db->prepare("UPDATE products SET status = 'Available', reserved_order_id = NULL WHERE id = ?")
                   ->execute([$item['product_id']]);

                // Log movement
                $db->prepare('
                    INSERT INTO product_movements (product_id, from_status, to_status, order_id, reason, created_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                ')->execute([$item['product_id'], 'Sold', 'Available', $id, 'Order cancelled', $user['id']]);
            }

            // Log activity
            $this->logActivity($user['id'], 'Order Cancelled', 'order', $id, "Cancelled: {$reason}");

            $db->commit();
            Response::success(null, 'Order cancelled. Products released.');

        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Failed to cancel order', 500);
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
