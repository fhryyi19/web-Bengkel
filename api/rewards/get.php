<?php
require_once __DIR__ . '/../../config.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, 'Invalid request method. Use GET.', null, 405);
}
try {
    $stmt = $conn->prepare("SELECT id, reward_name, points_required, description, reward_image FROM reward_shop WHERE is_active = TRUE ORDER BY points_required ASC");
    $stmt->execute();
    $result = $stmt->get_result();
    $rewards = [];
    while ($row = $result->fetch_assoc()) {
        $rewards[] = $row;
    }
    $user_points = 0;
    if (isset($_SESSION['user_id'])) {
        $stmt = $conn->prepare("SELECT total_points FROM user_rewards WHERE user_id = ?");
        $stmt->bind_param("i", $_SESSION['user_id']);
        $stmt->execute();
        $user_reward = $stmt->get_result()->fetch_assoc();
        $user_points = $user_reward['total_points'] ?? 0;
    }
    sendResponse(true, 'Rewards retrieved', [
        'rewards' => $rewards,
        'user_points' => $user_points
    ], 200);
} catch (Exception $e) {
    logError('Get Rewards Error: ' . $e->getMessage());
    sendResponse(false, 'Gagal mengambil data reward', null, 500);
}
?>
