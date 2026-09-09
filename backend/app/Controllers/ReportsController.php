<?php
/**
 * TBB OS — Reports Controller
 * Server-side aggregation for all reports
 */

require_once __DIR__ . '/../Helpers/Response.php';
require_once __DIR__ . '/../Helpers/Auth.php';
require_once __DIR__ . '/../../config/database.php';

class ReportsController
{
    private function getDateFilter(): array
    {
        $from = $_GET['date_from'] ?? date('Y-m-01');
        $to = $_GET['date_to'] ?? date('Y-m-d');
        return [$from, $to];
    }

    /**
     * GET /reports/daily-sales
     */
    public function dailySales(array $params, array $input, ?array $user): void
    {
        [$from, $to] = $this->getDateFilter();
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT order_date as date,
                   COUNT(*) as orders,
                   COALESCE(SUM(total_amount), 0) as revenue
            FROM orders
            WHERE order_date BETWEEN ? AND ?
              AND order_status != 'Cancelled'
            GROUP BY order_date
            ORDER BY order_date DESC
        ");
        $stmt->execute([$from, $to]);
        $data = $stmt->fetchAll();

        foreach ($data as &$d) {
            $d['orders'] = (int) $d['orders'];
            $d['revenue'] = (float) $d['revenue'];
        }

        Response::success($data);
    }

    /**
     * GET /reports/monthly-sales
     */
    public function monthlySales(array $params, array $input, ?array $user): void
    {
        [$from, $to] = $this->getDateFilter();
        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT DATE_FORMAT(order_date, '%Y-%m') as month,
                   COUNT(*) as orders,
                   COALESCE(SUM(total_amount), 0) as revenue
            FROM orders
            WHERE order_date BETWEEN ? AND ?
              AND order_status != 'Cancelled'
            GROUP BY DATE_FORMAT(order_date, '%Y-%m')
            ORDER BY month DESC
        ");
        $stmt->execute([$from, $to]);
        $data = $stmt->fetchAll();

        foreach ($data as &$d) {
            $d['orders'] = (int) $d['orders'];
            $d['revenue'] = (float) $d['revenue'];
        }

        Response::success($data);
    }

