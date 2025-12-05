<?php
require_once __DIR__ . '/../../config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Invalid request method. Use POST.', null, 405);
}
$input = json_decode(file_get_contents("php:
if (!isset($input['username']) || !isset($input['email']) || !isset($input['password']) || !isset($input['passwordConfirm'])) {
    sendResponse(false, 'Missing required fields: username, email, password, passwordConfirm', null, 400);
}
$username = sanitizeInput($input['username']);
$email = sanitizeInput($input['email']);
$phone = isset($input['phone']) ? sanitizeInput($input['phone']) : '';
$password = $input['password'];
$passwordConfirm = $input['passwordConfirm'];
if (strlen($username) < 3 || strlen($username) > 50) {
    sendResponse(false, 'Username harus 3-50 karakter', null, 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, 'Email tidak valid', null, 400);
}
if (strlen($password) < 6) {
    sendResponse(false, 'Password minimal 6 karakter', null, 400);
}
if ($password !== $passwordConfirm) {
    sendResponse(false, 'Password dan konfirmasi password tidak cocok', null, 400);
}
$stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    sendResponse(false, 'Username sudah terdaftar. Gunakan username lain.', null, 400);
}
$stmt->close();
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    sendResponse(false, 'Email sudah terdaftar. Gunakan email lain.', null, 400);
}
$stmt->close();
$hashed_password = hashPassword($password);
try {
    $stmt = $conn->prepare("INSERT INTO users (username, email, password, phone) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $username, $email, $hashed_password, $phone);
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    $user_id = $conn->insert_id;
    $stmt = $conn->prepare("INSERT INTO user_rewards (user_id, total_points, points_used) VALUES (?, 0, 0)");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    sendResponse(true, 'Registrasi berhasil! Silakan login.', [
        'user_id' => $user_id,
        'username' => $username,
        'email' => $email
    ], 201);
} catch (Exception $e) {
    logError('Sign Up Error: ' . $e->getMessage());
    sendResponse(false, 'Registrasi gagal. Coba lagi nanti.', null, 500);
}
?>
