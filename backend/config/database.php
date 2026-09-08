<?php
/**
 * TBB OS — Database Connection (PDO Singleton)
 */

require_once __DIR__ . '/env.php';

// Load .env from project root
loadEnv(dirname(__DIR__, 2) . '/.env');

class Database
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $host = env('DB_HOST', '127.0.0.1');
            $port = env('DB_PORT', '3306');
            $dbname = env('DB_NAME', 'tbb_os');
            $username = env('DB_USER', 'root');
            $password = env('DB_PASS', '');
            $charset = env('DB_CHARSET', 'utf8mb4');

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset}",
            ];

            try {
                self::$instance = new PDO($dsn, $username, $password, $options);
            } catch (PDOException $e) {
                $isProduction = env('APP_ENV', 'production') === 'production';
                if ($isProduction) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Database connection failed']);
                    exit;
                }
                throw $e;
            }
        }

        return self::$instance;
    }

    /**
     * Begin a transaction
     */
    public static function beginTransaction(): void
    {
        self::getConnection()->beginTransaction();
    }

    /**
     * Commit transaction
     */
    public static function commit(): void
    {
        self::getConnection()->commit();
    }

    /**
     * Rollback transaction
     */
    public static function rollback(): void
    {
        if (self::getConnection()->inTransaction()) {
            self::getConnection()->rollBack();
        }
    }
}
