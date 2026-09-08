<?php
/**
 * TBB OS — Activity Logs Controller
 */

require_once __DIR__ . '/../Helpers/Response.php';
require_once __DIR__ . '/../Helpers/Auth.php';
require_once __DIR__ . '/../../config/database.php';

class ActivityController
{
    /**
     * GET /activity-logs
     */
    public function index(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;

        $where = [];
        $bindings = [];

        $search = trim($_GET['search'] ?? '');
        $action = trim($_GET['action'] ?? '');

        if ($search !== '') {
            $where[] = '(al.action LIKE ? OR al.description LIKE ? OR al.entity_type LIKE ?)';
            $bindings[] = "%{$search}%";
            $bindings[] = "%{$search}%";
            $bindings[] = "%{$search}%";
        }

        if ($action !== '') {
            $where[] = 'al.action = ?';
            $bindings[] = $action;
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $db->prepare("SELECT COUNT(*) FROM activity_logs al {$whereClause}");
        $countStmt->execute($bindings);
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT al.*, u.username
                FROM activity_logs al
                LEFT JOIN users u ON al.user_id = u.id
                {$whereClause}
                ORDER BY al.created_at DESC
                LIMIT {$limit} OFFSET {$offset}";
        $stmt = $db->prepare($sql);
        $stmt->execute($bindings);
        $logs = $stmt->fetchAll();

        foreach ($logs as &$l) {
            $l['id'] = (int) $l['id'];
            $l['user_id'] = $l['user_id'] ? (int) $l['user_id'] : null;
            $l['entity_id'] = $l['entity_id'] ? (int) $l['entity_id'] : null;
        }

        Response::paginated($logs, $total, $page, $limit);
    }
}
