<?php
/**
 * Admin API - Update Booking Points
 * File: api/admin/update-points.php
 * Method: POST
 */

require_once __DIR__ . '/../../config.php';

// Check admin session
$admin_id = $_SESSION['admin_id'] ?? null;
if (!$admin_id) {
    sendResponse(false, 'Unauthorized. Silakan login sebagai admin.', null, 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Invalid request method. Use POST.', null, 405);
}

try {
    $input = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($input['bookingId']) || !isset($input['points'])) {
        sendResponse(false, 'Missing bookingId or points', null, 400);
    }

    $booking_id = intval($input['bookingId']);
    $new_points = intval($input['points']);

    // Get current booking
    $stmt = $conn->prepare("SELECT user_id, points_earned FROM bookings WHERE id = ?");
    $stmt->bind_param("i", $booking_id);
    $stmt->execute();
    $booking = $stmt->get_result()->fetch_assoc();

    if (!$booking) {
        sendResponse(false, 'Booking tidak ditemukan', null, 404);
    }

    $user_id = $booking['user_id'];
    $old_points = $booking['points_earned'];
    $points_diff = $new_points - $old_points;

    // Update booking points
    $stmt = $conn->prepare("UPDATE bookings SET points_earned = ? WHERE id = ?");
    $stmt->bind_param("ii", $new_points, $booking_id);
    
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }

    // Update user total points
    if ($points_diff !== 0) {
        $stmt = $conn->prepare("UPDATE user_rewards SET total_points = total_points + ? WHERE user_id = ?");
        $stmt->bind_param("ii", $points_diff, $user_id);
        $stmt->execute();
    }

    sendResponse(true, 'Poin booking berhasil diperbarui!', [
        'booking_id' => $booking_id,
        'old_points' => $old_points,
        'new_points' => $new_points,
        'points_diff' => $points_diff
    ], 200);

} catch (Exception $e) {
    logError('Update Points Error: ' . $e->getMessage());
    sendResponse(false, 'Gagal update poin', null, 500);
}
?>
