<?php
require_once '../../config.php';

// Check admin session
if (!isset($_SESSION['admin_id'])) {
    sendResponse(false, 'Unauthorized', null, 401);
    exit;
}

// Only allow PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(false, 'Method not allowed', null, 405);
    exit;
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['bookingId']) || !isset($input['status'])) {
        sendResponse(false, 'bookingId and status are required', null, 400);
        exit;
    }
    
    $bookingId = sanitizeInput($input['bookingId']);
    $status = sanitizeInput($input['status']);
    
    // Validate status
    $validStatuses = ['pending', 'confirm', 'done', 'rejected'];
    if (!in_array($status, $validStatuses)) {
        sendResponse(false, 'Invalid status', null, 400);
        exit;
    }
    
    // Update booking status
    $query = "UPDATE bookings SET status = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        throw new Exception($conn->error);
    }
    
    $stmt->bind_param('si', $status, $bookingId);
    
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
    
    if ($stmt->affected_rows === 0) {
        sendResponse(false, 'Booking not found', null, 404);
        exit;
    }
    
    sendResponse(true, 'Booking status updated successfully', [
        'bookingId' => $bookingId,
        'newStatus' => $status
    ]);
    
} catch (Exception $e) {
    sendResponse(false, $e->getMessage(), null, 500);
}
?>
