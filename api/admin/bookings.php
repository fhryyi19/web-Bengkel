<?php
/**
 * Admin API - Get Bookings
 * File: api/admin/bookings.php
 * Method: GET
 */

require_once __DIR__ . '/../../config.php';

// Check admin session
$admin_id = $_SESSION['admin_id'] ?? null;
if (!$admin_id) {
    sendResponse(false, 'Unauthorized. Silakan login sebagai admin.', null, 401);
}

try {
    $stmt = $conn->prepare("
        SELECT 
            b.id, 
            b.user_id,
            b.customer_name, 
            b.customer_phone, 
            b.service_type,
            b.service_name, 
            b.booking_date, 
            b.points_earned, 
            b.status,
            u.username,
            u.email
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        ORDER BY b.created_at DESC
    ");
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $bookings[] = $row;
    }
    
    sendResponse(true, 'Bookings retrieved successfully', [
        'bookings' => $bookings,
        'count' => count($bookings)
    ]);
    
} catch (Exception $e) {
    logError('Get Bookings Error: ' . $e->getMessage());
    sendResponse(false, 'Gagal memuat booking', null, 500);
}
?>
