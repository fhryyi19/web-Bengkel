<?php
require_once __DIR__ . '/../../config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(false, 'Invalid request method. Use PUT.', null, 405);
}
$user_id = checkAuth();
$input = json_decode(file_get_contents("php:
if (!isset($input['bookingId']) || !isset($input['customerName']) || !isset($input['customerPhone']) || !isset($input['serviceDate'])) {
    sendResponse(false, 'Missing required fields', null, 400);
}
$booking_id = intval($input['bookingId']);
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
        sendResponse(false, 'Missing serviceId or customServiceName', null, 400);
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
$stmt = $conn->prepare("SELECT id, points_earned FROM bookings WHERE id = ? AND user_id = ?");
$stmt->bind_param("ii", $booking_id, $user_id);
$stmt->execute();
$bookingResult = $stmt->get_result();
if ($bookingResult->num_rows === 0) {
    sendResponse(false, 'Booking tidak ditemukan atau Anda tidak memiliki akses', null, 404);
}
$oldBooking = $bookingResult->fetch_assoc();
$oldPoints = $oldBooking['points_earned'];
try {
    $pointsDifference = 0;
    $stmt = $conn->prepare("UPDATE bookings SET service_type = ?, service_name = ?, booking_date = ?, customer_name = ?, customer_phone = ?, points_earned = ? WHERE id = ?");
    $stmt->bind_param("sssssii", $service_type, $service_name, $service_date, $customer_name, $customer_phone, $points_earned, $booking_id);
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    if ($oldPoints !== $points_earned) {
        $pointsDifference = $points_earned - $oldPoints;
        $stmt = $conn->prepare("UPDATE user_rewards SET total_points = total_points + ? WHERE user_id = ?");
        $stmt->bind_param("ii", $pointsDifference, $user_id);
        $stmt->execute();
    }
    sendResponse(true, 'Booking berhasil diupdate! ' . ($pointsDifference > 0 ? '+' : '') . $pointsDifference . ' Poin', [
        'booking_id' => $booking_id,
        'service_name' => $service_name,
        'booking_date' => $service_date,
        'points_earned' => $points_earned,
        'points_change' => $pointsDifference
    ], 200);
} catch (Exception $e) {
    logError('Update Booking Error: ' . $e->getMessage());
    sendResponse(false, 'Update booking gagal', null, 500);
}
?>
