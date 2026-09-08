<?php
/**
 * TBB OS — Vouchers Controller
 */

require_once __DIR__ . '/../Helpers/Response.php';
require_once __DIR__ . '/../Helpers/Auth.php';
require_once __DIR__ . '/../../config/database.php';

class VouchersController
{
    /**
     * GET /vouchers/{id}
     * Returns complete voucher data for printing
     */
    public function show(array $params, array $input, ?array $user): void
    {
        $id = (int) $params['id'];
        $db = Database::getConnection();

        // Get order with all voucher data
        $stmt = $db->prepare('
            SELECT o.*, c.name as customer_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
        ');
        $stmt->execute([$id]);
        $order = $stmt->fetch();

        if (!$order) {
            Response::error('Voucher not found', 404);
            return;
        }

        $order['id'] = (int) $order['id'];
        $order['customer_id'] = (int) $order['customer_id'];
        $order['delivery_fee'] = (float) $order['delivery_fee'];
        $order['subtotal'] = (float) $order['subtotal'];
        $order['total_amount'] = (float) $order['total_amount'];

        // Get items (only product code, qty, amount for receipt)
        $stmt = $db->prepare('
            SELECT product_code_snapshot, quantity, unit_price, line_total
            FROM order_items
            WHERE order_id = ?
        ');
        $stmt->execute([$id]);
        $items = $stmt->fetchAll();

        foreach ($items as &$item) {
            $item['quantity'] = (int) $item['quantity'];
            $item['unit_price'] = (float) $item['unit_price'];
            $item['line_total'] = (float) $item['line_total'];
        }

        $order['items'] = $items;

        // Get settings for voucher header/footer
        $settings = [];
        $stmt = $db->query('SELECT setting_key, setting_value FROM settings');
        while ($row = $stmt->fetch()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }

        $order['business'] = [
            'name' => $settings['business_name'] ?? 'The Bra Boutique (Yangon)',
            'phone' => $settings['phone'] ?? '',
            'facebook' => $settings['facebook'] ?? '',
            'voucher_footer' => $settings['voucher_footer'] ?? 'Thank You For Shopping With Us!',
        ];

        // Log reprint if applicable
        if ($user) {
            try {
                $logStmt = $db->prepare(
                    'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent)
                     VALUES (?, ?, ?, ?, ?, ?, ?)'
                );
                $logStmt->execute([
                    $user['id'], 'Voucher Viewed', 'voucher', $id,
                    "Viewed voucher {$order['voucher_number']}",
                    Auth::ipAddress(),
                    substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
                ]);
            } catch (Exception $e) {}
        }

        Response::success($order);
    }
}
