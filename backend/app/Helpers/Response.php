<?php
/**
 * TBB OS — JSON Response Helper
 */

class Response
{
    public static function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success(mixed $data = null, string $message = 'Success', array $extra = []): void
    {
        self::json(array_merge([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $extra));
    }

    public static function error(string $message, int $status = 400, mixed $details = null): void
    {
        $payload = [
            'success' => false,
            'error'   => $message,
        ];
        if ($details !== null) {
            $payload['details'] = $details;
        }
        self::json($payload, $status);
    }

    public static function paginated(array $items, int $total, int $page, int $limit): void
    {
        self::json([
            'success' => true,
            'data'    => $items,
            'pagination' => [
                'total'       => $total,
                'page'        => $page,
                'limit'       => $limit,
                'total_pages' => (int) ceil($total / $limit),
            ],
        ]);
    }
}
