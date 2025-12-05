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
            rr.id,
            rr.user_id,
            u.username,
            rr.reward_type,
            rr.reward_name,
            rr.points_used,
            rr.status,
            rr.created_at
        FROM reward_redemptions rr
        JOIN users u ON rr.user_id = u.id
        ORDER BY rr.created_at DESC
        LIMIT 100
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception($conn->error);
    }
    
    $rewards = [];
    while ($row = $result->fetch_assoc()) {
        $rewards[] = $row;
    }
    
    sendResponse(true, 'Rewards loaded successfully', [
        'rewards' => $rewards
    ]);

} catch (Exception $e) {
    sendResponse(false, $e->getMessage(), null, 500);
}
?>
