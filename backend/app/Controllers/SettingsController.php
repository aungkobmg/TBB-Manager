<?php
/**
 * TBB OS — Settings Controller
 */

require_once __DIR__ . '/../Helpers/Response.php';
require_once __DIR__ . '/../Helpers/Auth.php';
require_once __DIR__ . '/../../config/database.php';

class SettingsController
{
    /**
     * GET /settings
     */
    public function index(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT setting_key, setting_value FROM settings');
        $settings = [];
        while ($row = $stmt->fetch()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        Response::success($settings);
    }

    /**
     * PUT /settings
     */
    public function update(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $allowedKeys = ['business_name', 'phone', 'facebook', 'address', 'voucher_footer', 'currency', 'currency_symbol', 'tax_rate'];

        foreach ($input as $key => $value) {
            if (in_array($key, $allowedKeys)) {
                $stmt = $db->prepare('
                    INSERT INTO settings (setting_key, setting_value)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE setting_value = ?
                ');
                $stmt->execute([$key, $value, $value]);
            }
        }

        // Log activity
        try {
            $stmt = $db->prepare('
                INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([$user['id'], 'Settings Updated', 'settings', null, 'Business settings updated', Auth::ipAddress(), substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500)]);
        } catch (Exception $e) {}

        Response::success(null, 'Settings updated');
    }

    /**
     * GET /settings/backup
     * Export database as JSON
     */
    public function backup(array $params, array $input, ?array $user): void
    {
        $db = Database::getConnection();

        $tables = ['bales', 'products', 'customers', 'orders', 'order_items', 'expenses', 'transactions', 'settings', 'activity_logs'];
        $data = [];

        foreach ($tables as $table) {
            $stmt = $db->query("SELECT * FROM {$table}");
            $data[$table] = $stmt->fetchAll();
        }

        $data['_metadata'] = [
            'export_date' => date('Y-m-d H:i:s'),
            'exported_by' => $user['username'] ?? 'unknown',
            'version' => '1.0.0',
        ];

        // Log
        try {
            $stmt = $db->prepare('
                INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([$user['id'], 'Database Exported', 'backup', null, 'Database backup exported', Auth::ipAddress(), substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500)]);
        } catch (Exception $e) {}

        // Return as download
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="tbb-os-backup-' . date('Y-m-d') . '.json"');
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}
