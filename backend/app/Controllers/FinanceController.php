<?php
/**
 * TBB OS — Finance Controller
 */

require_once __DIR__ . '/../Helpers/Response.php';
require_once __DIR__ . '/../Helpers/Auth.php';
require_once __DIR__ . '/../../config/database.php';

class FinanceController
{
    /**
     * GET /finance/summary
     */
    public function summary(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $dateFrom = $_GET['date_from'] ?? null;
        $dateTo = $_GET['date_to'] ?? null;

        $dateFilter = '';
        $bindings = [];

        if ($dateFrom) {
            $dateFilter .= ' AND o.order_date >= ?';
            $bindings[] = $dateFrom;
        }
        if ($dateTo) {
            $dateFilter .= ' AND o.order_date <= ?';
            $bindings[] = $dateTo;
        }

        // Revenue
        $sql = "SELECT COALESCE(SUM(total_amount), 0) FROM orders o WHERE o.order_status != 'Cancelled' {$dateFilter}";
        $stmt = $db->prepare($sql);
        $stmt->execute($bindings);
        $revenue = (float) $stmt->fetchColumn();

        // Product cost (use historical cost_price_snapshot, not current product cost)
        $sql = "SELECT COALESCE(SUM(oi.cost_price_snapshot * oi.quantity), 0)
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE o.order_status != 'Cancelled' {$dateFilter}";
        $stmt = $db->prepare($sql);
        $stmt->execute($bindings);
        $productCost = (float) $stmt->fetchColumn();

        $grossProfit = $revenue - $productCost;

        // Expenses
        $expFilter = '';
        $expBindings = [];
        if ($dateFrom) {
            $expFilter .= ' AND expense_date >= ?';
            $expBindings[] = $dateFrom;
        }
        if ($dateTo) {
            $expFilter .= ' AND expense_date <= ?';
            $expBindings[] = $dateTo;
        }

        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE 1=1 {$expFilter}");
        $stmt->execute($expBindings);
        $totalExpenses = (float) $stmt->fetchColumn();

        $netProfit = $grossProfit - $totalExpenses;

        Response::success([
            'revenue' => $revenue,
            'product_cost' => $productCost,
            'gross_profit' => $grossProfit,
            'total_expenses' => $totalExpenses,
            'net_profit' => $netProfit,
        ]);
    }

    /**
     * GET /expenses
     */
    public function expenses(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $where = '';
        $bindings = [];

        $category = trim($_GET['category'] ?? '');
        $dateFrom = trim($_GET['date_from'] ?? '');
        $dateTo = trim($_GET['date_to'] ?? '');

        if ($category) {
            $where .= ' AND category = ?';
            $bindings[] = $category;
        }
        if ($dateFrom) {
            $where .= ' AND expense_date >= ?';
            $bindings[] = $dateFrom;
        }
        if ($dateTo) {
            $where .= ' AND expense_date <= ?';
            $bindings[] = $dateTo;
        }

        $countStmt = $db->prepare("SELECT COUNT(*) FROM expenses WHERE 1=1 {$where}");
        $countStmt->execute($bindings);
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT * FROM expenses WHERE 1=1 {$where} ORDER BY expense_date DESC LIMIT {$limit} OFFSET {$offset}";
        $stmt = $db->prepare($sql);
        $stmt->execute($bindings);
        $expenses = $stmt->fetchAll();

        foreach ($expenses as &$e) {
            $e['id'] = (int) $e['id'];
            $e['amount'] = (float) $e['amount'];
        }

        Response::paginated($expenses, $total, $page, $limit);
    }

    /**
     * POST /expenses
     */
    public function storeExpense(array $params, array $input, ?array $user): void
    {
        $expenseDate = trim($input['expenseDate'] ?? '');
        $category = trim($input['category'] ?? '');
        $amount = (float)($input['amount'] ?? 0);

        if ($expenseDate === '' || $category === '' || $amount <= 0) {
            Response::error('Date, category, and amount are required', 400);
            return;
        }

        $allowedCategories = ['Bale Purchase', 'Delivery Cost', 'Packaging Cost', 'Miscellaneous'];
        if (!in_array($category, $allowedCategories)) {
            Response::error('Invalid category', 400);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('
            INSERT INTO expenses (expense_date, category, amount, description, reference, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $expenseDate,
            $category,
            $amount,
            $input['description'] ?? null,
            $input['reference'] ?? null,
            $user['id'],
        ]);

        $id = (int) $db->lastInsertId();

        // Create transaction
        $stmt = $db->prepare('
            INSERT INTO transactions (transaction_type, reference_type, reference_id, amount, description, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute(['expense', 'expense', $id, $amount, "Expense: {$category}", $user['id']]);

        // Log activity
        $stmt = $db->prepare('
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$user['id'], 'Expense Created', 'expense', $id, "Created expense: {$category} - {$amount}", Auth::ipAddress(), substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500)]);

        $stmt = $db->prepare('SELECT * FROM expenses WHERE id = ?');
        $stmt->execute([$id]);
        $expense = $stmt->fetch();
        $expense['id'] = (int) $expense['id'];
        $expense['amount'] = (float) $expense['amount'];

        Response::success($expense, 'Expense created');
    }

    /**
     * PUT /expenses/{id}
     */
    public function updateExpense(array $params, array $input, ?array $user): void
    {
        $id = (int) $params['id'];
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT id FROM expenses WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::error('Expense not found', 404);
            return;
        }

        $fields = [];
        $bindings = [];

        if (isset($input['expenseDate'])) { $fields[] = 'expense_date = ?'; $bindings[] = $input['expenseDate']; }
        if (isset($input['category'])) { $fields[] = 'category = ?'; $bindings[] = $input['category']; }
        if (isset($input['amount'])) { $fields[] = 'amount = ?'; $bindings[] = (float) $input['amount']; }
        if (isset($input['description'])) { $fields[] = 'description = ?'; $bindings[] = $input['description']; }
        if (isset($input['reference'])) { $fields[] = 'reference = ?'; $bindings[] = $input['reference']; }

        if (empty($fields)) {
            Response::error('No fields to update', 400);
            return;
        }

        $bindings[] = $id;
        $db->prepare('UPDATE expenses SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($bindings);

        Response::success(null, 'Expense updated');
    }
}
