<?php
/**
 * TBB OS — Dashboard Controller
 * Server-side aggregation for dashboard metrics
 */

require_once __DIR__ . '/../Helpers/Response.php';
require_once __DIR__ . '/../Helpers/Auth.php';
require_once __DIR__ . '/../../config/database.php';

class DashboardController
{
    /**
     * GET /dashboard/summary
     */
    public function summary(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $today = date('Y-m-d');
        $monthStart = date('Y-m-01');

        // Revenue today
        $stmt = $db->prepare("
            SELECT COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as count
            FROM orders
            WHERE order_date = ? AND order_status != 'Cancelled'
        ");
        $stmt->execute([$today]);
        $todayData = $stmt->fetch();

        // Revenue this month
        $stmt = $db->prepare("
            SELECT COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as count
            FROM orders
            WHERE order_date >= ? AND order_status != 'Cancelled'
        ");
        $stmt->execute([$monthStart]);
        $monthData = $stmt->fetch();

        // Pending orders
        $stmt = $db->query("
            SELECT COUNT(*) FROM orders
            WHERE order_status IN ('Pending', 'Confirmed')
        ");
        $pendingOrders = (int) $stmt->fetchColumn();

        // Available products
        $stmt = $db->query("
            SELECT COUNT(*) as count,
                   COALESCE(SUM(cost_price), 0) as cost_value,
                   COALESCE(SUM(selling_price), 0) as selling_value
            FROM products WHERE status = 'Available'
        ");
        $inventory = $stmt->fetch();

        // Total expenses
        $stmt = $db->query("SELECT COALESCE(SUM(amount), 0) FROM expenses");
        $totalExpenses = (float) $stmt->fetchColumn();

        // Total revenue (all time)
        $stmt = $db->query("
            SELECT COALESCE(SUM(total_amount), 0)
            FROM orders WHERE order_status != 'Cancelled'
        ");
        $totalRevenue = (float) $stmt->fetchColumn();

        // Total product cost for sold items
        $stmt = $db->query("
            SELECT COALESCE(SUM(oi.unit_price * oi.quantity), 0)
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.order_status != 'Cancelled'
        ");
        $totalSalesRevenue = (float) $stmt->fetchColumn();

        // Cost of sold products
        $stmt = $db->query("
            SELECT COALESCE(SUM(p.cost_price * oi.quantity), 0)
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.order_status != 'Cancelled'
        ");
        $totalProductCost = (float) $stmt->fetchColumn();

        $grossProfit = $totalSalesRevenue - $totalProductCost;
        $netProfit = $grossProfit - $totalExpenses;

        // Recent orders
        $stmt = $db->query("
            SELECT id, voucher_number, customer_name_snapshot, total_amount, order_status, created_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT 5
        ");
        $recentOrders = $stmt->fetchAll();
        foreach ($recentOrders as &$o) {
            $o['id'] = (int) $o['id'];
            $o['total_amount'] = (float) $o['total_amount'];
        }

        // Recent expenses
        $stmt = $db->query("
            SELECT id, category, amount, expense_date
            FROM expenses
            ORDER BY created_at DESC
            LIMIT 5
        ");
        $recentExpenses = $stmt->fetchAll();
        foreach ($recentExpenses as &$e) {
            $e['id'] = (int) $e['id'];
            $e['amount'] = (float) $e['amount'];
        }

        // Total counts
        $stmt = $db->query("SELECT COUNT(*) FROM bales");
        $totalBales = (int) $stmt->fetchColumn();

        $stmt = $db->query("SELECT COUNT(*) FROM products");
        $totalProducts = (int) $stmt->fetchColumn();

        $stmt = $db->query("SELECT COUNT(*) FROM customers");
        $totalCustomers = (int) $stmt->fetchColumn();

        $stmt = $db->query("SELECT COUNT(*) FROM orders");
        $totalOrders = (int) $stmt->fetchColumn();

        Response::success([
            'revenue_today' => (float) $todayData['revenue'],
            'orders_today' => (int) $todayData['count'],
            'revenue_month' => (float) $monthData['revenue'],
            'orders_month' => (int) $monthData['count'],
            'pending_orders' => $pendingOrders,
            'available_products' => (int) $inventory['count'],
            'inventory_cost_value' => (float) $inventory['cost_value'],
            'inventory_selling_value' => (float) $inventory['selling_value'],
            'total_expenses' => $totalExpenses,
            'total_revenue' => $totalRevenue,
            'gross_profit' => $grossProfit,
            'net_profit' => $netProfit,
            'total_bales' => $totalBales,
            'total_products' => $totalProducts,
            'total_customers' => $totalCustomers,
            'total_orders' => $totalOrders,
            'recent_orders' => $recentOrders,
            'recent_expenses' => $recentExpenses,
            'today' => $today,
        ]);
    }
}
