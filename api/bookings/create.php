<?php
require_once __DIR__ . '/../../config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Invalid request method. Use POST.', null, 405);
}
$user_id = checkAuth();
$input = json_decode(file_get_contents("php:
$required = ['customerName', 'customerPhone', 'serviceDate'];
foreach ($required as $field) {
    if (!isset($input[$field])) {
        sendResponse(false, "Field $field harus diisi", null, 400);
    }
}
$customer_name = sanitizeInput($input['customerName']);
$customer_phone = sanitizeInput($input['customerPhone']);
$service_date = sanitizeInput($input['serviceDate']);
$service_type = '';
$service_name = '';
$points_earned = 0;
if (!empty($input['customServiceName'])) {
    $service_type = 'custom';
    $service_name = sanitizeInput($input['customServiceName']);
    $points_earned = 0; 
} else {
    if (!isset($input['serviceId'])) {
        sendResponse(false, 'Field serviceId atau customServiceName harus diisi', null, 400);
    }
    $service_id = intval($input['serviceId']);
    $stmt = $conn->prepare("SELECT id, service_key, service_name, points_earned FROM services WHERE id = ? AND is_active = TRUE");
    $stmt->bind_param("i", $service_id);
    $stmt->execute();
    $service = $stmt->get_result()->fetch_assoc();
    if (!$service) {
        sendResponse(false, 'Layanan tidak ditemukan atau tidak aktif', null, 400);
    }
    $service_type = $service['service_key'];
    $service_name = $service['service_name'];
    $points_earned = $service['points_earned'];
}
if (!strtotime($service_date)) {
    sendResponse(false, 'Tanggal tidak valid', null, 400);
}
try {
    $stmt = $conn->prepare("INSERT INTO bookings (user_id, service_type, service_name, booking_date, customer_name, customer_phone, points_earned, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')");
    $stmt->bind_param("isssssi", $user_id, $service_type, $service_name, $service_date, $customer_name, $customer_phone, $points_earned);
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    $booking_id = $conn->insert_id;
    $stmt = $conn->prepare("INSERT INTO user_rewards (user_id, total_points) SELECT ?, 0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM user_rewards WHERE user_id = ?)");
    $stmt->bind_param("ii", $user_id, $user_id);
    $stmt->execute();
    $stmt = $conn->prepare("UPDATE user_rewards SET total_points = total_points + ? WHERE user_id = ?");
    $stmt->bind_param("ii", $points_earned, $user_id);
    $stmt->execute();
    $stmt = $conn->prepare("SELECT total_points FROM user_rewards WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $updated_points = $stmt->get_result()->fetch_assoc();
    sendResponse(true, 'Booking berhasil dibuat! +' . $points_earned . ' Poin', [
        'booking_id' => $booking_id,
        'booking_date' => $service_date,
        'service_name' => $service_name,
        'points_earned' => $points_earned,
        'total_points' => $updated_points['total_points'] ?? 0,
        'status' => 'pending'
    ], 201);
} catch (Exception $e) {
    logError('Create Booking Error: ' . $e->getMessage());
    sendResponse(false, 'Booking gagal. Coba lagi nanti.', null, 500);
}
?>
