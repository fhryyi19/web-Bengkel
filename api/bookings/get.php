<?php
require_once __DIR__ . '/../../config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, 'Invalid request method. Use GET.', null, 405);
}
$user_id = checkAuth();
try {
    $stmt = $conn->prepare("SELECT id, service_type, service_name, booking_date, customer_name, customer_phone, points_earned, status, created_at FROM bookings WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $st = strtolower($row['status'] ?? 'pending');
        if (in_array($st, ['confirmed', 'confirm', 'accepted'])) {
            $row['status'] = 'confirm';
        } elseif (in_array($st, ['completed', 'done'])) {
            $row['status'] = 'done';
        } elseif (in_array($st, ['rejected', 'reject', 'cancelled', 'cancel'])) {
            $row['status'] = 'rejected';
        } else {
            $row['status'] = 'pending';
        }
        $bookings[] = $row;
    }
    sendResponse(true, 'Bookings retrieved', [
        'bookings' => $bookings,
        'total' => count($bookings)
    ], 200);
} catch (Exception $e) {
    logError('Get Bookings Error: ' . $e->getMessage());
    sendResponse(false, 'Gagal mengambil data booking', null, 500);
}
?>
