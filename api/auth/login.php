<?php
require_once __DIR__ . '/../../config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Invalid request method. Use POST.', null, 405);
}
$input = json_decode(file_get_contents("php:
if (!isset($input['username']) || !isset($input['password'])) {
    sendResponse(false, 'Username dan password harus diisi', null, 400);
}
$username = sanitizeInput($input['username']);
$password = $input['password'];
$stmt = $conn->prepare("SELECT id, username, email, password, phone, full_name FROM users WHERE (username = ? OR email = ?) AND is_active = TRUE");
$stmt->bind_param("ss", $username, $username);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    sendResponse(false, 'Username/Email atau password salah', null, 401);
}
$user = $result->fetch_assoc();
if (!verifyPassword($password, $user['password'])) {
    sendResponse(false, 'Username/Email atau password salah', null, 401);
}
$stmt = $conn->prepare("SELECT total_points FROM user_rewards WHERE user_id = ?");
$stmt->bind_param("i", $user['id']);
$stmt->execute();
$reward_result = $stmt->get_result();
$reward_data = $reward_result->fetch_assoc();
$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['email'] = $user['email'];
sendResponse(true, 'Login berhasil!', [
    'user_id' => $user['id'],
    'username' => $user['username'],
    'email' => $user['email'],
    'phone' => $user['phone'],
    'points' => $reward_data['total_points'] ?? 0
], 200);
?>
