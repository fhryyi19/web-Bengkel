<?php
require_once '../../config.php';

// Check admin session
if (!isset($_SESSION['admin_id'])) {
    sendResponse(false, 'Unauthorized', null, 401);
    exit;
}

try {
    $query = "
        SELECT 
            u.id,
            u.username,
            u.email,
            u.phone,
            COUNT(b.id) as booking_count,
            COALESCE(ur.total_points, 0) as total_points
        FROM users u
        LEFT JOIN bookings b ON u.id = b.user_id
        LEFT JOIN user_rewards ur ON u.id = ur.user_id
        GROUP BY u.id
        ORDER BY u.id DESC
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception($conn->error);
    }
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    
    sendResponse(true, 'Users loaded successfully', [
        'users' => $users
    ]);

} catch (Exception $e) {
    sendResponse(false, $e->getMessage(), null, 500);
}
?>