    /**
     * GET /reports/inventory
     */
    public function inventory(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;
        $status = $_GET['status'] ?? '';

        $where = '';
        $bindings = [];
        if ($status) {
            $where = 'WHERE status = ?';
            $bindings[] = $status;
        }

        $countStmt = $db->prepare("SELECT COUNT(*) FROM products {$where}");
        $countStmt->execute($bindings);
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT product_code, product_name, brand, cost_price, selling_price, status
                FROM products {$where}
                ORDER BY created_at DESC
                LIMIT {$limit} OFFSET {$offset}";
        $stmt = $db->prepare($sql);
        $stmt->execute($bindings);
        $products = $stmt->fetchAll();

        foreach ($products as &$p) {
            $p['cost_price'] = (float) $p['cost_price'];
            $p['selling_price'] = (float) $p['selling_price'];
        }

        // Summary
        $stmt = $db->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available,
                SUM(CASE WHEN status = 'Sold' THEN 1 ELSE 0 END) as sold,
                COALESCE(SUM(CASE WHEN status = 'Available' THEN cost_price ELSE 0 END), 0) as cost_value,
                COALESCE(SUM(CASE WHEN status = 'Available' THEN selling_price ELSE 0 END), 0) as selling_value
            FROM products
        ");
        $summary = $stmt->fetch();
        $summary['total'] = (int) $summary['total'];
        $summary['available'] = (int) $summary['available'];
        $summary['sold'] = (int) $summary['sold'];
        $summary['cost_value'] = (float) $summary['cost_value'];
        $summary['selling_value'] = (float) $summary['selling_value'];

        Response::success(['items' => $products, 'summary' => $summary, 'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit]]);
    }

    /**
     * GET /reports/inventory-valuation
     */
    public function inventoryValuation(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        // Get inventory valuation for available products only
        $stmt = $db->query("
            SELECT
                COUNT(*) as available_quantity,
                COALESCE(SUM(cost_price), 0) as total_cost_value,
                COALESCE(SUM(selling_price), 0) as total_selling_value,
                COALESCE(SUM(selling_price - cost_price), 0) as potential_gross_profit
            FROM products
            WHERE status = 'Available' AND archived_at IS NULL
        ");
        $valuation = $stmt->fetch();

        // Get breakdown by condition
        $stmt = $db->query("
            SELECT
                condition_grade,
                COUNT(*) as quantity,
                COALESCE(SUM(cost_price), 0) as cost_value,
                COALESCE(SUM(selling_price), 0) as selling_value
            FROM products
            WHERE status = 'Available' AND archived_at IS NULL
            GROUP BY condition_grade
            ORDER BY condition_grade
        ");
        $byCondition = $stmt->fetchAll();

        // Get breakdown by category
        $stmt = $db->query("
            SELECT
                COALESCE(category, 'Uncategorized') as category,
                COUNT(*) as quantity,
                COALESCE(SUM(cost_price), 0) as cost_value,
                COALESCE(SUM(selling_price), 0) as selling_value
            FROM products
            WHERE status = 'Available' AND archived_at IS NULL
            GROUP BY category
            ORDER BY quantity DESC
        ");
        $byCategory = $stmt->fetchAll();

        Response::success([
            'valuation' => [
                'available_quantity' => (int) $valuation['available_quantity'],
                'total_cost_value' => (float) $valuation['total_cost_value'],
                'total_selling_value' => (float) $valuation['total_selling_value'],
                'potential_gross_profit' => (float) $valuation['potential_gross_profit'],
            ],
            'by_condition' => $byCondition,
            'by_category' => $byCategory,
        ]);
    }

    /**
     * GET /reports/bale-performance
     */
    public function balePerformance(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $stmt = $db->query("
            SELECT
                b.id, b.bale_code, b.bale_cost, b.supplier_name, b.purchase_date,
                COUNT(p.id) as product_count,
                SUM(CASE WHEN p.status = 'Sold' THEN 1 ELSE 0 END) as sold_count,
                SUM(CASE WHEN p.status = 'Available' THEN 1 ELSE 0 END) as available_count,
                COALESCE(SUM(p.cost_price), 0) as total_product_cost,
                COALESCE(SUM(oi.unit_price), 0) as revenue
            FROM bales b
            LEFT JOIN products p ON b.id = p.bale_id
            LEFT JOIN order_items oi ON p.id = oi.product_id
            GROUP BY b.id
            ORDER BY b.created_at DESC
        ");
        $data = $stmt->fetchAll();

        foreach ($data as &$d) {
            $d['id'] = (int) $d['id'];
            $d['bale_cost'] = (float) $d['bale_cost'];
            $d['product_count'] = (int) $d['product_count'];
            $d['sold_count'] = (int) $d['sold_count'];
            $d['available_count'] = (int) $d['available_count'];
            $d['total_product_cost'] = (float) $d['total_product_cost'];
            $d['revenue'] = (float) $d['revenue'];
            $d['profit'] = (float) $d['revenue'] - (float) $d['total_product_cost'];
        }

        Response::success($data);
    }

    /**
     * GET /reports/profit-loss
     */
    public function profitLoss(array $params, array $input, ?array $user): void
    {
        [$from, $to] = $this->getDateFilter();
        $db = Database::getConnection();

        // Revenue
        $stmt = $db->prepare("
            SELECT COALESCE(SUM(total_amount), 0)
            FROM orders WHERE order_date BETWEEN ? AND ? AND order_status != 'Cancelled'
        ");
        $stmt->execute([$from, $to]);
        $revenue = (float) $stmt->fetchColumn();

        // Product cost (use historical cost_price_snapshot)
        $stmt = $db->prepare("
            SELECT COALESCE(SUM(oi.cost_price_snapshot * oi.quantity), 0)
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.order_date BETWEEN ? AND ? AND o.order_status != 'Cancelled'
        ");
        $stmt->execute([$from, $to]);
        $productCost = (float) $stmt->fetchColumn();

        $grossProfit = $revenue - $productCost;

        // Expenses
        $stmt = $db->prepare("
            SELECT COALESCE(SUM(amount), 0)
            FROM expenses WHERE expense_date BETWEEN ? AND ?
        ");
        $stmt->execute([$from, $to]);
        $expenses = (float) $stmt->fetchColumn();

        $netProfit = $grossProfit - $expenses;

        // Expense breakdown
        $stmt = $db->prepare("
            SELECT category, COALESCE(SUM(amount), 0) as total
            FROM expenses WHERE expense_date BETWEEN ? AND ?
            GROUP BY category
        ");
        $stmt->execute([$from, $to]);
        $expenseBreakdown = $stmt->fetchAll();
        foreach ($expenseBreakdown as &$e) {
            $e['total'] = (float) $e['total'];
        }

        Response::success([
            'revenue' => $revenue,
            'product_cost' => $productCost,
            'gross_profit' => $grossProfit,
            'expenses' => $expenses,
            'net_profit' => $netProfit,
            'expense_breakdown' => $expenseBreakdown,
            'date_from' => $from,
            'date_to' => $to,
        ]);
    }

    /**
     * GET /reports/customer-history
     */
    public function customerHistory(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $stmt = $db->query("
            SELECT c.id, c.name, c.phone,
                   COUNT(o.id) as order_count,
                   COALESCE(SUM(o.total_amount), 0) as total_spent,
                   MAX(o.order_date) as last_order
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id AND o.order_status != 'Cancelled'
            GROUP BY c.id
            HAVING order_count > 0
            ORDER BY total_spent DESC
        ");
        $data = $stmt->fetchAll();

        foreach ($data as &$d) {
            $d['id'] = (int) $d['id'];
            $d['order_count'] = (int) $d['order_count'];
            $d['total_spent'] = (float) $d['total_spent'];
        }

        Response::success($data);
    }

    /**
     * GET /reports/voucher-history
     */
    public function voucherHistory(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $where = '';
        $bindings = [];

        $search = trim($_GET['search'] ?? '');
        $dateFrom = trim($_GET['date_from'] ?? '');
        $dateTo = trim($_GET['date_to'] ?? '');

        if ($search) {
            $where .= ' AND (o.voucher_number LIKE ? OR o.customer_name_snapshot LIKE ?)';
            $bindings[] = "%{$search}%";
            $bindings[] = "%{$search}%";
        }
        if ($dateFrom) { $where .= ' AND o.order_date >= ?'; $bindings[] = $dateFrom; }
        if ($dateTo) { $where .= ' AND o.order_date <= ?'; $bindings[] = $dateTo; }

        $countStmt = $db->prepare("SELECT COUNT(*) FROM orders o WHERE 1=1 {$where}");
        $countStmt->execute($bindings);
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT o.id, o.voucher_number, o.order_date, o.customer_name_snapshot,
                       o.phone_snapshot, o.total_amount, o.order_status, o.payment_method,
                       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
                FROM orders o
                WHERE 1=1 {$where}
                ORDER BY o.created_at DESC
                LIMIT {$limit} OFFSET {$offset}";
        $stmt = $db->prepare($sql);
        $stmt->execute($bindings);
        $data = $stmt->fetchAll();

        foreach ($data as &$d) {
            $d['id'] = (int) $d['id'];
            $d['total_amount'] = (float) $d['total_amount'];
            $d['item_count'] = (int) $d['item_count'];
        }

        Response::paginated($data, $total, $page, $limit);
    }
}
