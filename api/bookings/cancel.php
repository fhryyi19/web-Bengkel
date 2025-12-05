<?php
require_once __DIR__ . '/../../config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendResponse(false, 'Invalid request method. Use DELETE.', null, 405);
}
$user_id = checkAuth();
$input = json_decode(file_get_contents("php:
if (!isset($input['bookingId'])) {
    sendResponse(false, 'Booking ID harus diisi', null, 400);
}
$booking_id = intval($input['bookingId']);
$stmt = $conn->prepare("SELECT points_earned, status FROM bookings WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $booking_id, $user_id);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    sendResponse(false, 'Booking tidak ditemukan atau Anda tidak memiliki akses', null, 404);
}
$booking = $result->fetch_assoc();
$currentStatus = strtolower($booking['status'] ?? 'pending');
if (in_array($currentStatus, ['confirm', 'done'])) {
    sendResponse(false, 'Tidak dapat membatalkan booking yang sudah dikonfirmasi atau selesai', null, 400);
}
try {
    $stmt = $conn->prepare("DELETE FROM bookings WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $booking_id, $user_id);
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    $points_to_deduct = (int) $booking['points_earned'];
    if ($points_to_deduct > 0) {
        $stmt = $conn->prepare("UPDATE user_rewards SET total_points = GREATEST(0, total_points - ?) WHERE user_id = ?");
        $stmt->bind_param("ii", $points_to_deduct, $user_id);
        $stmt->execute();
    }
    $stmt = $conn->prepare("SELECT total_points FROM user_rewards WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $updated_points = $stmt->get_result()->fetch_assoc();
    sendResponse(true, 'Booking berhasil dibatalkan', [
        'booking_id' => $booking_id,
        'points_deducted' => $points_to_deduct,
        'total_points' => $updated_points['total_points'] ?? 0
    ], 200);
} catch (Exception $e) {
    logError('Cancel Booking Error: ' . $e->getMessage());
    sendResponse(false, 'Pembatalan booking gagal', null, 500);
}
?>
