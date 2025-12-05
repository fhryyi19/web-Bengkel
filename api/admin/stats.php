<?php
require_once '../../config.php';

// Check admin session
if (!isset($_SESSION['admin_id'])) {
    sendResponse(false, 'Unauthorized', null, 401);
    exit;
}

try {
    // Total users
    $userResult = $conn->query("SELECT COUNT(*) as count FROM users");
    $totalUsers = $userResult->fetch_assoc()['count'];

    // Pending bookings
    $pendingResult = $conn->query("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'");
    $pendingBookings = $pendingResult->fetch_assoc()['count'];

    // Done bookings
    $doneResult = $conn->query("SELECT COUNT(*) as count FROM bookings WHERE status = 'done'");
    $doneBookings = $doneResult->fetch_assoc()['count'];

    // Total services
    $serviceResult = $conn->query("SELECT COUNT(*) as count FROM services WHERE is_active = 1");
    $totalServices = $serviceResult->fetch_assoc()['count'];

    sendResponse(true, 'Stats loaded successfully', [
        'total_users' => (int)$totalUsers,
        'pending_bookings' => (int)$pendingBookings,
        'done_bookings' => (int)$doneBookings,
        'total_services' => (int)$totalServices
    ]);

} catch (Exception $e) {
    sendResponse(false, $e->getMessage(), null, 500);
}
?>
