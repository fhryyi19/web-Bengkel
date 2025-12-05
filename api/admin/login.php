<?php
/**
 * Admin Login API
 * File: api/admin/login.php
 * Method: POST
 */

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Invalid request method', null, 405);
}

try {
    $input = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($input['username']) || !isset($input['password'])) {
        sendResponse(false, 'Username dan password harus diisi', null, 400);
    }

    $username = sanitizeInput($input['username']);
    $password = $input['password'];

    // Get admin from database
    $stmt = $conn->prepare("SELECT id, username, password, email, full_name FROM admin WHERE username = ? AND is_active = TRUE");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $admin = $stmt->get_result()->fetch_assoc();

    if (!$admin) {
        sendResponse(false, 'Username atau password salah', null, 401);
    }

    // Verify password (using password_verify for bcrypt)
    if (!password_verify($password, $admin['password'])) {
        sendResponse(false, 'Username atau password salah', null, 401);
    }

    // Set session
    $_SESSION['admin_id'] = $admin['id'];
    $_SESSION['admin_username'] = $admin['username'];

    sendResponse(true, 'Login berhasil!', [
        'admin_id' => $admin['id'],
        'username' => $admin['username'],
        'email' => $admin['email'],
        'full_name' => $admin['full_name']
    ], 200);

} catch (Exception $e) {
    logError('Admin Login Error: ' . $e->getMessage());
    sendResponse(false, 'Login gagal', null, 500);
}
?>
