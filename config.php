<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
define('DB_HOST', 'localhost');
define('DB_USER', 'bengkel_user');
define('DB_PASS', '123'); 
define('DB_NAME', 'bengkel_db');
define('DB_PORT', 3306);
define('API_URL', 'http:
define('BASE_URL', 'http:
ini_set('session.cookie_httponly', 1);
ini_set('session.use_secure_cookies', 0); 
ini_set('session.cookie_samesite', 'Lax');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection error',
        'error' => $e->getMessage()
    ]);
    exit();
}
function sendResponse($success, $message, $data = null, $status_code = 200) {
    http_response_code($status_code);
    $response = [
        'success' => $success,
        'message' => $message
    ];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit();
}
function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(false, 'Unauthorized: Please login first', null, 401);
    }
    return $_SESSION['user_id'];
}
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)));
}
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT);
}
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}
function getUserById($user_id) {
    global $conn;
    $stmt = $conn->prepare("SELECT id, username, email, phone, full_name, created_at FROM users WHERE id = ? AND is_active = TRUE");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_assoc();
}
function logError($message, $file = null) {
    $log_file = __DIR__ . '/logs/error.log';
    if (!is_dir(dirname($log_file))) {
        mkdir(dirname($log_file), 0755, true);
    }
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[$timestamp] $message" . ($file ? " (File: $file)" : "") . "\n";
    error_log($log_message, 3, $log_file);
}
?>
