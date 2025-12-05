<?php
/**
 * Database connectivity test
 * Usage: open http://localhost/bengkel/api/test_db.php in browser
 */
require_once __DIR__ . '/../config.php';

// Quick health check
try {
    // basic query
    $res = $conn->query("SELECT COUNT(*) AS cnt FROM users");
    $count = null;
    if ($res) {
        $row = $res->fetch_assoc();
        $count = $row['cnt'];
    }

    echo json_encode([
        'success' => true,
        'message' => 'Database connected',
        'db' => [
            'host' => DB_HOST,
            'name' => DB_NAME,
            'user' => DB_USER,
            'users_count' => $count
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database query error',
        'error' => $e->getMessage()
    ]);
}

?>